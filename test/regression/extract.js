/**
 * @fileoverview Download and extracts the latest version of SVGO Test Suite.
 */

import fs from 'node:fs';
import path from 'node:path';
import stream from 'node:stream';
import util from 'node:util';
import zlib from 'node:zlib';
import tarStream from 'tar-stream';
import { skip, validateFileLists } from './file-lists.js';
import {
  readPrevEtag,
  REGRESSION_FIXTURES_PATH,
  writeEtag,
  TEMP_DIR_PATH,
} from './regression-io.js';

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

  const etag = await readPrevEtag();

  /** @type {Record<string, string>} */
  const headers = {};

  if (etag) {
    headers['If-None-Match'] = etag;
  }

  const response = await fetch(url, {
    headers,
  });

  if (response.status === 200 && response.body) {
    console.info('Downloading SVGO Test Suite and extracting files…');
    await fs.promises.rm(REGRESSION_FIXTURES_PATH, {
      recursive: true,
      force: true,
    });
    await pipeline(response.body, zlib.createGunzip(), extract);
    await validateFileLists(svgs);

    const etag = response.headers.get('ETag');
    if (etag) {
      await writeEtag(etag);
    }
  } else if (response.status === 304) {
    console.info('Reusing local copy of SVGO Test Suite');
  }
};

(async () => {
  try {
    console.info('Using temporary directory: %s\n', TEMP_DIR_PATH);
    await extractTarGz(
      'https://svg.github.io/svgo-test-suite/svgo-test-suite.tar.gz',
      REGRESSION_FIXTURES_PATH,
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
