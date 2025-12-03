import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { expectMismatch, ignore, skip } from './file-lists.js';
import { pathToPosix, printReport } from './lib.js';
import {
  readReport,
  readVersion,
  REGRESSION_DIFFS_PATH,
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  writeReport,
} from './regression-io.js';

const NAVIGATION_TIMEOUT_MS = 0;
const WIDTH = 960;
const HEIGHT = 720;

/** @type {import('playwright').PageScreenshotOptions} */
const screenshotOptions = {
  omitBackground: true,
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
    await page.goto(`file://${path.join(REGRESSION_FIXTURES_PATH, name)}`);
    let element = await page.waitForSelector('svg');
    const originalBuffer = await element.screenshot(screenshotOptions);

    await page.goto(`file://${path.join(REGRESSION_OPTIMIZED_PATH, name)}`);
    element = await page.waitForSelector('svg');
    const optimizedBufferPromise = element.screenshot(screenshotOptions);

    const originalPng = PNG.sync.read(originalBuffer);
    const optimizedPng = PNG.sync.read(await optimizedBufferPromise);
    const writeDiffs = process.env.NO_DIFF == null;
    const diff = writeDiffs
      ? new PNG({ width: originalPng.width, height: originalPng.height })
      : null;

    const matched = pixelmatch(
      originalPng.data,
      optimizedPng.data,
      diff?.data,
      originalPng.width,
      originalPng.height,
    );

    // ignore small aliasing issues
    const isMatch = matched <= 4;
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
    } else {
      if (expectedToMismatch) {
        report.results.expectMismatch++;
      } else if (!ignore.includes(namePosix)) {
        report.errors.shouldHaveMatched.push(namePosix);
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

    const report = await runTests(list);
    const metrics = await readReport();
    const combinedReport = {
      ...report,
      ...metrics,
    };

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
