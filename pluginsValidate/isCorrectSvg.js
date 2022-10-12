'use strict';

exports.type = 'validate';

exports.name = 'isCorrectSvg';

exports.active = true;

exports.description = 'checks if the file is snake_case named';

const utils = require('./validationUtilities.js');

/**
 * Checks if the file is snake_case named
 *
 * @example
 *
 * @param {Object} root current iteration root
 * @param {Object} validateResult current validation result
 *
 * @return {Object} validateResult holding the validation result
 *
 * @author Tymon Żarski
 */

exports.fn = function (root, validateResult) {
  if (root.filename) {
    // get extension form filename (if any)
    const ext = root.filename.split('.').pop();

    const svgTag = utils.findElementByName(root, 'svg');

    const result = svgTag.name === 'svg' && ext === 'svg';

    validateResult.isCorrectSvg = result;
  } else {
    validateResult.isCorrectSvg = false;
    console.error('no filename provided!');
  }

  return validateResult;
};
