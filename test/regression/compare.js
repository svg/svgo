import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { expectMismatch, ignore, skip } from './file-lists.js';
import { printReport } from './lib.js';
import {
  readReport,
  readVersion,
  REGRESSION_DIFFS_PATH,
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  writeReport,
} from './regression-io.js';

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
 * @param {ReadonlyArray<string>} list
 * @returns {Promise<Omit<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>>}
 */
const runTests = async (list) => {
  const version = await readVersion();
  const listCopy = [...list];

  /** @type {Omit<import('./regression-io.js').TestReport, 'metrics' | 'checksums'>} */
  const report = {
    version,
    files: {
      toMatch: listCopy.length - expectMismatch.length - ignore.length,
      toMismatch: expectMismatch.length,
      toIgnore: ignore.length,
      toSkip: skip.length,
    },
    results: {
      match: 0,
      expectMismatch: 0,
      ignored: 0,
    },
    errors: {
      shouldHaveMatched: [],
      shouldHaveMismatched: [],
    },
  };

  const totalFiles = listCopy.length;
  let tested = 0;

  /**
   * @param {import('playwright').Page} page
   * @param {string} name
   */
  const processFile = async (page, name) => {
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
        const file = path.join(REGRESSION_DIFFS_PATH, `${name}.diff.png`);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, PNG.sync.write(diff));
      }
    }

    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.write(
        `\rCompared ${(++tested).toLocaleString()} of ${totalFiles.toLocaleString()}…`,
      );
    }
  };

  const worker = async () => {
    let item;
    const page = await context.newPage();
    while ((item = listCopy.pop())) {
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

  if (process.stdout.isTTY) {
    console.log();
  }

  return report;
};

(async () => {
  try {
    const filesPromise = fs.readdir(REGRESSION_FIXTURES_PATH, {
      recursive: true,
    });
    const list = (await filesPromise).filter((name) => name.endsWith('.svg'));

    const server = http.createServer(async (req, res) => {
      const url = /** @type {string} */ (req.url);
      const name = url.slice(url.indexOf('/', 1));

      if (!list.includes(name.slice(1))) {
        res.statusCode = 404;
        res.end();
        return;
      }

      res.setHeader('Content-Type', 'image/svg+xml');

      if (url.startsWith('/original/')) {
        res.end(
          await fs.readFile(path.join(REGRESSION_FIXTURES_PATH, name)),
        );
        return;
      }

      if (url.startsWith('/optimized/')) {
        res.end(
          await fs.readFile(path.join(REGRESSION_OPTIMIZED_PATH, name)),
        );
        return;
      }

      throw new Error(`Something went wrong on path: ${req.url}`);
    });

    await new Promise((/** @type {(value?: never) => unknown} */ resolve) => {
      server.listen(PORT, resolve);
    });

    const report = await runTests(list);
    const metrics = await readReport();
    const combinedReport = {
      ...report,
      ...metrics,
    };

    server.close();

    printReport(
      /** @type {import('./regression-io.js').TestReport}*/ (combinedReport),
    );
    await writeReport(combinedReport);

    const failed =
      report.results.match !== report.files.toMatch ||
      report.results.expectMismatch !== report.files.toMismatch;

    if (failed) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
