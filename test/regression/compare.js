import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import Tinypool from 'tinypool';
import { expectMismatch, ignore, skip } from './file-lists.js';
import { md5sum, pathToPosix, printReport } from './lib.js';
import {
  readReport,
  readVersion,
  REGRESSION_DIFFS_PATH,
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  REGRESSION_SCREENSHOT_CACHE_PATH,
  writeReport,
} from './regression-io.js';

const NAVIGATION_TIMEOUT_MS = 0;
const WIDTH = 960;
const HEIGHT = 720;
const availableParallelism = os.availableParallelism?.() ?? os.cpus().length;
const DEFAULT_RENDER_WORKERS = os.cpus().length * 2;
const DEFAULT_COMPARE_WORKERS = Math.min(availableParallelism, 2);
const workerUrl = new URL('./compare-worker.js', import.meta.url);

/** @type {import('playwright').PageScreenshotOptions} */
const screenshotOptions = {
  omitBackground: true,
  animations: 'disabled',
};

/** @param {string} version */
const getScreenshotCacheKey = (version) =>
  md5sum(
    JSON.stringify({
      suite: version,
      version: 1,
      chromium: chromium.executablePath(),
      platform: process.platform,
      arch: process.arch,
      imageOS: process.env.ImageOS,
      imageVersion: process.env.ImageVersion,
      viewport: [WIDTH, HEIGHT],
      screenshotOptions,
    }),
  );

/**
 * @param {string} cacheKey
 * @param {string} name
 * @param {string} checksum
 */
const getScreenshotPaths = (cacheKey, name, checksum) => ({
  originalPath: path.join(
    REGRESSION_SCREENSHOT_CACHE_PATH,
    cacheKey,
    'original',
    `${name}.png`,
  ),
  optimizedPath: path.join(
    REGRESSION_SCREENSHOT_CACHE_PATH,
    cacheKey,
    'optimized',
    name,
    `${checksum}.png`,
  ),
});

/** @param {string} file */
const fileExists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

/** @param {string[]} args */
export function parseArguments(args) {
  const { values } = parseArgs({
    args,
    options: {
      'no-diff': { type: 'boolean' },
    },
    strict: true,
  });
  return { noDiff: values['no-diff'] ?? false };
}

/**
 * @typedef {import('./compare-worker.js').CompareResult} CompareResult
 * @typedef {{ name: string, isMatch: boolean }} MatchResult
 * @typedef {{ run: (value: import('./compare-worker.js').CompareOptions) => Promise<CompareResult>, destroy: () => Promise<void> }} ComparePool
 */

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ cacheKey: string, checksums: Record<string, string>, workerCount?: number }} options
 */
export async function renderScreenshots(list, options) {
  /** @type {Array<{ name: string, originalPath: string, optimizedPath: string, hasOriginal: boolean, hasOptimized: boolean }>} */
  const queue = [];
  for (const name of list) {
    const checksum = options.checksums[pathToPosix(name)];
    if (checksum == null) {
      throw new Error(`Missing optimized checksum for ${name}`);
    }
    const paths = getScreenshotPaths(options.cacheKey, name, checksum);
    const [hasOriginal, hasOptimized] = await Promise.all([
      fileExists(paths.originalPath),
      fileExists(paths.optimizedPath),
    ]);
    if (!hasOriginal || !hasOptimized) {
      queue.push({ name, ...paths, hasOriginal, hasOptimized });
    }
  }

  const workerCount = Math.min(
    options.workerCount ?? DEFAULT_RENDER_WORKERS,
    queue.length,
  );
  if (workerCount === 0) {
    return;
  }

  /**
   * @param {import('playwright').ElementHandle} element
   * @param {string} output
   */
  const screenshot = async (element, output) => {
    const temporary = `${output}.tmp`;
    await fs.mkdir(path.dirname(output), { recursive: true });
    try {
      const png = await element.screenshot(screenshotOptions);
      await fs.writeFile(temporary, png);
      await fs.rename(temporary, output);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  };

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: WIDTH, height: HEIGHT },
    });
    context.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

    const worker = async () => {
      const page = await context.newPage();
      try {
        let task;
        while ((task = queue.pop())) {
          if (!task.hasOriginal) {
            await page.goto(
              `file://${path.join(REGRESSION_FIXTURES_PATH, task.name)}`,
            );
            const element = await page.waitForSelector('svg');
            await screenshot(element, task.originalPath);
          }
          if (!task.hasOptimized) {
            await page.goto(
              `file://${path.join(REGRESSION_OPTIMIZED_PATH, task.name)}`,
            );
            const element = await page.waitForSelector('svg');
            await screenshot(element, task.optimizedPath);
          }
        }
      } finally {
        await page.close();
      }
    };

    const outcomes = await Promise.allSettled(
      Array.from({ length: workerCount }, worker),
    );
    const failed = outcomes.find((outcome) => outcome.status === 'rejected');
    if (failed) {
      throw failed.reason;
    }
  } finally {
    await browser.close();
  }
}

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ pool?: ComparePool, noDiff?: boolean, cacheKey?: string, checksums?: Record<string, string> }=} options
 * @returns {Promise<MatchResult[]>}
 */
