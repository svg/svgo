import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { optimize } from '../../lib/svgo.js';

/** @type {import('../../lib/types.js').Config} */
const SVGO_OPTS = { floatPrecision: 4 };

/**
 * @typedef OptimizeTask
 * @property {string} name
 * @property {string} originalPath
 * @property {string} optimizedPath
 *
 * @typedef OptimizeResult
 * @property {string} name
 * @property {number} bytesSaved
 * @property {string} checksum
 */

/**
 * @param {OptimizeTask} task
 * @returns {Promise<OptimizeResult>}
 */
export default async function optimizeFixture(task) {
  const original = await fs.readFile(task.originalPath, 'utf8');
  const optimized = optimize(original, SVGO_OPTS).data;

  await fs.mkdir(path.dirname(task.optimizedPath), { recursive: true });
  await fs.writeFile(task.optimizedPath, optimized);

  return {
    name: task.name,
    bytesSaved:
      Buffer.byteLength(original, 'utf8') -
      Buffer.byteLength(optimized, 'utf8'),
    checksum: crypto.createHash('md5').update(optimized).digest('hex'),
  };
}
