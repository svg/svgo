import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ODiffServer } from 'odiff-bin';
import { chromium } from 'playwright';
import { expectMismatch, ignore, skip } from './file-lists.js';
import { pathToPosix, printReport } from './lib.js';
import {
  readReport,
  readVersion,
  REGRESSION_DIFFS_PATH,
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
  REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
  REGRESSION_SCREENSHOTS_PATH,
  writeReport,
} from './regression-io.js';

const NAVIGATION_TIMEOUT_MS = 0;
const WIDTH = 960;
const HEIGHT = 720;
export const DEFAULT_RENDER_WORKERS = os.cpus().length * 2;

/**
 * @typedef {{ name: string, isMatch: boolean }} MatchResult
 * @typedef {{ new (): Pick<import('odiff-bin').ODiffServer, 'compare' | 'stop'> }} ODiffServerConstructor
 */

/** @type {import('playwright').PageScreenshotOptions} */
const screenshotOptions = {
  omitBackground: true,
  animations: 'disabled',
};

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @param {() => Promise<unknown>} cleanup
 * @returns {Promise<T>}
 */
export async function withCleanup(operation, cleanup) {
  let result;
  let primaryError;
  try {
    result = await operation();
  } catch (error) {
    primaryError = error;
  }
  let cleanupError;
  try {
    await cleanup();
  } catch (error) {
    cleanupError = error;
  }
  if (primaryError) {
    throw primaryError;
  }
  if (cleanupError) {
    throw cleanupError;
  }
  return /** @type {T} */ (result);
}

/**
 * @param {Pick<import('odiff-bin').ODiffServer, 'stop'>} server
 */
async function stopODiffServer(server) {
  const implementation =
    /** @type {Pick<import('odiff-bin').ODiffServer, 'stop'> & {
    process: import('node:child_process').ChildProcess | null,
    exiting: boolean,
  }} */ (server);
  const child = implementation.process;
  if (child == null || child.exitCode != null) {
    server.stop();
    return;
  }

  const stopped = new Promise((resolve, reject) => {
    child.once('exit', resolve);
    child.once('error', reject);
  });
  server.stop();
  implementation.exiting = true;
  try {
    await stopped;
  } finally {
    implementation.exiting = false;
  }
}

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ workerCount?: number }=} options
 */
export async function renderScreenshots(list, options = {}) {
  const queue = [...list];
  const workerCount = Math.min(
    options.workerCount ?? DEFAULT_RENDER_WORKERS,
    queue.length,
  );
  await fs.rm(REGRESSION_SCREENSHOTS_PATH, { recursive: true, force: true });
  await fs.mkdir(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, { recursive: true });
  await fs.mkdir(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, { recursive: true });

  const browser = await chromium.launch();
  await withCleanup(
    async () => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: WIDTH, height: HEIGHT },
      });
      context.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

      const worker = async () => {
        const page = await context.newPage();
        await withCleanup(
          async () => {
            let name;
            while ((name = queue.pop())) {
              const originalPath = path.join(
                REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
                `${name}.png`,
              );
              const optimizedPath = path.join(
                REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
                `${name}.png`,
              );

              await page.goto(
                `file://${path.join(REGRESSION_FIXTURES_PATH, name)}`,
              );
              let element = await page.waitForSelector('svg');
              await element.screenshot({
                ...screenshotOptions,
                path: originalPath,
              });

              await page.goto(
                `file://${path.join(REGRESSION_OPTIMIZED_PATH, name)}`,
              );
              element = await page.waitForSelector('svg');
              await element.screenshot({
                ...screenshotOptions,
                path: optimizedPath,
              });
            }
          },
          () => page.close(),
        );
      };

      const outcomes = await Promise.allSettled(
        Array.from({ length: workerCount }, worker),
      );
      const failed = outcomes.find((outcome) => outcome.status === 'rejected');
      if (failed) {
        throw failed.reason;
      }
    },
    () => browser.close(),
  );
}

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ ODiffServer?: ODiffServerConstructor }=} options
 * @returns {Promise<MatchResult[]>}
 */
export async function compareScreenshots(list, options = {}) {
  /** @type {MatchResult[]} */
  const results = [];
  const ODiffServerClass = options.ODiffServer ?? ODiffServer;
  const server = new ODiffServerClass();
  try {
    for (const name of list) {
      const originalPath = path.join(
        REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
        `${name}.png`,
      );
      const optimizedPath = path.join(
        REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
        `${name}.png`,
      );
      const diffPath =
        process.env.NO_DIFF == null
          ? path.join(REGRESSION_DIFFS_PATH, `${name}.diff.png`)
          : `${optimizedPath}.diff.png`;
      if (process.env.NO_DIFF == null) {
        await fs.mkdir(path.dirname(diffPath), { recursive: true });
      }
      const result = await server.compare(
        originalPath,
        optimizedPath,
        diffPath,
      );
      results.push({ name, isMatch: result.match });
    }
  } finally {
    await stopODiffServer(server);
  }
  return results;
}

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ screenshotPath?: string, readVersion?: () => Promise<string>, render?: (list: ReadonlyArray<string>) => Promise<unknown>, compare?: (list: ReadonlyArray<string>) => Promise<Array<{ name: string, isMatch: boolean }>>, cleanup?: typeof fs.rm, now?: () => number, log?: (message: string) => unknown }=} options
 * @returns {Promise<Omit<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>>}
 */
export async function runTests(list, options = {}) {
  const versionReader = options.readVersion ?? readVersion;
  const render = options.render ?? renderScreenshots;
  const compare = options.compare ?? compareScreenshots;
  const cleanup = options.cleanup ?? fs.rm;
  const now = options.now ?? performance.now.bind(performance);
  const log = options.log ?? console.info;
  const screenshotPath = options.screenshotPath ?? REGRESSION_SCREENSHOTS_PATH;
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

  let primaryError;
  try {
    const renderStarted = now();
    await render(list);
    const compareStarted = now();
    log(
      `Rendered screenshots in ${((compareStarted - renderStarted) / 1000).toFixed(2)}s`,
    );
    const results = await compare(list);
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
  } catch (error) {
    primaryError = error;
  }
  let cleanupError;
  try {
    await cleanup(screenshotPath, { recursive: true, force: true });
  } catch (error) {
    cleanupError = error;
  }
  if (primaryError) {
    throw primaryError;
  }
  if (cleanupError) {
    throw cleanupError;
  }
  return report;
}

async function main() {
  try {
    const list = (
      await fs.readdir(REGRESSION_FIXTURES_PATH, { recursive: true })
    ).filter((name) => name.endsWith('.svg'));
    const report = await runTests(list);
    const combinedReport = { ...report, ...(await readReport()) };
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
