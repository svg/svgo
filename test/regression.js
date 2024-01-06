/**
 * @typedef {import('playwright').Page} Page
 * @typedef {import('playwright').PageScreenshotOptions} PageScreenshotOptions
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'http';
import os from 'os';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';
import { optimize } from '../lib/svgo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const width = 960;
const height = 720;

const FILE_PATTERN = new RegExp('.*');
let configFileName;
const DEFAULT_CONFIG = {
  floatPrecision: 4,
};
const CONFIG = configFileName ? readConfigFile(configFileName) : DEFAULT_CONFIG;

const stats = {};

/** @type {PageScreenshotOptions} */
const screenshotOptions = {
  omitBackground: true,
  clip: { x: 0, y: 0, width, height },
  animations: 'disabled',
  timeout: 80000,
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
    const fileStats = {};
    stats[name.replaceAll('\\', '/')] = fileStats;
    await page.goto(`http://localhost:5000/original/${name}`, {
      timeout: 80000,
    });
    const originalBuffer = await page.screenshot(screenshotOptions);
    await page.goto(`http://localhost:5000/optimized/${name}`, {
      timeout: 80000,
    });
    const optimizedBufferPromise = page.screenshot(screenshotOptions);

    const writeDiffs = process.env.NO_DIFF == null;
    const diff = writeDiffs && new PNG({ width, height });
    const originalPng = PNG.sync.read(originalBuffer);
    const optimizedPng = PNG.sync.read(await optimizedBufferPromise);
    const matched = pixelmatch(
      originalPng.data,
      optimizedPng.data,
      diff ? diff.data : null,
      width,
      height,
    );
    // ignore small aliasing issues
    if (matched <= 4) {
      console.info(`${name} is passed`);
      passed++;
      fileStats.result = 'pass';
    } else {
      mismatched++;
      console.error(`${name} is mismatched`);
      fileStats.result = 'mismatch';
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
      if (!FILE_PATTERN.test(item)) {
        continue;
      }
      await processFile(page, item);
    }
    await page.close();
  };

  const browser = await chromium.launch();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width, height },
  });
  await Promise.all(
    Array.from(new Array(os.cpus().length * 2), () => worker()),
  );
  await browser.close();
  console.info(`Mismatched: ${mismatched}`);
  console.info(`Passed: ${passed}`);
  return mismatched === 0;
};

function readConfigFile(fileName) {
  const data = fsSync.readFileSync(fileName);
  const json = JSON.parse(data);
  return json;
}

(async () => {
  try {
    const start = process.hrtime.bigint();
    const fixturesDir = path.join(__dirname, 'regression-fixtures');
    const filesPromise = fs.readdir(fixturesDir, { recursive: true });
    const server = http.createServer(async (req, res) => {
      const name = req.url.slice(req.url.indexOf('/', 1));
      const statsName = name.substring(1);
      let file;
      try {
        file = await fs.readFile(path.join(fixturesDir, name), 'utf-8');
      } catch (error) {
        res.statusCode = 404;
        res.end();
        return;
      }

      if (req.url.startsWith('/original/')) {
        stats[statsName].lengthOrig = file.length;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(file);
        return;
      }
      if (req.url.startsWith('/optimized/')) {
        const optimized = optimize(file, CONFIG);
        stats[statsName].lengthOpt = optimized.data.length;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(optimized.data);
        return;
      }
      throw new Error(`unknown path ${req.url}`);
    });
    await new Promise((resolve) => {
      server.listen(5000, resolve);
    });
    const list = (await filesPromise).filter((name) => name.endsWith('.svg'));
    const passed = await runTests(list);
    server.close();
    const end = process.hrtime.bigint();
    const diff = (end - start) / BigInt(1e6);

    // Write statistics.
    const statArray = [
      ['Name', 'Result', 'Orig Len', 'Opt Len', 'Reduction'].join('\t'),
    ];
    let totalReduction = 0;
    for (const name of Object.keys(stats).sort()) {
      const fileStats = stats[name];
      const orig = fileStats.lengthOrig;
      const opt = fileStats.lengthOpt;
      const reduction = orig - opt;
      totalReduction += reduction;
      statArray.push([name, fileStats.result, orig, opt, reduction].join('\t'));
    }
    const statsFileName = `tmp/regression-stats-${new Date()
      .toISOString()
      .replaceAll(':', '')
      .substring(0, 17)}.tsv`;
    await fs.mkdir(path.dirname(statsFileName), { recursive: true });
    await fs.writeFile(statsFileName, statArray.join('\n'));

    console.info(`Total reduction ${totalReduction} bytes`);
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
