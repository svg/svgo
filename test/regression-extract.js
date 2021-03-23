'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const stream = require('stream');
const fetch = require('node-fetch');
const tarStream = require('tar-stream');
const getStream = require('get-stream');

const pipeline = util.promisify(stream.pipeline);

const extractTarGz = (baseDir, include) => {
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    try {
      if (include == null || include.test(header.name)) {
        if (header.name.endsWith('.svg')) {
          const file = path.join(baseDir, header.name);
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(stream, fs.createWriteStream(file));
        }
        if (header.name.endsWith('.svgz')) {
          // .svgz -> .svg
          const file = path.join(baseDir, header.name.slice(0, -1));
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(
            stream,
            zlib.createGunzip(),
            fs.createWriteStream(file)
          );
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    stream.resume();
    next();
  });
  return extract;
};

const extractW3cSvg11TestSuite = async () => {
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
  await pipeline(
    fileStream,
    extractTarGz(
      path.join(__dirname, 'regression-fixtures', 'w3c-svg-11-test-suite'),
      /^svg\//
    )
  );
  return svgFiles;
};

(async () => {
  try {
    console.info('Download W3C SVG 1.1 Test Suite and extract svg files');
    await extractW3cSvg11TestSuite();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
