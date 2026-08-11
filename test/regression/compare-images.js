import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * @param {import('odiff-bin').ODiffServer} server
 * @returns {Promise<void>}
 */
export async function stopODiffServer(server) {
  const implementation = /** @type {import('odiff-bin').ODiffServer & {
    process: import('node:child_process').ChildProcess | null,
    exiting: boolean,
  }} */ (server);
  const child = implementation.process;
  if (child == null || child.exitCode != null) {
    server.stop();
    return;
  }

  const stopped = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out while stopping odiff server'));
    }, 5000);
    const cleanup = () => {
      clearTimeout(timeout);
      child.off('exit', done);
      child.off('close', done);
      child.off('error', fail);
    };
    const done = () => {
      cleanup();
      resolve(undefined);
    };
    /** @param {Error} error */
    const fail = (error) => {
      cleanup();
      reject(error);
    };

    child.once('exit', done);
    child.once('close', done);
    child.once('error', fail);
  });

  server.stop();
  implementation.exiting = true;
  try {
    await stopped;
  } finally {
    implementation.exiting = false;
  }
}

/**
 * @param {Buffer} png
 * @returns {number}
 */
export function getPngWidth(png) {
  return png.readUInt32BE(16);
}

/**
 * @param {number} width
 * @param {number} diffCount
 * @returns {boolean}
 */
export function isMatchingDiff(width, diffCount) {
  const threshold = width <= 16 ? 3 : 4;
  return diffCount <= threshold;
}

/**
 * @param {import('odiff-bin').ODiffServer} server
 * @param {Buffer} original
 * @param {Buffer} optimized
 * @param {string=} diffPath
 * @returns {Promise<number>}
 */
export async function compareImages(server, original, optimized, diffPath) {
  const outputPath =
    diffPath ?? path.join(os.tmpdir(), `svgo-odiff-${crypto.randomUUID()}.png`);
  try {
    if (diffPath) {
      await fs.mkdir(path.dirname(diffPath), { recursive: true });
    }
    const result = await server.compareBuffers(
      original,
      'png',
      optimized,
      'png',
      outputPath,
      {
        threshold: 0.1,
        antialiasing: true,
        failOnLayoutDiff: diffPath == null,
      },
    );

    if (result.match) {
      return 0;
    }
    if (result.reason === 'pixel-diff') {
      return result.diffCount;
    }
    return Infinity;
  } finally {
    if (diffPath == null) {
      await fs.rm(outputPath, { force: true });
    }
  }
}
