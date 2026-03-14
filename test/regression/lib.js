/**
 * @fileoverview Utilities to manage manage regression tests.
 */

import { exec } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import picocolors from 'picocolors';

/**
 * @typedef {'KiB' | 'MiB' | 'GiB' | 'TiB'} StorageUnit
 */

/** @type {StorageUnit[]} */
const UNITS = ['KiB', 'MiB', 'GiB', 'TiB'];

/**
 * Reads a list of file paths from a file in predefine, ignoring empty lines and
 * any lines starting with a # as these are treated as comments.
 *
 * @param {string} path
 *   Path to a file relative to the working directory of the process.
 * @returns {Promise<string[]>}
 *   File paths that were listed at the given path.
 */
export async function readFileList(path) {
  const content = await fs.readFile(path, 'utf-8');
  return content.split('\n').filter((l) => l.length !== 0 && l[0] !== '#');
}

/**
 * @param {string} value
 * @returns {string}
 */
export function md5sum(value) {
  const hasher = crypto.createHash('md5');
  return hasher.update(value).digest('hex');
}

/**
 * @param {import('./regression-io.js').TestReport} report
 */
export async function printReport(report) {
  const { shouldHaveMatched, shouldHaveMismatched } = report.errors;

  console.log(`SVGO Test Suite Version: ${report.version}

▶ Test Results
              Match: ${report.results.match.toLocaleString()} / ${report.files.toMatch.toLocaleString()}
  Expected Mismatch: ${report.results.expectMismatch.toLocaleString()} / ${report.files.toMismatch.toLocaleString()}
            Ignored: ${report.results.ignored.toLocaleString()} / ${report.files.toIgnore.toLocaleString()}
            Skipped: ${report.files.toSkip.toLocaleString()}

▶ Metrics
        Bytes Saved: ${bytesToHumanReadable(report.metrics.bytesSaved)}
         Time Taken: ${secsToHumanReadable(report.metrics.timeTakenSecs)}
  Peak Memory Alloc: ${bytesToHumanReadable(report.metrics.peakMemoryAlloc, 'KiB')}${
    shouldHaveMatched.length !== 0
      ? picocolors.red(
          `\n\n▶ Expected match, but actually mismatched:\n${toBulletPointList(shouldHaveMatched, '✖')}`,
        )
      : ''
  }${
    shouldHaveMismatched.length !== 0
      ? picocolors.red(
          `\n\n▶ Expected mismatch, but actually matched:\n${toBulletPointList(shouldHaveMismatched, '✖')}`,
        )
      : ''
  }`);
}

/**
 * @param {number} bytes
 * @param {StorageUnit=} startingUnits
 *   If the first argument is specified in a unit other than bytes, then a
 *   string representing the units that was passed.
 * @returns {string}
 */
export function bytesToHumanReadable(bytes, startingUnits) {
  let units = startingUnits ? UNITS.indexOf(startingUnits) : 0;
  let value = startingUnits ? bytes : bytes / 1024;

  while (value > 1024) {
    units++;
    value /= 1024;
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} ${UNITS[units]}`;
}

/**
 * @param {number} secs
 * @returns {string}
 */
export function secsToHumanReadable(secs) {
  const hours = Math.floor(secs / 3600);
  secs -= hours * 3600;

  const minutes = Math.floor(secs / 60);
  secs -= minutes * 60;

  const arr = new Array(1);

  if (hours) {
    arr.push(`${hours}h`);
  }

  if (minutes) {
    arr.push(`${minutes.toString().padStart(2, '0')}m`);
  }

  arr.push(`${Math.round(secs).toString().padStart(2, '0')}s`);
  return arr.join('');
}

/**
 * @param {string[]} arr
 * @param {string} bullet
 * @returns {string}
 */
export function toBulletPointList(arr, bullet = '*') {
  return arr.map((s) => `${bullet} ${s}`).join('\n');
}

/**
 * @param {string} filepath
 *   Path that uses file separators for the current operating system.
 *   ({@link path.sep})
 * @returns {string}
 *   Same path but with POSIX file separators. ({@link path.posix.sep})
 */
export function pathToPosix(filepath) {
  return filepath.replaceAll(path.sep, path.posix.sep);
}

/**
 * @returns {Promise<string>}
 */
export async function getCommitRef() {
  return new Promise((res, rej) => {
    exec('git rev-parse HEAD', (err, stdout) => {
      if (err) {
        rej(err);
        return;
      }

      res(stdout.trim());
    });
  });
}
