import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ODiffServer } from 'odiff-bin';
import {
  compareImages,
  getPngWidth,
  isMatchingDiff,
  stopODiffServer,
} from './compare-images.js';

const base = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4AWP8DwQMQMDEAAUAPfgEADYYS7QAAAAASUVORK5CYII=',
  'base64',
);
const onePixelDifference = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4AWNkYGD4DwQMTP///2cAAQBG7wb9Wf6MzgAAAABJRU5ErkJggg==',
  'base64',
);
const layoutDifference = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAEUlEQVR4AWP8DwQMUMDEgAQAXfAEAGfJVbAAAAAASUVORK5CYII=',
  'base64',
);

describe('compareImages', () => {
  const previousCI = process.env.CI;
  process.env.CI = 'true';
  const server = new ODiffServer();

  afterAll(async () => {
    await stopODiffServer(server);
    if (previousCI == null) {
      delete process.env.CI;
    } else {
      process.env.CI = previousCI;
    }
  });

  it('returns zero for identical images', async () => {
    await expect(compareImages(server, base, base)).resolves.toBe(0);
  });

  it('returns the exact number of different pixels', async () => {
    await expect(compareImages(server, base, onePixelDifference)).resolves.toBe(
      1,
    );
  });

  it('treats layout differences as unbounded mismatches', async () => {
    await expect(compareImages(server, base, layoutDifference)).resolves.toBe(
      Infinity,
    );
  });

  it('writes requested pixel and layout differences', async () => {
    const tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'svgo-odiff-'));
    try {
      const pixelDiff = path.join(tempPath, 'pixel.png');
      const layoutDiff = path.join(tempPath, 'nested', 'layout.png');

      await compareImages(server, base, onePixelDifference, pixelDiff);
      await compareImages(server, base, layoutDifference, layoutDiff);

      await expect(fs.stat(pixelDiff)).resolves.toBeDefined();
      await expect(fs.stat(layoutDiff)).resolves.toBeDefined();
    } finally {
      await fs.rm(tempPath, { recursive: true, force: true });
    }
  });
});

describe('isMatchingDiff', () => {
  it('reads the image width without decoding PNG pixels', () => {
    expect(getPngWidth(base)).toBe(2);
    expect(getPngWidth(layoutDifference)).toBe(3);
  });

  it('preserves the existing small aliasing allowance', () => {
    expect(isMatchingDiff(16, 3)).toBe(true);
    expect(isMatchingDiff(16, 4)).toBe(false);
    expect(isMatchingDiff(17, 4)).toBe(true);
    expect(isMatchingDiff(17, 5)).toBe(false);
  });
});
