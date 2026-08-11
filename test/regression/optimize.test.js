import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { Worker } from 'node:worker_threads';
import {
  getHeavyWorkerCount,
  getWorkerCount,
  optimizeFixtures,
} from './optimize.js';

const workerUrl = new URL('./optimize-worker.js', import.meta.url);

describe('regression optimization worker', () => {
  /** @type {string} */
  let tempPath;
  /** @type {Worker | undefined} */
  let worker;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'svgo-optimize-'));
  });

  afterEach(async () => {
    await worker?.terminate();
    await fs.rm(tempPath, { recursive: true, force: true });
  });

  it('writes optimized output and returns its metrics', async () => {
    const fixturesPath = path.join(tempPath, 'fixtures');
    const optimizedPath = path.join(tempPath, 'optimized');
    const name = path.join('nested', 'example.svg');
    const original =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#ff0000"/></svg>';
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg"><path fill="red" d="M0 0h10v10H0z"/></svg>';

    await fs.mkdir(path.dirname(path.join(fixturesPath, name)), {
      recursive: true,
    });
    await fs.writeFile(path.join(fixturesPath, name), original);

    worker = new Worker(workerUrl, {
      workerData: { fixturesPath, optimizedPath },
    });
    worker.postMessage({ name });
    const [message] = await once(worker, 'message');

    await expect(
      fs.readFile(path.join(optimizedPath, name), 'utf8'),
    ).resolves.toBe(expected);
    expect(message).toEqual({
      name: 'nested/example.svg',
      checksum: '3b6937a41018bccdcb2bacde85f68fae',
      originalBytes: 91,
      optimizedBytes: 82,
    });
  });
});

describe('regression optimization pool', () => {
  /** @type {string} */
  let tempPath;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'svgo-optimize-pool-'));
  });

  afterEach(async () => {
    await fs.rm(tempPath, { recursive: true, force: true });
  });

  it('bounds workers by the configured maximum and available work', () => {
    expect(getWorkerCount(0, 4)).toBe(0);
    expect(getWorkerCount(2, 4)).toBe(2);
    expect(getWorkerCount(8, 4)).toBe(4);
    expect(getWorkerCount(8, 0)).toBe(1);
  });

  it('reserves enough memory for each heavyweight worker', () => {
    expect(getHeavyWorkerCount(0, 4, 8 * 2 ** 30)).toBe(0);
    expect(getHeavyWorkerCount(7, 4, 8 * 2 ** 30)).toBe(1);
    expect(getHeavyWorkerCount(7, 4, 16 * 2 ** 30)).toBe(2);
    expect(getHeavyWorkerCount(1, 4, 16 * 2 ** 30)).toBe(1);
  });

  it('optimizes files and aggregates their report', async () => {
    const fixturesPath = path.join(tempPath, 'fixtures');
    const optimizedPath = path.join(tempPath, 'optimized');
    const fixtures = {
      'circle.svg':
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="5"/></svg>',
      [path.join('nested', 'path.svg')]:
        '<svg xmlns="http://www.w3.org/2000/svg"><g><path d="M 0 0 L 10 10"/></g></svg>',
    };

    for (const [name, data] of Object.entries(fixtures)) {
      const file = path.join(fixturesPath, name);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, data);
    }

    const report = await optimizeFixtures(Object.keys(fixtures), {
      fixturesPath,
      optimizedPath,
      maxWorkers: 2,
    });

    await expect(
      fs.readFile(path.join(optimizedPath, 'circle.svg'), 'utf8'),
    ).resolves.toBe(fixtures['circle.svg']);
    await expect(
      fs.readFile(path.join(optimizedPath, 'nested', 'path.svg'), 'utf8'),
    ).resolves.toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="m0 0 10 10"/></svg>',
    );
    expect(report.checksums).toEqual({
      'circle.svg': '598f8a67e7a060ed41282c770fc3a070',
      'nested/path.svg': '7dd14598dcf410e106a9c3dff27cdb3c',
    });
    expect(report.metrics.bytesSaved).toBe(10);
    expect(report.metrics.timeTakenSecs).toBeGreaterThanOrEqual(0);
    expect(report.metrics.peakMemoryAlloc).toBeGreaterThan(0);
  });

  it('identifies the fixture when optimization fails', async () => {
    await expect(
      optimizeFixtures(['missing.svg'], {
        fixturesPath: path.join(tempPath, 'fixtures'),
        optimizedPath: path.join(tempPath, 'optimized'),
        maxWorkers: 2,
      }),
    ).rejects.toThrow('Failed to optimize missing.svg:');
  });

  it('propagates worker errors with the fixture name', async () => {
    const fixturesPath = path.join(tempPath, 'fixtures');
    await fs.mkdir(fixturesPath);
    await fs.writeFile(path.join(fixturesPath, 'invalid.svg'), '<svg>');

    await expect(
      optimizeFixtures(['invalid.svg'], {
        fixturesPath,
        optimizedPath: path.join(tempPath, 'optimized'),
        maxWorkers: 1,
      }),
    ).rejects.toThrow('Failed to optimize invalid.svg:');
  });

  it('completes without creating workers when there are no files', async () => {
    const report = await optimizeFixtures([], {
      fixturesPath: path.join(tempPath, 'fixtures'),
      optimizedPath: path.join(tempPath, 'optimized'),
      maxWorkers: 4,
    });

    expect(report.checksums).toEqual({});
    expect(report.metrics.bytesSaved).toBe(0);
  });
});
