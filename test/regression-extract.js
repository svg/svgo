import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';
import zlib from 'zlib';
import fetch from 'node-fetch';
import tarStream from 'tar-stream';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pipeline = util.promisify(stream.pipeline);

const exclude = [
  // animated
  'svg/filters-light-04-f.svg',
  'svg/filters-composite-05-f.svg',
  // messed gradients
  'svg/pservers-grad-18-b.svg',
  // removing wrapping <g> breaks :first-child pseudo-class
  'svg/styling-pres-04-f.svg',
  // rect is converted to path which matches wrong styles
  'svg/styling-css-08-f.svg',
  // complex selectors are messed because of converting shapes to paths
  'svg/struct-use-10-f.svg',
  'svg/struct-use-11-f.svg',
  'svg/styling-css-01-b.svg',
  'svg/styling-css-04-f.svg',
  // strange artifact breaks inconsistently  breaks regression tests
  'svg/filters-conv-05-f.svg',
];

/**
 * @param {string} url
 * @param {string} baseDir
 * @param {RegExp} include
 */
const extractTarGz = async (url, baseDir, include) => {
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    const name = header.name;

    try {
      if (include == null || include.test(name)) {
        if (
          name.endsWith('.svg') &&
          !exclude.includes(name) &&
          !name.startsWith('svg/animate-')
        ) {
          const file = path.join(baseDir, name);
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(stream, fs.createWriteStream(file));
        } else if (name.endsWith('.svgz')) {
          // .svgz -> .svg
          const file = path.join(baseDir, name.slice(0, -1));
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(
            stream,
            zlib.createGunzip(),
            fs.createWriteStream(file),
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
  const response = await fetch(url);
  await pipeline(response.body, zlib.createGunzip(), extract);
};

(async () => {
  try {
    console.info('Downloading W3C SVG 1.1 Test Suite and extracting files');
    await extractTarGz(
      'https://www.w3.org/Graphics/SVG/Test/20110816/archives/W3C_SVG_11_TestSuite.tar.gz',
      path.join(__dirname, 'regression-fixtures', 'w3c-svg-11-test-suite'),
      /^svg\//,
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
