'use strict';

exports.type = 'validate';

exports.name = 'isFillRule';

exports.active = true;

exports.description = 'checks if the file has default fill-rule';

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
  const svg = utils.findElementByName(root, 'svg');
  const fillRuleElements = utils.findAllElementByAttributeValue(
    svg,
    'fill-rule',
    'evenodd'
  );
  const clipRuleElements = utils.findAllElementByAttributeValue(
    svg,
    'clip-rule',
    'evenodd'
  );

  const result = fillRuleElements.length === 0 && clipRuleElements.length === 0;

  validateResult.isFillRule = result;

  return validateResult;
};
