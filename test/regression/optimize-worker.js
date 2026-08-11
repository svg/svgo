import fs from 'node:fs/promises';
import path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';
import { optimize } from '../../lib/svgo.js';
import { md5sum, pathToPosix } from './lib.js';

/** @type {import('../../lib/types.js').Config} */
const SVGO_OPTS = { floatPrecision: 4 };

if (parentPort == null) {
  throw new Error('Optimization worker must run in a worker thread');
}
const port = parentPort;

port.on('message', async ({ name }) => {
  try {
    const original = await fs.readFile(
      path.join(workerData.fixturesPath, name),
      'utf8',
    );
    const optimized = optimize(original, SVGO_OPTS).data;
    const file = path.join(workerData.optimizedPath, name);

    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, optimized);

    port.postMessage({
      name: pathToPosix(name),
      checksum: md5sum(optimized),
      originalBytes: Buffer.byteLength(original, 'utf8'),
      optimizedBytes: Buffer.byteLength(optimized, 'utf8'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(`Failed to optimize ${name}: ${message}`), {
      cause: error,
    });
  }
});
