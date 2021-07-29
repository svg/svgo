'use strict';

exports.type = 'validate';

exports.active = false;

exports.description = 'checks if the file is snake_case named';

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
    // remove extension from filename
    const filename = root.filename.split('.').slice(0, -1).join('.');
    const regex = /^[a-z][a-z0-9_]+$/;
    const result = regex.test(filename);

    validateResult.isSnakeCase = result;
  } else {
    validateResult.isSnakeCase = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
