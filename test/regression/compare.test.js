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

const {
  compareScreenshots,
  DEFAULT_RENDER_WORKERS,
  renderScreenshots,
  runTests,
  withCleanup,
} = await import('./compare.js');

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

describe('renderScreenshots', () => {
  test('renders both SVGs over the same checkerboard', async () => {
    const elements = /** @type {Array<{
      evaluate: jest.Mock,
      screenshot: jest.Mock,
    }>} */ (
      Array.from({ length: 2 }, () => ({
        evaluate: jest.fn(),
        screenshot: jest.fn(),
      }))
    );
    let selected = 0;
    const page = {
      goto: jest.fn(),
      waitForSelector: jest.fn(async () => elements[selected++]),
      close: jest.fn(async () => {}),
    };
    const context = {
      setDefaultTimeout: jest.fn(),
      newPage: jest.fn(async () => page),
    };
    const browser = {
      newContext: jest.fn(async () => context),
      close: jest.fn(async () => {}),
    };
    const chromium = /** @type {import('./compare.js').ChromiumLauncher} */ ({
      launch: jest.fn(async () => browser),
    });

    await renderScreenshots(['fixture.svg'], {
      workerCount: 1,
      chromium,
    });

    expect(browser.newContext).toHaveBeenCalledWith({
      javaScriptEnabled: false,
      viewport: { width: 960, height: 720 },
      deviceScaleFactor: 2,
    });
    for (const element of elements) {
      expect(element.evaluate).toHaveBeenCalledTimes(1);
      const applyBackground =
        /** @type {(svg: { style: { setProperty: jest.Mock } }, background: string) => void} */ (
          element.evaluate.mock.calls[0][0]
        );
      const background = /** @type {string} */ (
        element.evaluate.mock.calls[0][1]
      );
      const setProperty = jest.fn();
      const svg = { style: { setProperty } };
      applyBackground(svg, background);
      expect(setProperty).toHaveBeenCalledWith(
        'background',
        'conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0) 0 0 / 8px 8px',
        'important',
      );
      expect(element.screenshot).toHaveBeenCalledWith(
        expect.not.objectContaining({ omitBackground: true }),
      );
      expect(element.evaluate.mock.invocationCallOrder[0]).toBeLessThan(
        element.screenshot.mock.invocationCallOrder[0],
      );
    }
  });
});

describe('compareScreenshots', () => {
  test('allows up to four differing pixels', async () => {
    const odiffResults = /** @type {import('odiff-bin').ODiffResult[]} */ ([
      { match: true },
      {
        match: false,
        reason: 'pixel-diff',
        diffCount: 4,
        diffPercentage: 1,
      },
      {
        match: false,
        reason: 'pixel-diff',
        diffCount: 4,
        diffPercentage: 1,
      },
      {
        match: false,
        reason: 'pixel-diff',
        diffCount: 5,
        diffPercentage: 1,
      },
      { match: false, reason: 'layout-diff' },
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
      compareScreenshots(
        ['exact.svg', 'first.svg', 'second.svg', 'changed.svg', 'layout.svg'],
        {
          ODiffServer: FakeODiffServer,
        },
      ),
    ).resolves.toEqual([
      { name: 'exact.svg', isMatch: true },
      { name: 'first.svg', isMatch: true },
      { name: 'second.svg', isMatch: true },
      { name: 'changed.svg', isMatch: false },
      { name: 'layout.svg', isMatch: false },
    ]);
    expect(compare).toHaveBeenNthCalledWith(
      1,
      path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'exact.svg.png'),
      path.join(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, 'exact.svg.png'),
      path.join(REGRESSION_DIFFS_PATH, 'exact.svg.diff.png'),
      { threshold: 0.1, antialiasing: true },
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
      { threshold: 0.1, antialiasing: true },
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
