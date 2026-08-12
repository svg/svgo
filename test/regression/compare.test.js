import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';
import {
  REGRESSION_DIFFS_PATH,
  REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
  REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
} from './regression-io.js';

jest.unstable_mockModule('playwright', () => ({ chromium: {} }));

const { compareScreenshots, DEFAULT_RENDER_WORKERS, runTests, withCleanup } =
  await import('./compare.js');

test('uses the original render concurrency for comparison', () => {
  expect(DEFAULT_RENDER_WORKERS).toBe(os.cpus().length * 2);
});

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
  test('compares files and creates nested diff directories with odiff', async () => {
    const previousCI = process.env.CI;
    process.env.CI = 'true';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const name = 'odiff-test/nested/fixture.svg';
    const originalPath = path.join(
      REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
      `${name}.png`,
    );
    const optimizedPath = path.join(
      REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
      `${name}.png`,
    );
    const diffPath = path.join(REGRESSION_DIFFS_PATH, `${name}.diff.png`);
    const black = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==',
      'base64',
    );
    const white = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScL1WQAAAABJRU5ErkJggg==',
      'base64',
    );
    await fs.mkdir(path.dirname(originalPath), { recursive: true });
    await fs.mkdir(path.dirname(optimizedPath), { recursive: true });
    await fs.writeFile(originalPath, black);
    await fs.writeFile(optimizedPath, white);

    try {
      await expect(compareScreenshots([name])).resolves.toEqual([
        { name, isMatch: false },
      ]);
      await expect(fs.stat(diffPath)).resolves.toBeDefined();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      if (previousCI == null) {
        delete process.env.CI;
      } else {
        process.env.CI = previousCI;
      }
      await Promise.all([
        fs.rm(path.join(REGRESSION_DIFFS_PATH, 'odiff-test'), {
          recursive: true,
          force: true,
        }),
        fs.rm(path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'odiff-test'), {
          recursive: true,
          force: true,
        }),
        fs.rm(path.join(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, 'odiff-test'), {
          recursive: true,
          force: true,
        }),
      ]);
    }
  });

  test('maps strict odiff results and writes differences to the report path', async () => {
    const odiffResults = /** @type {import('odiff-bin').ODiffResult[]} */ ([
      { match: true },
      {
        match: false,
        reason: 'pixel-diff',
        diffCount: 1,
        diffPercentage: 1,
      },
    ]);
    const compare = jest.fn(
      async () =>
        /** @type {import('odiff-bin').ODiffResult} */ (odiffResults.shift()),
    );
    const stop = jest.fn();
    class FakeODiffServer {
      compare = compare;
      stop = stop;
    }

    await expect(
      compareScreenshots(['match.svg', 'strict.svg'], {
        ODiffServer: FakeODiffServer,
      }),
    ).resolves.toEqual([
      { name: 'match.svg', isMatch: true },
      { name: 'strict.svg', isMatch: false },
    ]);
    expect(compare).toHaveBeenNthCalledWith(
      1,
      path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'match.svg.png'),
      path.join(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, 'match.svg.png'),
      path.join(REGRESSION_DIFFS_PATH, 'match.svg.diff.png'),
    );
    expect(compare).toHaveBeenNthCalledWith(
      2,
      path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'strict.svg.png'),
      path.join(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, 'strict.svg.png'),
      path.join(REGRESSION_DIFFS_PATH, 'strict.svg.diff.png'),
    );
    expect(stop).toHaveBeenCalledTimes(1);
  });

  test('uses disposable output paths when differences are disabled', async () => {
    const previousNoDiff = process.env.NO_DIFF;
    process.env.NO_DIFF = '1';
    const compare = jest.fn(async () => /** @type {const} */ ({ match: true }));
    class FakeODiffServer {
      compare = compare;
      stop() {}
    }

    try {
      await compareScreenshots(['nested/fixture.svg'], {
        ODiffServer: FakeODiffServer,
      });
    } finally {
      if (previousNoDiff == null) {
        delete process.env.NO_DIFF;
      } else {
        process.env.NO_DIFF = previousNoDiff;
      }
    }

    expect(compare).toHaveBeenCalledWith(
      path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'nested/fixture.svg.png'),
      path.join(
        REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
        'nested/fixture.svg.png',
      ),
      path.join(
        REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
        'nested/fixture.svg.png.diff.png',
      ),
    );
  });

  test('stops odiff after a comparison failure', async () => {
    const stop = jest.fn();
    class FailingODiffServer {
      /** @returns {Promise<import('odiff-bin').ODiffResult>} */
      async compare() {
        throw new Error('odiff failed');
      }
      stop = stop;
    }

    await expect(
      compareScreenshots(['fixture.svg'], {
        ODiffServer: FailingODiffServer,
      }),
    ).rejects.toThrow('odiff failed');
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe('runTests', () => {
  /** @type {string} */
  let screenshotPath;

  beforeEach(async () => {
    screenshotPath = await fs.mkdtemp(path.join(os.tmpdir(), 'svgo-run-'));
  });

  afterEach(async () => {
    await fs.rm(screenshotPath, { recursive: true, force: true });
  });

  test('finishes rendering before comparison and removes screenshots', async () => {
    /** @type {string[]} */
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

  test('reports rendering and comparison durations', async () => {
    /** @type {string[]} */
    const messages = [];
    let now = 0;

    await runTests(['fixture.svg'], {
      screenshotPath,
      readVersion: async () => 'version',
      render: async () => {
        now = 1500;
      },
      compare: async () => {
        now = 4000;
        return [{ name: 'fixture.svg', isMatch: true }];
      },
      now: () => now,
      log: (message) => messages.push(message),
    });

    expect(messages).toEqual([
      'Rendered screenshots in 1.50s',
      'Compared screenshots in 2.50s',
    ]);
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
