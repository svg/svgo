import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import {
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  writeReport,
} from './regression-io.js';

const HEAVY_FILE_SIZE = 10 * 2 ** 20;
const MEMORY_PER_HEAVY_WORKER = 6 * 2 ** 30;

/**
 * @param {number} fileCount
 * @param {number} maxWorkers
 * @returns {number}
 */
export const getWorkerCount = (fileCount, maxWorkers) => {
  if (fileCount === 0) {
    return 0;
  }

  return Math.min(fileCount, Math.max(1, maxWorkers));
};

/**
 * @param {number} fileCount
 * @param {number} maxWorkers
 * @param {number} totalMemory
 * @returns {number}
 */
export const getHeavyWorkerCount = (fileCount, maxWorkers, totalMemory) => {
  const memoryLimit = Math.floor(totalMemory / MEMORY_PER_HEAVY_WORKER);
  return getWorkerCount(fileCount, Math.min(maxWorkers, memoryLimit));
};

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ fixturesPath: string, optimizedPath: string, maxWorkers: number, totalMemory?: number }} options
 * @returns {Promise<Pick<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>>}
 */
export const optimizeFixtures = async (list, options) => {
  const totalFiles = list.length;

  /** @type {Pick<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>} */
  const report = {
    metrics: {
      bytesSaved: 0,
      timeTakenSecs: 0,
      peakMemoryAlloc: 0,
    },
    checksums: {},
  };

  const jobs = await Promise.all(
    list.map(async (name) => {
      try {
        return {
          name,
          size: (await fs.stat(path.join(options.fixturesPath, name))).size,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw Object.assign(
          new Error(`Failed to optimize ${name}: ${message}`),
          { cause: error },
        );
      }
    }),
  );
  jobs.sort((a, b) => a.size - b.size);

  const heavyJobs = jobs.filter((job) => job.size >= HEAVY_FILE_SIZE);
  const regularJobs = jobs.filter((job) => job.size < HEAVY_FILE_SIZE);
  let completed = 0;

  /**
   * @param {{ name: string, size: number }[]} queue
   * @param {number} workerCount
   */
  const runWorkerPool = async (queue, workerCount) => {
    if (workerCount === 0) {
      return;
    }

    const jobCount = queue.length;
    await new Promise((resolve, reject) => {
      /** @type {Worker[]} */
      const workers = [];
      /** @type {Map<Worker, string>} */
      const activeFixtures = new Map();
      let poolCompleted = 0;
      let settled = false;

      const terminateWorkers = () =>
        Promise.all(workers.map((worker) => worker.terminate()));

      /** @param {unknown} error */
      const fail = async (error) => {
        if (settled) {
          return;
        }
        settled = true;
        await terminateWorkers();
        reject(error);
      };

      const finish = async () => {
        if (settled) {
          return;
        }
        settled = true;
        await terminateWorkers();
        resolve(undefined);
      };

      /** @param {Worker} worker */
      const dispatch = (worker) => {
        const job = queue.pop();
        if (job) {
          activeFixtures.set(worker, job.name);
          worker.postMessage({ name: job.name });
        }
      };

      for (let index = 0; index < workerCount; index++) {
        const worker = new Worker(
          new URL('./optimize-worker.js', import.meta.url),
          {
            resourceLimits: { maxOldGenerationSizeMb: 4096 },
            workerData: {
              fixturesPath: options.fixturesPath,
              optimizedPath: options.optimizedPath,
            },
          },
        );
        workers.push(worker);

        worker.on('message', (result) => {
          activeFixtures.delete(worker);
          report.checksums[result.name] = result.checksum;
          report.metrics.bytesSaved +=
            result.originalBytes - result.optimizedBytes;
          completed++;
          poolCompleted++;

          if (process.stdout.isTTY) {
            process.stdout.clearLine(0);
            process.stdout.write(
              `\rOptimized ${completed.toLocaleString()} of ${totalFiles.toLocaleString()}…`,
            );
          }

          if (poolCompleted === jobCount) {
            void finish();
          } else {
            dispatch(worker);
          }
        });
        worker.on('error', (error) => {
          const name = activeFixtures.get(worker);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const workerError = name
            ? Object.assign(
                new Error(`Failed to optimize ${name}: ${errorMessage}`),
                { cause: error },
              )
            : error;
          void fail(workerError);
        });
        worker.on('exit', (code) => {
          if (!settled) {
            const name = activeFixtures.get(worker);
            const message = name
              ? `Failed to optimize ${name}: worker exited with code ${code}`
              : `Optimization worker exited with code ${code}`;
            void fail(new Error(message));
          }
        });
        dispatch(worker);
      }
    });
  };

  await runWorkerPool(
    heavyJobs,
    getHeavyWorkerCount(
      heavyJobs.length,
      options.maxWorkers,
      options.totalMemory ?? os.totalmem(),
    ),
  );
  await runWorkerPool(
    regularJobs,
    getWorkerCount(regularJobs.length, options.maxWorkers),
  );

  report.metrics.timeTakenSecs = process.uptime();
  report.metrics.peakMemoryAlloc = process.resourceUsage().maxRSS;
  return report;
};

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  (async () => {
    try {
      const filesPromise = fs.readdir(REGRESSION_FIXTURES_PATH, {
        recursive: true,
      });
      const list = (await filesPromise).filter((name) => name.endsWith('.svg'));
      const report = await optimizeFixtures(list, {
        fixturesPath: REGRESSION_FIXTURES_PATH,
        optimizedPath: REGRESSION_OPTIMIZED_PATH,
        maxWorkers: os.cpus().length,
      });
      console.log();
      await writeReport(report);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}
