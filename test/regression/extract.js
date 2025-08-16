import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';
import zlib from 'zlib';
import tarStream from 'tar-stream';
import { fileURLToPath } from 'url';
import { skip, validateFileLists } from './file-lists.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pipeline = util.promisify(stream.pipeline);

/**
 * @param {string} url
 * @param {string} baseDir
 */
const extractTarGz = async (url, baseDir) => {
  /** @type {string[]} */
  const svgs = [];
  const extract = tarStream.extract();

  extract.on('entry', async (header, stream, next) => {
    const name = header.name.slice(16);
    const isSvg = name.endsWith('.svg');

    if (name === 'VERSION' || isSvg) {
      if (isSvg) {
        svgs.push(name);
      }

      if (!skip.includes(name)) {
        if (name.includes('..')) {
          throw Error(`File in archive includes path traversal: ${name}`);
        }

        try {
          const file = path.join(baseDir, name);
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(stream, fs.createWriteStream(file));
        } catch (error) {
          console.error(error);
          process.exit(1);
        }
      }
    }

    stream.resume();
    next();
  });

  const { body } = await fetch(url);

  if (!body) {
    throw Error('No body returned when fetching SVGO Test Suite.');
  }

  await pipeline(body, zlib.createGunzip(), extract);
  await validateFileLists(svgs);
};

(async () => {
  try {
    console.info('Downloading SVGO Test Suite and extracting files');
    await extractTarGz(
      'https://svg.github.io/svgo-test-suite/svgo-test-suite.tar.gz',
      path.join(__dirname, 'regression-fixtures'),
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
