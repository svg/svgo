'use strict';

exports.type = 'validate';
exports.name = 'areLayersIDsOrderCorrect';
exports.active = true;

exports.description = 'checks if the layers are correctly named and ordered';

const utils = require('./validationUtilities.js');

const ENOCLS = `Error in plugin "areLayersIDsOrderCorrect": absent parameters.
It should have a ordered list of layers in "layersNameOrder" attribute.
Config example:

plugins:
-layersNameOrder: [
    'blackFill',
    'blackStroke',
    'whiteFill',
    'stripes',
    'darkmodeMask',
  ]
`;

/**
 * Checks if the layers are correctly named and ordered
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
  if (params.layersNameOrder !== undefined) {
    const allElements = utils.findAllElementByAttribute(root, 'id');
    const layersNameOrder = [...params.layersNameOrder].reverse();

    const allLayerElements = allElements.filter((element) => {
      let filter = false;
      for (const layerNameOrder of layersNameOrder) {
        if (element.attributes.id === layerNameOrder) {
          filter = true;
          break;
        }
      }
      return filter;
    });
    result = idsOrderCorrect(allLayerElements, layersNameOrder);
  } else {
    console.error(ENOCLS);
  }

  validateResult.areLayersIDsOrderCorrect = result;

  return validateResult;
};

// check if values have the same order in the arrays
function idsOrderCorrect(layersElements, layerNameOrder) {
  if (
    layersElements.length !== layerNameOrder.length &&
    layersElements.length !== 4
  ) {
    return false;
  }

  for (let i = 0; i < layerNameOrder.length; i++) {
    if (
      layersElements[i]?.attributes?.id !== layerNameOrder[i] &&
      layerNameOrder[i] !== 'blackFill'
    ) {
      return false;
    }
  }

  return true;
}
