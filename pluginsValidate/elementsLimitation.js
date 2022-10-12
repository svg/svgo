'use strict';

exports.type = 'validate';
exports.name = 'elementsLimitation';
exports.active = true;

exports.description =
  'checks if amount of allowed svg elements is within the limit';

const utils = require('./validationUtilities.js');

const ENOCLS = `Error in plugin "elementsLimitation": absent parameters.
It should have a number of allowed svg elements in "amount" attribute.
Config example:

plugins:
- elementsLimitation:
  amount: <number>
  unlimited: <boolean>
  fillOrStroke: 'fill'/'stroke'
  `;

/**
 * Checks if amount of allowed svg elements is within the limit
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
  if (params.amount !== undefined || params.unlimited !== undefined) {
    const maxElements = params.amount;
    const attribute = params.fillOrStroke;
    const allShapeElements = utils.findAllShapeElements(root);

    let result;

    if (params.unlimited) {
      result = checkForAttributes(allShapeElements, attribute);
    } else {
      result =
        maxElements === allShapeElements.length &&
        checkForAttributes(allShapeElements, attribute);
    }

    validateResult.elementsLimitation = result;
  } else {
    console.warn(ENOCLS);
    validateResult.elementsLimitation = false;
  }

  return validateResult;
};

function checkForAttributes(allShapeElements, attribute) {
  return allShapeElements.every((shapeElement) => {
    return attribute in shapeElement.attributes ? true : false;
  });
}
