import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getCommitRef } from './lib.js';

/**
 * @typedef Files
 * @property {number} toMatch Total SVGs expected to pass tests.
 * @property {number} toMismatch Total SVGs expected to fail tests.
 * @property {number} toIgnore
 *   Total SVGs where we don't care if they pass or fail.
 * @property {number} toSkip Total SVGs we're not testing at all.
 *
 * @typedef Results
 * @property {number} match
 *   Total SVGs that were expected to match which did match.
 * @property {number} expectMismatch
 *   Total SVGs that were expected to mismatch which did mismatch.
 * @property {number} ignored
 *   Number of SVGs that matched, but the the result don't affect the success
 *   status anyway, and is not explicitly reported.
 *
 * @typedef Metrics
 * @property {number} bytesSaved Total bytes saved throughout this test run.
 * @property {number} timeTakenSecs Total time taken throughout this test run.
 * @property {number} peakMemoryAlloc
 *   Peak memory allocation throughout this test run in kibibytes (1,024 bytes).
 *
 * @typedef Errors
 * @property {string[]} shouldHaveMatched
 * @property {string[]} shouldHaveMismatched
 *
 * @typedef TestReport
 * @property {string} version SVGO Test Suite version.
 * @property {Files} files
 * @property {Results} results
 * @property {Metrics} metrics
 * @property {Errors} errors
 * @property {Record<string, string>} checksums
 *   Dictionary of checksums after an SVG has been optimized. Keys are filepaths
 *   with POSIX file separators.
 */

const GIT_COMMIT_REF = await getCommitRef();

export const TEMP_DIR_PATH = path.join(tmpdir(), `svgo.${GIT_COMMIT_REF}`);
export const REGRESSION_FIXTURES_PATH = path.join(
  TEMP_DIR_PATH,
  'regression-fixtures',
);
export const REGRESSION_OPTIMIZED_PATH = path.join(
  TEMP_DIR_PATH,
  'regression-optimized',
);
export const REGRESSION_DIFFS_PATH = path.join(
  TEMP_DIR_PATH,
  'regression-diff',
);
export const REGRESSION_VERSION_PATH = path.join(
  REGRESSION_FIXTURES_PATH,
  'VERSION',
);
export const OPTIMIZATION_REPORT_PATH = path.join(
  TEMP_DIR_PATH,
  'svgo-test-report.json',
);

/**
 * Path to a file that stores the `ETag` header returned from the
 * webserver when download the SVGO Test Suite.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
 */
export const ETAG_PATH = path.join(TEMP_DIR_PATH, '.etag');

/**
 * @param {Partial<TestReport>} data
 */
export async function writeReport(data) {
  await fs.writeFile(OPTIMIZATION_REPORT_PATH, JSON.stringify(data));
}

/**
 * @returns {Promise<Partial<TestReport>>}
 */
export async function readReport(path = OPTIMIZATION_REPORT_PATH) {
  const text = await fs.readFile(path, 'utf-8');
  return JSON.parse(text);
}

/**
 * @returns {Promise<string>}
 */
export async function readVersion() {
  return (await fs.readFile(REGRESSION_VERSION_PATH, 'utf-8')).trimEnd();
}

/**
 * @param {string} etag
 */
export async function writeEtag(etag) {
  await fs.writeFile(ETAG_PATH, etag);
}

/**
 * @returns {Promise<string?>}
 *   ETag value associated with the previously retrieved archive.
 */
export async function readPrevEtag() {
  try {
    return (await fs.readFile(ETAG_PATH, 'utf-8')).trimEnd();
  } catch (err) {
    // @ts-expect-error Safe to assume `Error`, and works even if `code` is undefined.
    if (err.code === 'ENOENT') {
      return null;
    }

    throw err;
  }
}
