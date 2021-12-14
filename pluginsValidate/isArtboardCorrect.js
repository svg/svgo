'use strict';

exports.type = 'validate';

exports.active = true;

exports.description = 'checks if viewBox has correct size';

const utils = require('./validationUtilities.js');

/**
 * Checks if viewBox has correct size
 *
 * @example
 *
 * @param {Object} root current iteration root
 * @param {Object} validateResult current validation result
 * @param {Object} params current iteration params
 *
 * @return {Object} validateResult holding the validation result
 *
 * @author Tymon Żarski
 */

const ENOCLS = `Error in plugin "isArtboardCorrect": absent parameters.
  It should have a size of Artboard in "size".
  Config example:

  plugins:
  - isArtboardCorrect:
      size: [width, height] // set width or height to 'null' of it does not have to be bounded, but both values cannot be null
  `;

exports.fn = function (svg, validateResult, params) {
  const root = utils.findElementByName(svg, 'svg');
  if (
    (params || params === {}) &&
    root.attributes.viewBox &&
    root.attributes.viewBox !== undefined
  ) {
    const [paramViewBoxWidth, paramViewBoxHeight] = params.size;

    if (paramViewBoxHeight === null && paramViewBoxWidth === null) {
      console.log(ENOCLS);
    }

    const [svgViewBoxWidth, svgViewBoxHeight] = root.attributes.viewBox
      .split(' ')
      .map(function (value, index) {
        if (index > 1 && value !== 0) {
          return parseInt(value, 10);
        }
      })
      .filter(function (value) {
        return value !== undefined;
      });

    let result;

    if (paramViewBoxWidth === null || paramViewBoxHeight === null) {
      result =
        svgViewBoxWidth === paramViewBoxWidth ||
        svgViewBoxHeight === paramViewBoxHeight;
    } else {
      result =
        svgViewBoxWidth === paramViewBoxWidth &&
        svgViewBoxHeight === paramViewBoxHeight;
    }

    validateResult.isArtboardCorrect = result;
  } else if (
    params === {} ||
    !params ||
    root.attributes.viewBox === undefined
  ) {
    validateResult.isArtboardCorrect = false;
    if (params.size === undefined) {
      console.error(ENOCLS);
    }
  }

  return validateResult;
};
