'use strict';

const { findAllElementByName } = require('./validationUtilities');

exports.type = 'validate';

exports.name = 'isText';

exports.active = true;

exports.description = 'checks if svg contains text';

/**
 * Checks if text element is present
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
  if (root) {
    const textTags = findAllElementByName(root, 'text');

    const result = textTags.length === 0;

    validateResult.isText = result;
  } else {
    validateResult.isText = false;
  }

  return validateResult;
};
