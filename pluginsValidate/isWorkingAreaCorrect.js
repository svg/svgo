'use strict';

exports.type = 'validate';

exports.active = true;

exports.description = 'checks if working area is within limits';

const svgPathBbox = require('svg-path-bbox');
const utils = require('./validationUtilities');

/**
 * Checks if working area is within limits
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

const ENOCLS = `Error in plugin "isWorkingAreaCorrect": absent parameters.
  It should have a size of working area in "size".
  Config example:

  plugins:
  - isWorkingAreaCorrect:
      size: [width, height]
  `;

exports.fn = function (root, validateResult, params) {
  if (
    (params || params === {}) &&
    utils.findElementByName(root, 'path') &&
    root.children[0].attributes.viewBox &&
    root.children[0].attributes.viewBox !== undefined
  ) {
    const pathElement = utils.findElementByName(root, 'path');
    const [paramPathWidth, paramPathHeight] = params.size;
    const [
      svgViewBoxWidth,
      svgViewBoxHeight,
    ] = root.children[0].attributes.viewBox
      .split(' ')
      .map(function (value, index) {
        if (index > 1 && value !== 0) {
          return parseInt(value, 10);
        }
      })
      .filter(function (value) {
        return value !== undefined;
      });
    const [
      workingAreaX1,
      workingAreaY1,
      workingAreaX2,
      workingAreaY2,
    ] = svgPathBbox(pathElement.attributes.d);
    const [workingAreaWidth, workingAreaHeight] = [
      workingAreaX2 - workingAreaX1,
      workingAreaY2 - workingAreaY1,
    ];
    const [artboardX1, artboardY1] = [
      (svgViewBoxWidth - paramPathWidth) / 2,
      (svgViewBoxHeight - paramPathHeight) / 2,
    ];
    const result =
      workingAreaWidth <= paramPathWidth &&
      workingAreaHeight <= paramPathHeight &&
      artboardX1 <= workingAreaX1 &&
      artboardY1 <= workingAreaY1;

    validateResult.isWorkingAreaCorrect = result;
  } else if (
    params === {} ||
    !params ||
    root.children[0].attributes.viewBox === undefined
  ) {
    validateResult.isWorkingAreaCorrect = false;
    if (params.size === undefined) {
      console.error(ENOCLS);
    }
  }

  return validateResult;
};
