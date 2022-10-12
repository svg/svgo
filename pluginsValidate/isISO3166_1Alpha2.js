'use strict';

exports.type = 'validate';

exports.name = 'isISO3166_1Alpha2';

exports.active = false;

exports.description = 'checks if the file is snake_case named';

const countries = require('i18n-iso-countries');

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

    const result = countries.isValid(filename) && filename.length === 2;

    validateResult.isISO3166_1Alpha2 = result;
  } else {
    validateResult.isISO3166_1Alpha2 = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
