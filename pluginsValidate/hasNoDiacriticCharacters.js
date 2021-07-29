'use strict';

exports.type = 'validate';

exports.name = 'hasNoDiacriticCharacters';

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
    let result = true;
    // remove extension from filename
    const filename = root.filename.split('.').slice(0, -1).join('.');
    // check for using diacritic characters in file name
    if (filename.search(/[^a-zA-Z0-9_]/) !== -1) {
      result = false;
    }

    validateResult.hasNoDiacriticCharacters = result;
  } else {
    validateResult.hasNoDiacriticCharacters = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
