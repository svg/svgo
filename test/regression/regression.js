import fs from 'node:fs/promises';
import http from 'http';
import os from 'os';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';
import { optimize } from '../../lib/svgo.js';
import { expectMismatch, ignore, skip } from './file-lists.js';
import { md5sum, printReport } from './lib.js';

/**
 * @typedef Suite
 * @property {number} toMatch Total SVGs expected to pass tests.
 * @property {number} toMismatch Total SVGs expected to fail tests.
 * @property {number} toIgnore
 *   Total SVGs where we don't care if they pass or fail.
 * @property {number} toSkip Total SVGs we're not testing at all.
 *
 * @typedef Results
 * @property {number} match
 *   Total SVGs that were expected to match which did match.
 * @property {number} expectMismatch
 *   Total SVGs that were expected to mismatch which did mismatch.
 * @property {number} ignored
 *   Number of SVGs that matched, but the the result don't affect the success
 *   status anyway, and is not explicitly reported.
 *
 * @typedef Metrics
 * @property {number} bytesSaved Total bytes saved throughout this test run.
 * @property {number=} timeTakenSecs Total time taken throughout this test run.
 * @property {number} peakMemoryAlloc
 *   Peak memory allocation throughout this test run in kibibytes (1,024 bytes).
 *
 * @typedef Errors
 * @property {string[]} shouldHaveMatched
 * @property {string[]} shouldHaveMismatched
 *
 * @typedef TestReport
 * @property {string} version SVGO Test Suite version.
 * @property {Suite} suite
 * @property {Results} results
 * @property {Metrics} metrics
 * @property {Errors} errors
 * @property {Record<string, string>} checksums
 *   Dictionary of checksums after each SVGs has been optimized.
 *
 * @typedef SvgInMemory
 * @property {string} original
 * @property {string} optimized
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'regression-fixtures');

const NAVIGATION_TIMEOUT_MS = 1200000;
const PORT = 5001;
const WIDTH = 960;
const HEIGHT = 720;

/** @type {import('playwright').PageScreenshotOptions} */
const screenshotOptions = {
  omitBackground: true,
  clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  animations: 'disabled',
};

/**
 * SVGs that are currently loaded in memory. SVGs are deleted are loaded here
 * as required, and deleted when they're no longer required.
 *
 * @type {Record<string, SvgInMemory>}
 */
const svgsInMemory = {};

/**
 * @param {string[]} list
 * @returns {Promise<TestReport>}
 */
const runTests = async (list) => {
  const version = (
    await fs.readFile(
      path.join(__dirname, 'regression-fixtures', 'VERSION'),
      'utf-8',
    )
  ).trimEnd();
  const totalFiles = list.length;
  let processed = 0;

  /** @type {TestReport} */
  const report = {
    version,
    suite: {
      toMatch: list.length - expectMismatch.length - ignore.length,
      toMismatch: expectMismatch.length,
      toIgnore: ignore.length,
      toSkip: skip.length,
    },
    results: {
      match: 0,
      expectMismatch: 0,
      ignored: 0,
    },
    metrics: {
      bytesSaved: 0,
      peakMemoryAlloc: 0,
    },
    errors: {
      shouldHaveMatched: [],
      shouldHaveMismatched: [],
    },
    checksums: {},
  };

  console.info('Start browser…');
  /**
   * @param {import('playwright').Page} page
   * @param {string} name
   */
  const processFile = async (page, name) => {
    const original = await fs.readFile(path.join(fixturesDir, name), 'utf-8');
    const optimized = optimize(original, { floatPrecision: 4 }).data;
    report.checksums[name] = md5sum(optimized);
    svgsInMemory[name] = { original, optimized };

    await page.goto(`http://localhost:${PORT}/original/${name}`);
    const originalBuffer = await page.screenshot(screenshotOptions);

    await page.goto(`http://localhost:${PORT}/optimized/${name}`);
    const optimizedBufferPromise = page.screenshot(screenshotOptions);

    const writeDiffs = process.env.NO_DIFF == null;
    const diff = writeDiffs ? new PNG({ width: WIDTH, height: HEIGHT }) : null;
    const originalPng = PNG.sync.read(originalBuffer);
    const optimizedPng = PNG.sync.read(await optimizedBufferPromise);
    const matched = pixelmatch(
      originalPng.data,
      optimizedPng.data,
      diff?.data,
      WIDTH,
      HEIGHT,
    );

    // ignore small aliasing issues
    const isMatch = matched <= 4;
    const expectedToMismatch = expectMismatch.includes(name);

    const prevFileSize = Buffer.byteLength(original, 'utf8');
    const resultFileSize = Buffer.byteLength(optimized, 'utf8');
    report.metrics.bytesSaved += prevFileSize - resultFileSize;

    if (isMatch) {
      if (expectedToMismatch) {
        report.errors.shouldHaveMismatched.push(name);
      } else if (ignore.includes(name)) {
        report.results.ignored++;
      } else {
        report.results.match++;
      }
    } else {
      if (expectedToMismatch) {
        report.results.expectMismatch++;
      } else if (!ignore.includes(name)) {
        report.errors.shouldHaveMatched.push(name);
      }

      if (diff) {
        const file = path.join(
          __dirname,
          'regression-diffs',
          `${name}.diff.png`,
        );
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, PNG.sync.write(diff));
      }
    }

    const message = `Processed ${(++processed).toLocaleString()} of ${totalFiles.toLocaleString()}…`;

    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.write(`\r${message}`);
    } else {
      console.info(message);
    }

    delete svgsInMemory[name];
  };
  const worker = async () => {
    let item;
    const page = await context.newPage();
    while ((item = list.pop())) {
      await processFile(page, item);
    }
    await page.close();
  };

  const browser = await chromium.launch();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: WIDTH, height: HEIGHT },
  });
  context.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

  await Promise.all(
    Array.from(new Array(os.cpus().length * 2), () => worker()),
  );
  await browser.close();

  report.metrics.timeTakenSecs = Math.floor(process.uptime());
  report.metrics.peakMemoryAlloc = process.resourceUsage().maxRSS;
  return report;
};

(async () => {
  try {
    const filesPromise = fs.readdir(fixturesDir, { recursive: true });
    const server = http.createServer(async (req, res) => {
      const url = /** @type {string} */ (req.url);

      const name = url.slice(url.indexOf('/', 1) + 1);
      const svg = svgsInMemory[name];

      if (!svg) {
        res.statusCode = 404;
        res.end();
        return;
      }

      res.setHeader('Content-Type', 'image/svg+xml');

      if (url.startsWith('/original/')) {
        res.end(svg.original);
        return;
      }

      if (url.startsWith('/optimized/')) {
        res.end(svg.optimized);
        return;
      }

      throw new Error(`unknown path ${url}`);
    });

    await new Promise((/** @type {(value?: never) => unknown} */ resolve) => {
      server.listen(PORT, resolve);
    });

    const list = (await filesPromise).filter((name) => name.endsWith('.svg'));
    const report = await runTests(list);
    server.close();

    console.log('\n');

    printReport(report);

    const passed =
      report.results.match !== report.suite.toMatch ||
      report.results.expectMismatch !== report.suite.toMismatch;

    if (passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
