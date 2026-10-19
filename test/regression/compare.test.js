import { describe, expect, test, vi } from 'vitest';

vi.mock('playwright', () => ({ chromium: {} }));

const { compareScreenshots, parseArguments, runTests } =
  await import('./compare.js');

describe('parseArguments', () => {
  test('defaults to generating diff images', () => {
    expect(parseArguments([])).toEqual({ noDiff: false });
  });

  test('disables diff images with --no-diff', () => {
    expect(parseArguments(['--no-diff'])).toEqual({ noDiff: true });
  });

  test('rejects unknown arguments', () => {
    expect(() => parseArguments(['--unknown'])).toThrow();
  });
});

describe('compareScreenshots', () => {
  test('passes the selected diff path to comparison workers', async () => {
    /** @type {Array<{ diffPath: string | null, optimizedPath: string }>} */
    const messages = [];
    const pool = {
      /** @param {{ diffPath: string | null, optimizedPath: string }} value */
      run: async (value) => {
        messages.push(value);
        return { name: 'fixture.svg', matched: 0, width: 1 };
      },
      destroy: vi.fn(async () => {}),
    };

    await compareScreenshots(['fixture.svg'], {
      pool,
      noDiff: true,
      cacheKey: 'renderer-and-suite',
      checksums: { 'fixture.svg': 'optimized-checksum' },
    });
    expect(messages[0].diffPath).toBeNull();
    expect(messages[0].optimizedPath).toMatch(
      /renderer-and-suite.*fixture\.svg.*optimized-checksum\.png$/,
    );

    await compareScreenshots(['fixture.svg'], { pool });
    expect(messages[1].diffPath).toMatch(/fixture\.svg\.diff\.png$/);
    expect(pool.destroy).toHaveBeenCalledTimes(2);
  });

  test('applies the existing width-dependent mismatch allowance', async () => {
    const results = [
      { name: 'small.svg', matched: 3, width: 16 },
      { name: 'large.svg', matched: 4, width: 17 },
    ];

    await expect(
      compareScreenshots(['small.svg', 'large.svg'], {
        pool: {
          run: async () =>
            /** @type {NonNullable<ReturnType<typeof results.shift>>} */ (
              results.shift()
            ),
          destroy: async () => {},
        },
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
        pool: {
          run: async () =>
            /** @type {NonNullable<ReturnType<typeof results.shift>>} */ (
              results.shift()
            ),
          destroy: async () => {},
        },
      }),
    ).resolves.toEqual([
      { name: 'small.svg', isMatch: false },
      { name: 'large.svg', isMatch: false },
    ]);
  });
});

describe('runTests', () => {
  test('finishes rendering before comparison', async () => {
    /** @type {string[]} */
    const events = [];

    const report = await runTests(['fixture.svg'], {
      readVersion: async () => 'version',
      render: async () => events.push('render'),
      compare: async () => {
        events.push('compare');
        return [{ name: 'fixture.svg', isMatch: true }];
      },
    });

    expect(events).toEqual(['render', 'compare']);
    expect(report.results.match).toBe(1);
  });

  test('reports rendering and comparison durations', async () => {
    /** @type {string[]} */
    const messages = [];
    let now = 0;

    await runTests(['fixture.svg'], {
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

  test('propagates rendering failures', async () => {
    await expect(
      runTests(['fixture.svg'], {
        readVersion: async () => 'version',
        render: async () => {
          throw new Error('render failed');
        },
        compare: async () => [],
      }),
    ).rejects.toThrow('render failed');
  });
});
