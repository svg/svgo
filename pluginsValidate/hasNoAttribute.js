'use strict';

exports.type = 'validate';

exports.name = 'hasNoAttribute';

exports.active = true;

exports.description = 'checks if shape elements has no given attribute';

const ENOCLS = `Error in plugin "hasNoAttribute": absent parameters.
  It should have a specified in "attribute".
  Config example:

  plugins:
  - hasNoAttribute:
    attribute: <attribute>
  `;

const utils = require('./validationUtilities.js');

/**
 * Checks if shape elements has no given attribute
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
  if (params.attribute !== undefined) {
    const allShapeElements = utils.findAllShapeElements(root);
    const attribute = params.attribute;

    const result = allShapeElements.every((shapeElement) => {
      return !(attribute in shapeElement.attributes)
        ? true
        : shapeElement.attributes[attribute] === 'none'
        ? true
        : false;
    });

    validateResult.hasNoAttribute = result;
  } else {
    validateResult.hasNoAttribute = false;
    console.error(ENOCLS);
  }

  return validateResult;
};
