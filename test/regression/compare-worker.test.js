import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { compareImages } from './compare-worker.js';

/**
 * @param {string} file
 * @param {number[][]} colors
 */
const createPng = async (file, colors) => {
  const png = new PNG({ width: colors.length, height: 1 });
  for (const [index, color] of colors.entries()) {
    png.data.set(color, index * 4);
  }
  await fs.writeFile(file, PNG.sync.write(png));
};

describe('compareImages', () => {
  /** @type {string} */
  let directory;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'svgo-compare-'));
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  test('compares cached files and writes a diff', async () => {
    const originalPath = path.join(directory, 'original.png');
    const optimizedPath = path.join(directory, 'optimized.png');
    const diffPath = path.join(directory, 'diff', 'result.png');
    const black = [0, 0, 0, 255];
    const white = [255, 255, 255, 255];
    await createPng(originalPath, [black, black, black, black, black]);
    await createPng(optimizedPath, [white, white, white, white, white]);

    await expect(
      compareImages({
        name: 'fixture.svg',
        originalPath,
        optimizedPath,
        diffPath,
      }),
    ).resolves.toEqual({ name: 'fixture.svg', matched: 5, width: 5 });
    await expect(fs.stat(diffPath)).resolves.toBeDefined();
    await expect(fs.stat(originalPath)).resolves.toBeDefined();
    await expect(fs.stat(optimizedPath)).resolves.toBeDefined();
  });

  test('does not write a diff for differences within the match allowance', async () => {
    const originalPath = path.join(directory, 'original.png');
    const optimizedPath = path.join(directory, 'optimized.png');
    const diffPath = path.join(directory, 'diff.png');
    const black = [0, 0, 0, 255];
    const white = [255, 255, 255, 255];
    await createPng(originalPath, [black]);
    await createPng(optimizedPath, [white]);

    await compareImages({
      name: 'fixture.svg',
      originalPath,
      optimizedPath,
      diffPath,
    });

    await expect(fs.stat(diffPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('does not write a diff when no path is provided', async () => {
    const originalPath = path.join(directory, 'original.png');
    const optimizedPath = path.join(directory, 'optimized.png');
    const black = [0, 0, 0, 255];
    await createPng(originalPath, [black]);
    await createPng(optimizedPath, [black]);

    await expect(
      compareImages({
        name: 'fixture.svg',
        originalPath,
        optimizedPath,
        diffPath: null,
      }),
    ).resolves.toEqual({ name: 'fixture.svg', matched: 0, width: 1 });
  });

  test('rejects images with different dimensions but equal pixel counts', async () => {
    const originalPath = path.join(directory, 'original.png');
    const optimizedPath = path.join(directory, 'optimized.png');
    const original = new PNG({ width: 1, height: 4 });
    const optimized = new PNG({ width: 2, height: 2 });
    await fs.writeFile(originalPath, PNG.sync.write(original));
    await fs.writeFile(optimizedPath, PNG.sync.write(optimized));

    await expect(
      compareImages({
        name: 'layout.svg',
        originalPath,
        optimizedPath,
        diffPath: null,
      }),
    ).rejects.toThrow('Image dimensions do not match');
  });

  test('identifies the fixture after a decode error', async () => {
    const originalPath = path.join(directory, 'original.png');
    const optimizedPath = path.join(directory, 'optimized.png');
    await fs.writeFile(originalPath, 'not a png');
    await fs.writeFile(optimizedPath, 'not a png');

    await expect(
      compareImages({
        name: 'broken.svg',
        originalPath,
        optimizedPath,
        diffPath: null,
      }),
    ).rejects.toThrow('Failed to compare broken.svg');
    await expect(fs.stat(originalPath)).resolves.toBeDefined();
    await expect(fs.stat(optimizedPath)).resolves.toBeDefined();
  });
});
