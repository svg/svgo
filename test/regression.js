'use strict';

const fs = require('fs');
const util = require('util');
const zlib = require('zlib');
const stream = require('stream');
const fetch = require('node-fetch');
const tarStream = require('tar-stream');
const getStream = require('get-stream');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { optimize } = require('../lib/svgo.js');

const pipeline = util.promisify(stream.pipeline);

const readSvgFiles = async () => {
  const svgFiles = [];
  const response = await fetch(
    'https://www.w3.org/Graphics/SVG/Test/20110816/archives/W3C_SVG_11_TestSuite.tar.gz'
  );
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    try {
      // ignore all animated svg
      if (
        header.name.startsWith('svg/') &&
        // hard to detect the end of animation
        header.name.includes('animate') === false &&
        // fails because removeEmptyContainers removes <g> used in script
        header.name !== 'svg/coords-dom-03-f.svg' &&
        header.name !== 'svg/coords-dom-04-f.svg' &&
        // fails because <defs><font-face> is removed
        header.name !== 'svg/coords-viewattr-01-b.svg' &&
        // fails because script is not run in base64
        header.name !== 'svg/masking-path-12-f.svg'
      ) {
        if (header.name.endsWith('.svg')) {
          // strip folder and extension
          const name = header.name.slice('svg/'.length, -'.svg'.length);
          const string = await getStream(stream);
          svgFiles.push([name, string]);
        }
        if (header.name.endsWith('.svgz')) {
          // strip folder and extension
          const name = header.name.slice('svg/'.length, -'.svgz'.length);
          const string = await getStream(stream.pipe(zlib.createGunzip()));
          svgFiles.push([name, string]);
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    stream.resume();
    next();
  });
  await pipeline(response.body, extract);
  return svgFiles;
};

const optimizeSvgFiles = (svgFiles) => {
  const optimizedFiles = new Map();
  let failed = 0;
  for (const [name, string] of svgFiles) {
    try {
      const result = optimize(string, { path: name });
      if (result.error) {
        console.error(result.error);
        console.error(`File: ${name}`);
        failed += 1;
        continue;
      } else {
        optimizedFiles.set(name, result.data);
      }
    } catch (error) {
      console.error(error);
      console.error(`File: ${name}`);
      failed += 1;
      continue;
    }
  }
  if (failed !== 0) {
    throw Error(`Failed to optimize ${failed} cases`);
  }
  return optimizedFiles;
};

const chunkInto = (array, chunksCount) => {
  // take upper bound to include tail
  const chunkSize = Math.ceil(array.length / chunksCount);
  const result = [];
  for (let i = 0; i < chunksCount; i += 1) {
    const offset = i * chunkSize;
    result.push(array.slice(offset, offset + chunkSize));
  }
  return result;
};

const runTests = async ({ svgFiles }) => {
  const optimizedFiles = optimizeSvgFiles(svgFiles);
  let skipped = 0;
  let mismatched = 0;
  let passed = 0;
  console.info('Start browser...');
  const processFile = async (page, name, string) => {
    const optimized = optimizedFiles.get(name);
    const width = 960;
    const height = 720;
    await page.goto(`data:image/svg+xml,${encodeURIComponent(string)}`);
    await page.setViewportSize({ width, height });
    const draft = await page.$('#draft-watermark');
    if (draft != null) {
      console.info(`${name} is skipped`);
      skipped += 1;
      return;
    }
    const originalBuffer = await page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width, height },
    });
    await page.goto(`data:image/svg+xml,${encodeURIComponent(optimized)}`);
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
      height
    );
    // ignore small aliasing issues
    if (matched <= 4) {
      console.info(`${name} is passed`);
      passed += 1;
    } else {
      mismatched += 1;
      console.error(`${name} is mismatched`);
      await fs.promises.mkdir('diffs', { recursive: true });
      await fs.promises.writeFile(
        `diffs/${name}.diff.png`,
        PNG.sync.write(diff)
      );
    }
  };
  const browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const chunks = chunkInto(svgFiles, 8);
  await Promise.all(
    chunks.map(async (chunk) => {
      const page = await context.newPage();
      for (const [name, string] of chunk) {
        await processFile(page, name, string);
      }
      await page.close();
    })
  );
  await browser.close();
  console.info(`Skipped: ${skipped}`);
  console.info(`Mismatched: ${mismatched}`);
  console.info(`Passed: ${passed}`);
  return mismatched === 0;
};

(async () => {
  try {
    const start = process.hrtime.bigint();
    console.info('Download W3C SVG 1.1 Test Suite and extract svg files');
    const svgFiles = await readSvgFiles();
    const passed = await runTests({ svgFiles });
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
