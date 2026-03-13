/**
 * @fileoverview
 *   Helpers to interact with file lists. File lists are used to configure
 *   exceptions in SVGO Test Suite.
 *
 *   All file lists are defined in `./lists`.
 *
 *   Syntax:
 *   * All entires must be written with POSIX file separators.
 *   * Comments can be written by putting `#` at the start of the line.
 *   * Blank lines are ignored.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { readFileList, toBulletPointList } from './lib.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SVGs that we know are broken by SVGO. The build will fail if during the
 * regression pipeline, we determine that one of them are actually not broken.
 * This is for when we've intentionally or incidentally fixed an SVG.
 */
export const expectMismatch = await readFileList(
  path.join(__dirname, 'lists', 'expect-mismatch.txt'),
);

/**
 * Ignore the results of these SVGs as they are finicky. They sometimes pass,
 * sometimes fail, we'll figure out why eventually. We'll report the status of
 * them regardless, but the result has no effect on the pipeline status.
 */
export const ignore = await readFileList(
  path.join(__dirname, 'lists', 'ignore.txt'),
);

/**
 * SVGs that we shouldn't extract. We only have one SVG for this scenario right
 * now, which takes too long to optimize to be practical for CI environments.
 */
export const skip = await readFileList(
  path.join(__dirname, 'lists', 'skip.txt'),
);

/**
 * @param {string[]} svgs SVGs names that are available.
 * @throws {Exception} If any of the file lists are malformed.
 */
export async function validateFileLists(svgs) {
  let errored = false;

  const allFiles = [...expectMismatch, ...ignore, ...skip];
  /** @type {string[]} */
  const duplicates = [];

  for (const file of allFiles) {
    if (allFiles.indexOf(file) != allFiles.lastIndexOf(file)) {
      if (!duplicates.includes(file)) {
        duplicates.push(file);
      }
    }
  }

  if (duplicates.length !== 0) {
    console.error(
      `Files name may only ever appear once across all file lists:\n${toBulletPointList(duplicates)}\n`,
    );
    errored = true;
  }

  const fileLists = [
    ['expect-mismatch.txt', expectMismatch],
    ['ignore.txt', ignore],
    ['skip.txt', skip],
  ];

  for (const [name, fileList] of fileLists) {
    const errors = [];

    for (const file of fileList) {
      if (!svgs.includes(file)) {
        errors.push(file);
      }
    }

    if (errors.length !== 0) {
      console.error(
        `${name} has files that don't exist in SVGO Test Suite:\n${toBulletPointList(errors)}\n`,
      );
      errored = true;
    }
  }

  if (errored) {
    throw new Error('Validation for test suite file lists failed.');
  }
}
