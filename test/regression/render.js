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
const ErrorWithCause =
  /** @type {new (message?: string, options?: { cause?: unknown }) => Error} */ (
    Error
  );

/**
 * @typedef {object} RenderError
 * @property {string | number} [code]
 * @property {string | Buffer} [stderr]
 * @property {string} [message]
 */

export const DEFAULT_RENDER_CONCURRENCY = Math.max(
  1,
  os.availableParallelism?.() ?? os.cpus().length,
);

/**
 * @param {ReadonlyArray<string>} list
 * @param {{ concurrency?: number, executable?: string, execFile?: (file: string, args: string[]) => Promise<unknown>, render?: (input: string, output: string) => Promise<void> }=} options
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
      await (options.execFile ?? execFile)(executable, [input, output]);
    });

  const queue = [...list];
  const concurrency = Math.min(
    options.concurrency ?? DEFAULT_RENDER_CONCURRENCY,
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
  const renderNext = async () => {
    let name;
    while ((name = queue.shift()) != null) {
      for (const [variant, inputRoot, outputRoot] of variants) {
        const input = path.join(inputRoot, name);
        const output = path.join(outputRoot, `${name}.png`);
        await fs.mkdir(path.dirname(output), { recursive: true });
        try {
          await render(input, output);
        } catch (error) {
          const renderError = /** @type {RenderError} */ (error);
          const code =
            renderError.code == null ? '' : ` (exit code ${renderError.code})`;
          const detail =
            renderError.stderr?.toString().trim() ||
            renderError.message ||
            renderError;
          throw new ErrorWithCause(
            `Failed to render ${variant} ${name}${code}: ${detail}`,
            { cause: error },
          );
        }
      }
    }
  };

  const outcomes = await Promise.allSettled(
    Array.from({ length: concurrency }, renderNext),
  );
  const failed = outcomes.find((outcome) => outcome.status === 'rejected');
  if (failed) {
    throw failed.reason;
  }
}
