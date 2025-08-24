import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  writeReport,
} from './regression-io.js';
import { md5sum, pathToPosix } from './lib.js';
import { optimize } from '../../lib/svgo.js';

/** @type {import('../../lib/types.js').Config} */
const SVGO_OPTS = { floatPrecision: 4 };

/**
 * @param {string[]} list
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

  /**
   * @param {string} name
   */
  const processFile = async (name) => {
    const original = await fs.readFile(
      path.join(REGRESSION_FIXTURES_PATH, name),
      'utf-8',
    );
    const optimized = optimize(original, SVGO_OPTS).data;
    const namePosix = pathToPosix(name);
    report.checksums[namePosix] = md5sum(optimized);

    const prevFileSize = Buffer.byteLength(original, 'utf8');
    const resultFileSize = Buffer.byteLength(optimized, 'utf8');
    report.metrics.bytesSaved += prevFileSize - resultFileSize;

    const file = path.join(REGRESSION_OPTIMIZED_PATH, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, optimized);

    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.write(
        `\rOptimized ${(++processed).toLocaleString()} of ${totalFiles.toLocaleString()}…`,
      );
    }
  };

  const worker = async () => {
    let item;
    while ((item = list.pop())) {
      await processFile(item);
    }
  };

  await Promise.all(
    Array.from(new Array(os.cpus().length * 2), () => worker()),
  );

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
