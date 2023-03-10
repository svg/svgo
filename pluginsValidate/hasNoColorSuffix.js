'use strict';

exports.type = 'validate';

exports.name = 'hasNoColorSuffix';

exports.active = true;

exports.description = 'checks if the file name has color prefix included';

/**
 * checks if the file name has color prefix included
 *
 * @example
 *
 * @param {Object} root current iteration root
 * @param {Object} validateResult current validation result
 *
 * @return {Object} validateResult holding the validation result
 *
 * @author Jakub Filipowski
 */

exports.fn = function (root, validateResult) {
  if (root.filename) {
    let result = false;
    // remove extension from filename
    const filename = root.filename.split('.').slice(0, -1).join('.');
    if (!filename.endsWith('color')) {
      result = true;
    }

    validateResult.hasNoColorSuffix = result;
  } else {
    validateResult.hasNoColorSuffix = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
