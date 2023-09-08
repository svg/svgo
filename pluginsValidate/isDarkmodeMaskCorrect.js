'use strict';

exports.type = 'validate';

exports.name = 'isDarkmodeMaskCorrect';

exports.active = true;

exports.description =
  'checks if the file has correct darkmodeMask color and size';

const utils = require('./validationUtilities.js');

/**
 * Checks if the file has correct darkmodeMask color and size
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

const ENOCLS = `Error in plugin "isDarkmodeMaskCorrect": absent parameters.
  It should have a size of darkmodeMask in "size" and fill colors in "fillColors".
  Config example:

  plugins:
  - isDarkmodeMaskCorrect:
      darkmodeFillSize: [width, height],
      fillColors: ['white', '#fff', '#ffffff']
  `;

exports.fn = function (root, validateResult, params) {
  if (params || !utils.isEmpty(params)) {
    const svg = utils.findElementByName(root, 'svg');
    const darkmodeMaskElement = utils.findAllElementByAttributeValue(
      svg,
      'id',
      'darkmodeMask'
    )[0];

    const [darkmodeFillWidth, darkmodeFillHeight] = params.darkmodeFillSize;

    let isFillColorCorrect = false;

    for (const color of params.fillColors) {
      if (
        utils.findAllElementByAttributeValue(darkmodeMaskElement, 'fill', color)
          .length > 0 ||
        darkmodeMaskElement.attributes.fill === color
      ) {
        isFillColorCorrect = true;
      }
    }

    let isCorrectSize;
    let elementWidth, elementHeight;
    if (darkmodeMaskElement.name === 'path') {
      [elementWidth, elementHeight] = utils.calculatePathDimensions(
        darkmodeMaskElement.attributes.d
      );
    } else if (darkmodeMaskElement.name === 'g') {
      const pathElem = darkmodeMaskElement.children.find(
        (child) => child.name === 'path'
      );

      if (pathElem) {
        [elementWidth, elementHeight] = utils.calculatePathDimensions(
          pathElem.attributes.d
        );
      }
    } else if (darkmodeMaskElement.name === 'ellipse') {
      [elementWidth, elementHeight] = [
        darkmodeMaskElement.attributes.rx * 2,
        darkmodeMaskElement.attributes.ry * 2,
      ];
    } else if (darkmodeMaskElement.name === 'circle') {
      [elementWidth, elementHeight] = [
        darkmodeMaskElement.attributes.r * 2,
        darkmodeMaskElement.attributes.r * 2,
      ];
    } else {
      console.error(
        'Error in plugin isDarkmodeMaskCorrect: Unhandled element found!'
      );
    }

    if (elementWidth !== elementHeight) isCorrectSize = false;
    else
      isCorrectSize =
        elementWidth === darkmodeFillWidth &&
        elementHeight === darkmodeFillHeight;

    const result = isFillColorCorrect && isCorrectSize;

    validateResult.isDarkmodeMaskCorrect = result;
  } else if (utils.isEmpty(params) || !params) {
    validateResult.isDarkmodeMaskCorrect = false;
    if (
      params.darkmodeFillSize === undefined ||
      params.fillColors === undefined
    ) {
      console.error(ENOCLS);
    }
  }
  return validateResult;
};
