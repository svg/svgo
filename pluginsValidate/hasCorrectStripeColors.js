'use strict';

exports.type = 'validate';

exports.active = true;

exports.description = 'checks if color stripes are in correct';

const utils = require('./validationUtilities.js');

const ENOCLS = `Error in plugin "hasCorrectStripeColors": absent parameters.
It should have a ordered list of stripe colors in "stripeColors" attribute.
Config example:

plugins:
-stripeColors: [
    'blackFill',
    'blackStroke',
    'whiteFill',
    'stripes',
    'darkmodeMask',
  ]
`;

/**
 * Checks if color stripes are in correct
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
exports.fn = function (root, validateResult, params) {
  let result = false;
  if (params.stripeColors !== undefined) {
    const stripeColorsOrder = params.stripeColors;
    const allElements = utils.findFillElementsByColors(root, stripeColorsOrder);

    result = fillColorOrderCorrect(allElements, stripeColorsOrder);
  } else {
    console.error(ENOCLS);
  }

  validateResult.hasCorrectStripeColors = result;

  return validateResult;
};

// check if values have the same order in the arrays
function fillColorOrderCorrect(stripeElements, stripeElementColorOrder) {
  if (stripeElements.length !== stripeElementColorOrder.length) {
    return false;
  }
  for (let i = 0; i < stripeElementColorOrder.length; i++) {
    if (
      stripeElements[i].toLowerCase() !==
      stripeElementColorOrder[i].toLowerCase()
    ) {
      return false;
    }
  }
  return true;
}