export async function compareScreenshots(list, options = {}) {
  if (list.length === 0) {
    return [];
  }
  const workerCount = Math.min(DEFAULT_COMPARE_WORKERS, list.length);
  const pool =
    options.pool ??
    new Tinypool({
      filename: workerUrl.href,
      minThreads: workerCount,
      maxThreads: workerCount,
    });
  let compared;
  try {
    compared = await Promise.all(
      list.map((name) => {
        const paths = getScreenshotPaths(
          options.cacheKey ?? 'test',
          name,
          options.checksums?.[pathToPosix(name)] ?? 'current',
        );
        return pool.run({
          name,
          ...paths,
          diffPath: options.noDiff
            ? null
            : path.join(REGRESSION_DIFFS_PATH, `${name}.diff.png`),
        });
      }),
    );
  } finally {
    await pool.destroy();
  }
  return compared.map((result) => ({
    name: result.name,
    isMatch: result.matched <= (result.width <= 16 ? 3 : 4),
  }));
}

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ readVersion?: () => Promise<string>, render?: (list: ReadonlyArray<string>) => Promise<unknown>, compare?: (list: ReadonlyArray<string>) => Promise<Array<{ name: string, isMatch: boolean }>>, cacheKey?: string, checksums?: Record<string, string>, now?: () => number, log?: (message: string) => unknown, noDiff?: boolean }=} options
 * @returns {Promise<Omit<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>>}
 */
export async function runTests(list, options = {}) {
  const versionReader = options.readVersion ?? readVersion;
  const render =
    options.render ??
    ((pending) =>
      renderScreenshots(pending, {
        cacheKey: options.cacheKey ?? 'test',
        checksums: options.checksums ?? {},
      }));
  const now = options.now ?? performance.now.bind(performance);
  const log = options.log ?? console.info;
  const version = await versionReader();
  /** @type {Omit<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>} */
  const report = {
    version,
    files: {
      toMatch: list.length - expectMismatch.length - ignore.length,
      toMismatch: expectMismatch.length,
      toIgnore: ignore.length,
      toSkip: skip.length,
    },
    results: { match: 0, expectMismatch: 0, ignored: 0 },
    errors: { shouldHaveMatched: [], shouldHaveMismatched: [] },
  };

  const renderStarted = now();
  await render(list);
  const compareStarted = now();
  log(
    `Rendered screenshots in ${((compareStarted - renderStarted) / 1000).toFixed(2)}s`,
  );
  const results = options.compare
    ? await options.compare(list)
    : await compareScreenshots(list, {
        cacheKey: options.cacheKey,
        checksums: options.checksums,
        noDiff: options.noDiff,
      });
  log(
    `Compared screenshots in ${((now() - compareStarted) / 1000).toFixed(2)}s`,
  );
  for (const { name, isMatch } of results) {
    const namePosix = pathToPosix(name);
    const expectedToMismatch = expectMismatch.includes(namePosix);
    if (isMatch) {
      if (expectedToMismatch) {
        report.errors.shouldHaveMismatched.push(namePosix);
      } else if (ignore.includes(namePosix)) {
        report.results.ignored++;
      } else {
        report.results.match++;
      }
    } else if (expectedToMismatch) {
      report.results.expectMismatch++;
    } else if (!ignore.includes(namePosix)) {
      report.errors.shouldHaveMatched.push(namePosix);
    }
  }
  return report;
}

async function main() {
  try {
    const { noDiff } = parseArguments(process.argv.slice(2));
    const list = (
      await fs.readdir(REGRESSION_FIXTURES_PATH, { recursive: true })
    ).filter((name) => name.endsWith('.svg'));
    const optimizationReport = await readReport();
    const version = await readVersion();
    const cacheKey = getScreenshotCacheKey(version);
    const checksums = optimizationReport.checksums ?? {};
    const report = await runTests(list, {
      cacheKey,
      checksums,
      noDiff,
    });
    const combinedReport = { ...report, ...optimizationReport };
    printReport(
      /** @type {import('./regression-io.js').TestReport} */ (combinedReport),
    );
    await writeReport(combinedReport);
    if (
      report.results.match !== report.files.toMatch ||
      report.results.expectMismatch !== report.files.toMismatch
    ) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
