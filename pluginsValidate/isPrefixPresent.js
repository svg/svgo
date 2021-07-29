'use strict';

exports.type = 'validate';

exports.name = 'isPrefixPresent';

exports.active = false;

exports.description = 'checks if the filename has prefix';

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
    const filename = root.filename;
    const prefixes = [
      'retail_',
      'corporate_',
      'sme_',
      'privatebanking_',
      'mobile_',
    ];
    const result = prefixes.some((prefix) => filename.indexOf(prefix) === 0);

    validateResult.isPrefixPresent = result;
  } else {
    validateResult.isPrefixPresent = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
