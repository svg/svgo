'use strict';

exports.type = 'validate';

exports.active = true;

exports.description = 'checks if the file is JSON type';

/**
 * Checks if the file is JSON type
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
  const JSONtoObject = JSON.parse(root.data);

  const result = JSONtoObject ? true : false;

  validateResult.isJSON = result;

  return validateResult;
};
