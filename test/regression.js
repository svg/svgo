'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const http = require('http');
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
  const cachedArchiveFile = path.join(
    process.cwd(),
    'node_modules/.cache/W3C_SVG_11_TestSuite.tar.gz'
  );
  const svgFiles = new Map();
  let fileStream;
  try {
    await fs.promises.access(cachedArchiveFile);
    fileStream = fs.createReadStream(cachedArchiveFile);
  } catch {
    const response = await fetch(
      'https://www.w3.org/Graphics/SVG/Test/20110816/archives/W3C_SVG_11_TestSuite.tar.gz'
    );
    fileStream = response.body;
    fileStream.pipe(fs.createWriteStream(cachedArchiveFile));
  }
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    try {
      if (header.name.startsWith('svg/')) {
        if (header.name.endsWith('.svg')) {
          // strip folder and extension
          const name = header.name.slice('svg/'.length, -'.svg'.length);
          const string = await getStream(stream);
          svgFiles.set(name, string);
        }
        if (header.name.endsWith('.svgz')) {
          // strip folder and extension
          const name = header.name.slice('svg/'.length, -'.svgz'.length);
          const string = await getStream(stream.pipe(zlib.createGunzip()));
          svgFiles.set(name, string);
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    stream.resume();
    next();
  });
  await pipeline(fileStream, extract);
  return svgFiles;
};

const optimizeSvgFiles = (svgFiles) => {
  const optimizedFiles = new Map();
  let failed = 0;
  for (const [name, string] of svgFiles) {
    try {
      const result = optimize(string, { path: name, floatPrecision: 4 });
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
  let skipped = 0;
  let mismatched = 0;
  let passed = 0;
  console.info('Start browser...');
  const processFile = async (page, name) => {
    if (
      // hard to detect the end of animation
      name.startsWith('animate-') ||
      // breaks because of optimisation despite of script
      name === 'interact-pointer-04-f' ||
      // messed gradients
      name === 'pservers-grad-18-b' ||
      // animated filter
      name === 'filters-light-04-f' ||
      // removing wrapping <g> breaks :first-child pseudo-class
      name === 'styling-pres-04-f' ||
      // messed case insensitivity while inlining styles
      name === 'styling-css-10-f' ||
      // rect is converted to path which matches wrong styles
      name === 'styling-css-08-f' ||
      // external image
      name === 'struct-image-02-b' ||
      // complex selectors are messed becase of converting shapes to paths
      name === 'struct-use-10-f' ||
      name === 'struct-use-11-f' ||
      name === 'styling-css-01-b' ||
      name === 'styling-css-03-b' ||
      name === 'styling-css-04-f' ||
      // strange artifact breaks inconsistently  breaks regression tests
      name === 'filters-conv-05-f'
    ) {
      console.info(`${name} is skipped`);
      skipped += 1;
      return;
    }
    const width = 960;
    const height = 720;
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
      height
    );
    // ignore small aliasing issues
    if (matched <= 4) {
      console.info(`${name} is passed`);
      passed += 1;
    } else {
      mismatched += 1;
      console.error(`${name} is mismatched`);
      if (process.env.NO_DIFF == null) {
        await fs.promises.mkdir('diffs', { recursive: true });
        await fs.promises.writeFile(
          `diffs/${name}.diff.png`,
          PNG.sync.write(diff)
        );
      }
    }
  };
  const browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const chunks = chunkInto(svgFiles, 8);
  await Promise.all(
    chunks.map(async (chunk) => {
      const page = await context.newPage();
      for (const name of chunk) {
        await processFile(page, name);
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
    const optimizedFiles = optimizeSvgFiles(svgFiles);
    const server = http.createServer((req, res) => {
      if (req.url.startsWith('/original/')) {
        const name = req.url.slice('/original/'.length);
        if (svgFiles.has(name)) {
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(svgFiles.get(name));
          return;
        }
      }
      if (req.url.startsWith('/optimized/')) {
        const name = req.url.slice('/optimized/'.length);
        if (optimizedFiles.has(name)) {
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(optimizedFiles.get(name));
          return;
        }
      }
      res.statusCode = 404;
      res.end();
    });
    await new Promise((resolve) => {
      server.listen(5000, resolve);
    });
    const passed = await runTests({ svgFiles: Array.from(svgFiles.keys()) });
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
