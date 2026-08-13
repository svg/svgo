import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
  REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
  REGRESSION_SCREENSHOTS_PATH,
} from './regression-io.js';
import { DEFAULT_RENDER_WORKERS, renderScreenshots } from './render.js';

const deferred = () => {
  /** @type {(value?: unknown) => void} */
  let resolve = () => {};
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return {
    promise,
    resolve: /** @type {(value?: unknown) => void} */ (resolve),
  };
};

afterEach(async () => {
  await fs.rm(REGRESSION_SCREENSHOTS_PATH, { recursive: true, force: true });
});

test('renders original and optimized SVGs to PNG', async () => {
  /** @type {Array<[string, string]>} */
  const calls = [];
  await renderScreenshots(['icons/one.svg'], {
    workerCount: 1,
    executable: process.execPath,
    render: async (input, output) => {
      calls.push([input, output]);
    },
  });

  expect(calls).toEqual([
    [
      path.join(REGRESSION_FIXTURES_PATH, 'icons/one.svg'),
      path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'icons/one.svg.png'),
    ],
    [
      path.join(REGRESSION_OPTIMIZED_PATH, 'icons/one.svg'),
      path.join(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, 'icons/one.svg.png'),
    ],
  ]);
  await expect(
    fs.stat(path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'icons')),
  ).resolves.toMatchObject({});
  await expect(
    fs.stat(path.join(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, 'icons')),
  ).resolves.toMatchObject({});
});

test('empty lists perform no render calls', async () => {
  let calls = 0;
  await renderScreenshots([], {
    executable: process.execPath,
    render: async () => {
      calls++;
    },
  });

  expect(calls).toBe(0);
  await expect(
    fs.stat(REGRESSION_ORIGINAL_SCREENSHOTS_PATH),
  ).resolves.toBeDefined();
  await expect(
    fs.stat(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH),
  ).resolves.toBeDefined();
});

test('default renderer passes input and output as CLI arguments', async () => {
  const executable = path.join(REGRESSION_SCREENSHOTS_PATH, '..', 'fake-resvg');
  await fs.mkdir(path.dirname(executable), { recursive: true });
  await fs.writeFile(
    executable,
    `#!${process.execPath}\nimport fs from 'node:fs';\nfs.writeFileSync(process.argv[3], JSON.stringify(process.argv.slice(2)));\n`,
    { mode: 0o755 },
  );

  await renderScreenshots(['one.svg'], { workerCount: 1, executable });

  const output = path.join(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, 'one.svg.png');
  await expect(fs.readFile(output, 'utf8')).resolves.toBe(
    JSON.stringify([path.join(REGRESSION_FIXTURES_PATH, 'one.svg'), output]),
  );
  await fs.rm(executable, { force: true });
});

test('rejects an unavailable resvg executable before rendering', async () => {
  let called = false;

  await expect(
    renderScreenshots(['one.svg'], {
      executable: path.join(REGRESSION_SCREENSHOTS_PATH, 'missing-resvg'),
      render: async () => {
        called = true;
      },
    }),
  ).rejects.toThrow('resvg is not installed; run pnpm install:resvg');
  expect(called).toBe(false);
});

test('uses one native renderer worker per available CPU by default', () => {
  expect(DEFAULT_RENDER_WORKERS).toBe(
    Math.max(1, os.availableParallelism?.() ?? os.cpus().length),
  );
});

test('bounds active fixture pairs by worker count', async () => {
  const releases = [deferred(), deferred(), deferred()];
  let started = 0;
  let active = 0;
  let maximumActive = 0;
  const rendering = renderScreenshots(['one.svg', 'two.svg', 'three.svg'], {
    workerCount: 2,
    executable: process.execPath,
    render: async (input) => {
      if (input.startsWith(REGRESSION_FIXTURES_PATH)) {
        const index = started++;
        active++;
        maximumActive = Math.max(maximumActive, active);
        await releases[index].promise;
      } else {
        active--;
      }
    },
  });

  while (started < 2) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  expect(maximumActive).toBe(2);
  expect(started).toBe(2);
  releases[0].resolve();
  while (started < 3) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  expect(maximumActive).toBe(2);
  releases[1].resolve();
  releases[2].resolve();
  await rendering;
});

test('waits for all started workers to settle after a render fails', async () => {
  const releaseSlowRender = deferred();
  let slowSettled = false;
  const rendering = renderScreenshots(['broken.svg', 'slow.svg'], {
    workerCount: 2,
    executable: process.execPath,
    render: async (input) => {
      if (input.endsWith('broken.svg')) {
        throw new Error('invalid SVG');
      }
      if (input.endsWith('slow.svg')) {
        await releaseSlowRender.promise;
        slowSettled = true;
      }
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  expect(slowSettled).toBe(false);
  releaseSlowRender.resolve();
  await expect(rendering).rejects.toThrow(
    'Failed to render original broken.svg: invalid SVG',
  );
  expect(slowSettled).toBe(true);
});

test('reports fixture, variant, and stderr for render failures', async () => {
  await expect(
    renderScreenshots(['broken.svg'], {
      workerCount: 1,
      executable: process.execPath,
      render: async () => {
        throw Object.assign(new Error('invalid SVG'), {
          stderr: 'parse failed',
        });
      },
    }),
  ).rejects.toThrow('Failed to render original broken.svg: parse failed');
});

test('reports optimized failures with an exit code and original message', async () => {
  let call = 0;
  await expect(
    renderScreenshots(['broken.svg'], {
      workerCount: 1,
      executable: process.execPath,
      render: async () => {
        if (++call === 2) {
          throw Object.assign(new Error('render crashed'), { code: 7 });
        }
      },
    }),
  ).rejects.toThrow(
    'Failed to render optimized broken.svg (exit code 7): render crashed',
  );
});
