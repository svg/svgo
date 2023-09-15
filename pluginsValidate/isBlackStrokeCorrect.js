'use strict';

exports.type = 'validate';

exports.name = 'isBlackStrokeCorrect';

exports.active = true;

exports.description =
  'checks if the file has element with BlackStroke id, correct width and stroke attributes';

const utils = require('./validationUtilities.js');

/**
 * Checks if the file has element with BlackStroke id, correct width and stroke attributes
 *
 * @example
 *
 * @param {Object} root current iteration root
 * @param {Object} validateResult current validation result
 * @param {Object} params current iteration params
 *
 * @return {Object} validateResult holding the validation result
 *
 * @author Jakub Filipowski
 */

const ENOCLS = `Error in plugin "isBlackStrokeCorrect": absent parameters.
  It should have a stroke width in "strokeWidth".
  Config example:

  plugins:
  - isBlackStrokeCorrect:
      strokeWidth:[0.4, 0.6]
  `;

exports.fn = function (root, validateResult, params) {
  if (params || !utils.isEmpty(params)) {
    const svg = utils.findElementByName(root, 'svg');
    const blackStrokeElements = utils.findAllElementByAttributeValue(
      svg,
      'id',
      'blackStroke'
    );

    let isStrokeWidthCorrect = true;
    let isFillAttributeUsed = false;

    if (blackStrokeElements.length === 1) {
      const blackStrokeElement = blackStrokeElements[0];

      if (blackStrokeElement.name === 'path') {
        if (
          Object.keys(blackStrokeElement.attributes).includes('stroke-width') &&
          !params.strokeWidth.includes(
            parseFloat(blackStrokeElement.attributes['stroke-width'])
          )
        ) {
          isStrokeWidthCorrect = false;
        }
        if (Object.keys(blackStrokeElement.attributes).includes('fill')) {
          isFillAttributeUsed = true;
        }
      } else if (blackStrokeElement.name === 'g') {
        for (const child of blackStrokeElement.children) {
          if (
            Object.keys(child.attributes).includes('stroke-width') &&
            !params.strokeWidth.includes(
              parseFloat(child.attributes['stroke-width'])
            )
          ) {
            isStrokeWidthCorrect = false;
          }
          if (Object.keys(child.attributes).includes('fill')) {
            isFillAttributeUsed = true;
          }
        }
      } else {
        console.error(
          'Error in plugin isBlackStrokeCorrect: Unhandled element found!'
        );
      }
    } else isStrokeWidthCorrect = false;

    const result = isStrokeWidthCorrect && !isFillAttributeUsed;

    validateResult.isBlackStrokeCorrect = result;
  } else if (utils.isEmpty(params) || !params) {
    validateResult.isBlackStrokeCorrect = false;
    if (params.strokeWidth === undefined) {
      console.error(ENOCLS);
    }
  }
  return validateResult;
};
