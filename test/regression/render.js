import { execFile as execFileCallback } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getResvgPath } from '../../scripts/install-resvg.js';
import {
  REGRESSION_FIXTURES_PATH,
  REGRESSION_OPTIMIZED_PATH,
  REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
  REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
  REGRESSION_SCREENSHOTS_PATH,
} from './regression-io.js';

const execFile = promisify(execFileCallback);

export const DEFAULT_RENDER_WORKERS = Math.max(
  1,
  os.availableParallelism?.() ?? os.cpus().length,
);

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ workerCount?: number, executable?: string, render?: (input: string, output: string) => Promise<void> }=} options
 */
export async function renderScreenshots(list, options = {}) {
  const executable = options.executable ?? getResvgPath();
  try {
    await fs.access(executable, fsConstants.X_OK);
  } catch {
    throw new Error('resvg is not installed; run pnpm install:resvg');
  }

  await fs.rm(REGRESSION_SCREENSHOTS_PATH, { recursive: true, force: true });
  await fs.mkdir(REGRESSION_ORIGINAL_SCREENSHOTS_PATH, { recursive: true });
  await fs.mkdir(REGRESSION_OPTIMIZED_SCREENSHOTS_PATH, { recursive: true });

  const render =
    options.render ??
    (async (input, output) => {
      await execFile(executable, [input, output]);
    });

  const queue = [...list];
  const workerCount = Math.min(
    options.workerCount ?? DEFAULT_RENDER_WORKERS,
    queue.length,
  );
  const variants = [
    [
      'original',
      REGRESSION_FIXTURES_PATH,
      REGRESSION_ORIGINAL_SCREENSHOTS_PATH,
    ],
    [
      'optimized',
      REGRESSION_OPTIMIZED_PATH,
      REGRESSION_OPTIMIZED_SCREENSHOTS_PATH,
    ],
  ];
  const worker = async () => {
    let name;
    while ((name = queue.shift()) != null) {
      for (const [variant, inputRoot, outputRoot] of variants) {
        const input = path.join(inputRoot, name);
        const output = path.join(outputRoot, `${name}.png`);
        await fs.mkdir(path.dirname(output), { recursive: true });
        try {
          await render(input, output);
        } catch (error) {
          const code = error?.code == null ? '' : ` (exit code ${error.code})`;
          const detail =
            error?.stderr?.toString().trim() || error?.message || error;
          throw new Error(
            `Failed to render ${variant} ${name}${code}: ${detail}`,
            { cause: error },
          );
        }
      }
    }
  };

  const outcomes = await Promise.allSettled(
    Array.from({ length: workerCount }, worker),
  );
  const failed = outcomes.find((outcome) => outcome.status === 'rejected');
  if (failed) {
    throw failed.reason;
  }
}
