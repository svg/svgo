import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * @typedef CompareOptions
 * @property {string} name
 * @property {string} originalPath
 * @property {string} optimizedPath
 * @property {string | null} diffPath
 *
 * @typedef CompareResult
 * @property {string} name
 * @property {number} matched
 * @property {number} width
 */

/**
 * @param {CompareOptions} options
 * @returns {Promise<CompareResult>}
 */
export async function compareImages(options) {
  const { name, originalPath, optimizedPath, diffPath } = options;
  try {
    const [originalBuffer, optimizedBuffer] = await Promise.all([
      fs.readFile(originalPath),
      fs.readFile(optimizedPath),
    ]);
    const originalPng = PNG.sync.read(originalBuffer);
    const optimizedPng = PNG.sync.read(optimizedBuffer);
    if (
      originalPng.width !== optimizedPng.width ||
      originalPng.height !== optimizedPng.height
    ) {
      throw new Error('Image dimensions do not match');
    }
    const diff = diffPath
      ? new PNG({ width: originalPng.width, height: originalPng.height })
      : null;
    const matched = pixelmatch(
      originalPng.data,
      optimizedPng.data,
      diff?.data,
      originalPng.width,
      originalPng.height,
    );

    const threshold = originalPng.width <= 16 ? 3 : 4;
    if (diffPath && matched > threshold && diff) {
      await fs.mkdir(path.dirname(diffPath), { recursive: true });
      await fs.writeFile(diffPath, PNG.sync.write(diff));
    }

    return { name, matched, width: originalPng.width };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(`Failed to compare ${name}: ${message}`), {
      cause: error,
    });
  }
}

export default compareImages;
