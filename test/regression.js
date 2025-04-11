/**
 * @typedef {import('playwright').Page} Page
 * @typedef {import('playwright').PageScreenshotOptions} PageScreenshotOptions
 */

import fs from 'node:fs/promises';
import http from 'http';
import os from 'os';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';
import { optimize } from '../lib/svgo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 5001;
const WIDTH = 960;
const HEIGHT = 720;

/** @type {PageScreenshotOptions} */
const screenshotOptions = {
  omitBackground: true,
  clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  animations: 'disabled',
};

/**
 * @param {string[]} list
 * @returns {Promise<boolean>}
 */
const runTests = async (list) => {
  let mismatched = 0;
  let passed = 0;
  console.info('Start browser…');
  /**
   * @param {Page} page
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
    if (matched <= 4) {
      passed++;
    } else {
      mismatched++;
      console.error(`${name} is mismatched`);
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
  await Promise.all(
    Array.from(new Array(os.cpus().length * 2), () => worker()),
  );
  await browser.close();
  console.info(`Mismatched: ${mismatched}`);
  console.info(`Passed: ${passed}`);
  return mismatched === 0;
};

(async () => {
  try {
    const start = process.hrtime.bigint();
    const fixturesDir = path.join(__dirname, 'regression-fixtures');
    const filesPromise = fs.readdir(fixturesDir, { recursive: true });
    const server = http.createServer(async (req, res) => {
      const name = req.url.slice(req.url.indexOf('/', 1));
      let file;
      try {
        file = await fs.readFile(path.join(fixturesDir, name), 'utf-8');
      } catch {
        res.statusCode = 404;
        res.end();
        return;
      }

      if (req.url.startsWith('/original/')) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(file);
        return;
      }
      if (req.url.startsWith('/optimized/')) {
        const optimized = optimize(file, {
          floatPrecision: 4,
        });
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(optimized.data);
        return;
      }
      throw new Error(`unknown path ${req.url}`);
    });
    await new Promise((resolve) => {
      server.listen(PORT, resolve);
    });
    const list = (await filesPromise).filter((name) => name.endsWith('.svg'));
    const passed = await runTests(list);
    server.close();
    const end = process.hrtime.bigint();
    const diff = (end - start) / BigInt(1e6);
    if (passed) {
      console.info(`Regression tests successfully completed in ${diff}ms`);
    } else {
      console.error(`Regression tests failed in ${diff}ms`);
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
