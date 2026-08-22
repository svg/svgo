import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Tinypool from 'tinypool';
import {
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  writeReport,
} from './regression-io.js';
import { pathToPosix } from './lib.js';

// Keep concurrent large ASTs bounded on memory-constrained CI runners.
const DEFAULT_OPTIMIZE_WORKERS = Math.min(os.availableParallelism(), 2);
const workerUrl = new URL('./optimize-worker.js', import.meta.url);

/**
 * @param {ReadonlyArray<string>} list
 * @returns {Promise<Partial<import('./regression-io.js').TestReport>>}
 */
const optimizeFixtures = async (list) => {
  const totalFiles = list.length;
  let processed = 0;

  /** @type {Pick<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>} */
  const report = {
    metrics: {
      bytesSaved: 0,
      timeTakenSecs: 0,
      peakMemoryAlloc: 0,
    },
    checksums: {},
  };

  const workerCount = Math.min(DEFAULT_OPTIMIZE_WORKERS, list.length);
  if (workerCount !== 0) {
    const pool = new Tinypool({
      filename: workerUrl.href,
      minThreads: workerCount,
      maxThreads: workerCount,
    });
    /** @type {import('./optimize-worker.js').OptimizeResult[]} */
    let results;
    try {
      results = await Promise.all(
        list.map(async (name) => {
          const result = await pool.run({
            name,
            originalPath: path.join(REGRESSION_FIXTURES_PATH, name),
            optimizedPath: path.join(REGRESSION_OPTIMIZED_PATH, name),
          });
          if (process.stdout.isTTY) {
            process.stdout.clearLine(0);
            process.stdout.write(
              `\rOptimized ${(++processed).toLocaleString()} of ${totalFiles.toLocaleString()}…`,
            );
          }
          return result;
        }),
      );
    } finally {
      await pool.destroy();
    }

    for (const result of results) {
      report.checksums[pathToPosix(result.name)] = result.checksum;
      report.metrics.bytesSaved += result.bytesSaved;
    }
  }

  report.metrics.timeTakenSecs = process.uptime();
  report.metrics.peakMemoryAlloc = process.resourceUsage().maxRSS;
  return report;
};

(async () => {
  try {
    const filesPromise = fs.readdir(REGRESSION_FIXTURES_PATH, {
      recursive: true,
    });
    const list = (await filesPromise).filter((name) => name.endsWith('.svg'));
    const report = await optimizeFixtures(list);
    console.log();
    await writeReport(report);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
