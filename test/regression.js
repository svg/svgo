'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { optimize } = require('../lib/svgo.js');

const runTests = async ({ list }) => {
  let skipped = 0;
  let mismatched = 0;
  let passed = 0;
  list.reverse();
  console.info('Start browser...');
  const processFile = async (page, name) => {
    if (
      // animated
      name.startsWith('w3c-svg-11-test-suite/svg/animate-') ||
      name === 'w3c-svg-11-test-suite/svg/filters-light-04-f.svg' ||
      name === 'w3c-svg-11-test-suite/svg/filters-composite-05-f.svg' ||
      // messed gradients
      name === 'w3c-svg-11-test-suite/svg/pservers-grad-18-b.svg' ||
      // removing wrapping <g> breaks :first-child pseudo-class
      name === 'w3c-svg-11-test-suite/svg/styling-pres-04-f.svg' ||
      // rect is converted to path which matches wrong styles
      name === 'w3c-svg-11-test-suite/svg/styling-css-08-f.svg' ||
      // complex selectors are messed because of converting shapes to paths
      name === 'w3c-svg-11-test-suite/svg/struct-use-10-f.svg' ||
      name === 'w3c-svg-11-test-suite/svg/struct-use-11-f.svg' ||
      name === 'w3c-svg-11-test-suite/svg/styling-css-01-b.svg' ||
      name === 'w3c-svg-11-test-suite/svg/styling-css-04-f.svg' ||
      // strange artifact breaks inconsistently  breaks regression tests
      name === 'w3c-svg-11-test-suite/svg/filters-conv-05-f.svg'
    ) {
      console.info(`${name} is skipped`);
      skipped += 1;
      return;
    }
    await page.goto(`http://localhost:5000/original/${name}`);
    await page.setViewportSize({ width, height });
    const originalBuffer = await page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width, height },
    });
    await page.goto(`http://localhost:5000/optimized/${name}`);
    const optimizedBuffer = await page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width, height },
    });
    const originalPng = PNG.sync.read(originalBuffer);
    const optimizedPng = PNG.sync.read(optimizedBuffer);
    const diff = new PNG({ width, height });
    const matched = pixelmatch(
      originalPng.data,
      optimizedPng.data,
      diff.data,
      width,
      height,
    );
    // ignore small aliasing issues
    if (matched <= 4) {
      console.info(`${name} is passed`);
      passed += 1;
    } else {
      mismatched += 1;
      console.error(`${name} is mismatched`);
      if (process.env.NO_DIFF == null) {
        const file = path.join(
          __dirname,
          'regression-diffs',
          `${name}.diff.png`,
        );
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.writeFile(file, PNG.sync.write(diff));
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
  const context = await browser.newContext({ javaScriptEnabled: false });
  await Promise.all(
    Array.from(new Array(os.cpus().length * 2), () => worker()),
  );
  await browser.close();
  console.info(`Skipped: ${skipped}`);
  console.info(`Mismatched: ${mismatched}`);
  console.info(`Passed: ${passed}`);
  return mismatched === 0;
};

const readdirRecursive = async (absolute, relative = '') => {
  let result = [];
  const list = await fs.promises.readdir(absolute, { withFileTypes: true });
  for (const item of list) {
    const itemAbsolute = path.join(absolute, item.name);
    const itemRelative = path.join(relative, item.name);
    if (item.isDirectory()) {
      const itemList = await readdirRecursive(itemAbsolute, itemRelative);
      result = [...result, ...itemList];
    } else if (item.name.endsWith('.svg')) {
      result = [...result, itemRelative];
    }
  }
  return result;
};

const width = 960;
const height = 720;
(async () => {
  try {
    const start = process.hrtime.bigint();
    const fixturesDir = path.join(__dirname, 'regression-fixtures');
    const list = await readdirRecursive(fixturesDir);
    // setup server
    const server = http.createServer(async (req, res) => {
      const name = req.url.slice(req.url.indexOf("/", 1));
      const file = await fs.promises.readFile(
        path.join(fixturesDir, name),
        'utf-8',
      );

      if (req.url.startsWith('/original/')) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(file);
        return;
      }
      if (req.url.startsWith('/optimized/')) {
        const optimized = optimize(file, {
          path: name,
          floatPrecision: 4,
        });
        if (optimized.error) {
          throw new Error(`Failed to optimize ${name}`, {
            cause: optimized.error,
          });
        }
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(optimized.data);
        return;
      }
      throw new Error(`unknown path ${req.url}`);
    });
    await new Promise((resolve) => {
      server.listen(5000, resolve);
    });
    const passed = await runTests({ list });
    server.close();
    // compute time
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
