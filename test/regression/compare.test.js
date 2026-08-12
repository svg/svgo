import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';

jest.unstable_mockModule('playwright', () => ({ chromium: {} }));

const { compareScreenshots, runTests, withCleanup } =
  await import('./compare.js');

describe('withCleanup', () => {
  test('preserves the primary error when cleanup also fails', async () => {
    await expect(
      withCleanup(
        async () => {
          throw new Error('primary failed');
        },
        async () => {
          throw new Error('cleanup failed');
        },
      ),
    ).rejects.toThrow('primary failed');
  });
});

describe('compareScreenshots', () => {
  test('applies the existing width-dependent mismatch allowance', async () => {
    const results = [
      { name: 'small.svg', matched: 3, width: 16 },
      { name: 'large.svg', matched: 4, width: 17 },
    ];

    await expect(
      compareScreenshots(['small.svg', 'large.svg'], {
        workerCount: 1,
        compare: async () => results.shift(),
      }),
    ).resolves.toEqual([
      { name: 'small.svg', isMatch: true },
      { name: 'large.svg', isMatch: true },
    ]);
  });

  test('rejects differences immediately above both match allowances', async () => {
    const results = [
      { name: 'small.svg', matched: 4, width: 16 },
      { name: 'large.svg', matched: 5, width: 17 },
    ];

    await expect(
      compareScreenshots(['small.svg', 'large.svg'], {
        workerCount: 1,
        compare: async () => results.shift(),
      }),
    ).resolves.toEqual([
      { name: 'small.svg', isMatch: false },
      { name: 'large.svg', isMatch: false },
    ]);
  });

  test('rejects when a worker exits before returning its fixture', async () => {
    class ExitingWorker extends EventEmitter {
      postMessage() {
        queueMicrotask(() => this.emit('exit', 1));
      }

      async terminate() {}
    }

    await expect(
      compareScreenshots(['fixture.svg'], {
        workerCount: 1,
        Worker: ExitingWorker,
      }),
    ).rejects.toThrow('Comparison worker exited with code 1');
  });

  test('terminates workers created before pool construction fails', async () => {
    const terminate = jest.fn();
    let constructions = 0;
    class FailingWorker extends EventEmitter {
      constructor() {
        super();
        if (++constructions === 2) {
          throw new Error('worker unavailable');
        }
      }

      terminate() {
        terminate();
      }
    }

    await expect(
      compareScreenshots(['one.svg', 'two.svg'], {
        workerCount: 2,
        Worker: FailingWorker,
      }),
    ).rejects.toThrow('worker unavailable');
    expect(terminate).toHaveBeenCalledTimes(1);
  });
});

describe('runTests', () => {
  let screenshotPath;

  beforeEach(async () => {
    screenshotPath = await fs.mkdtemp(path.join(os.tmpdir(), 'svgo-run-'));
  });

  afterEach(async () => {
    await fs.rm(screenshotPath, { recursive: true, force: true });
  });

  test('finishes rendering before comparison and removes screenshots', async () => {
    const events = [];
    await fs.writeFile(path.join(screenshotPath, 'partial.png'), 'png');

    const report = await runTests(['fixture.svg'], {
      screenshotPath,
      readVersion: async () => 'version',
      render: async () => events.push('render'),
      compare: async () => {
        events.push('compare');
        return [{ name: 'fixture.svg', isMatch: true }];
      },
    });

    expect(events).toEqual(['render', 'compare']);
    expect(report.results.match).toBe(1);
    await expect(fs.stat(screenshotPath)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('removes partial screenshots after rendering fails', async () => {
    await fs.writeFile(path.join(screenshotPath, 'partial.png'), 'png');

    await expect(
      runTests(['fixture.svg'], {
        screenshotPath,
        readVersion: async () => 'version',
        render: async () => {
          throw new Error('render failed');
        },
        compare: async () => [],
      }),
    ).rejects.toThrow('render failed');
    await expect(fs.stat(screenshotPath)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('preserves a comparison error when root cleanup also fails', async () => {
    const cleanup = jest.fn(async () => {
      throw new Error('cleanup failed');
    });
    await expect(
      runTests(['fixture.svg'], {
        screenshotPath,
        readVersion: async () => 'version',
        render: async () => {},
        compare: async () => {
          throw new Error('comparison failed');
        },
        cleanup,
      }),
    ).rejects.toThrow('comparison failed');
    expect(cleanup).toHaveBeenCalled();
  });
});
