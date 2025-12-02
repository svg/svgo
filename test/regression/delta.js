#!/usr/bin/env node

import { bytesToHumanReadable, secsToHumanReadable } from './lib.js';
import { readReport } from './regression-io.js';

/**
 * @typedef {object} DeltaReport
 * @property {number} filesAffected Files that changed between the two reports.
 * @property {number} totalFiles Total files that were in the test suite.
 * @property {number} bytesDelta
 *   Difference in total bytes saved. Positive if we reduce more bytes, or
 *   negative if we reduce less bytes. Higher is better!
 * @property {number} secsDelta
 *   Difference in total time taken. Positive if we took longer to optimize, or
 *   negative if we took less time to optimize. Lower is better!
 * @property {number} memDelta
 *   Difference in peak memory allocation. Positive if we used more memory, or
 *   negative if we used less memory. Lower is better!
 */

const HEADING = '▶ Relative to svg/svgo.git#main';

/**
 * @param {import('./regression-io.js').TestReport} reportMain
 * @param {import('./regression-io.js').TestReport} reportHead
 * @returns {DeltaReport}
 */
function deltaReport(reportMain, reportHead) {
  if (reportMain.version !== reportHead.version) {
    console.error(`${HEADING}
  Previous test report used a different version of SVGO Test Suite.
  Rerun regression tests on main to regenerate test report, then try again.`);
    process.exit(1);
  }

  const filesAffected = Object.keys(reportMain.checksums).reduce((acc, val) => {
    return reportMain.checksums[val] === reportHead.checksums[val]
      ? acc
      : acc + 1;
  }, 0);

  return {
    filesAffected,
    totalFiles:
      reportMain.files.toMatch +
      reportMain.files.toMismatch +
      reportMain.files.toIgnore,
    bytesDelta: reportHead.metrics.bytesSaved - reportMain.metrics.bytesSaved,
    secsDelta:
      reportHead.metrics.timeTakenSecs - reportMain.metrics.timeTakenSecs,
    memDelta:
      reportHead.metrics.peakMemoryAlloc - reportMain.metrics.peakMemoryAlloc,
  };
}

/**
 * @param {DeltaReport} deltaReport
 */
function writeReport(deltaReport) {
  const { bytesDelta, filesAffected, memDelta, secsDelta, totalFiles } =
    deltaReport;

  console.log(`${HEADING}
       Files Affected: ${filesAffected.toLocaleString()} / ${totalFiles.toLocaleString()}
        Bytes Saved Δ: ${toDisplayString(bytesDelta, (n) => bytesToHumanReadable(n))}
         Time Taken Δ: ${toDisplayString(secsDelta, (n) => secsToHumanReadable(n))}
  Peak Memory Alloc Δ: ${toDisplayString(memDelta, (n) => bytesToHumanReadable(n, 'KiB'))}`);
}

/**
 * @param {number} num
 * @param {(num: number) => string} fn
 */
function toDisplayString(num, fn) {
  if (num === 0) {
    return fn(0);
  }

  if (num > 0) {
    return `+${fn(num)}`;
  }

  return `-${fn(Math.abs(num))}`;
}

const reportMain = /** @type {import('./regression-io.js').TestReport} */ (
  await readReport(process.argv[2])
);
const reportHead = /** @type {import('./regression-io.js').TestReport} */ (
  await readReport(process.argv[3])
);
const report = deltaReport(reportMain, reportHead);
writeReport(report);
