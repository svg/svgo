'use strict';

exports.type = 'validate';

exports.active = true;

exports.description = 'checks if illustration colors are correct';

const utils = require('./validationUtilities.js');

const ENOCLS = `Error in plugin "hasIllustrationCorrectColorLayers": absent parameters.
It should have a object of theme with list of stripe colors in "stripeColors" attribute and 
it should blackFill and stroke color in "blackFillAndStrokeColor" attribute.`;

/**
 * Checks if layers 'stripes', 'blackFill' and 'blackStroke' are present in the illustration
 * and if they have the correct colors
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

  if (
    params.stripeColors !== undefined &&
    params.blackFillAndStrokeColor !== undefined
  ) {
    const SEGMENT_NAME_TO_STRIPE_COLORS = params.stripeColors;

    const BLACK_FILL_AND_STROKE_COLOR = params.blackFillAndStrokeColor;

    const filename = root.filename;
    const segmentNames = Object.keys(SEGMENT_NAME_TO_STRIPE_COLORS);
    const themeName = segmentNames.find((name) => filename.includes(name));
    if (segmentNames.includes(themeName)) {
      const stripeColorsOrder = SEGMENT_NAME_TO_STRIPE_COLORS[themeName];

      const stripesElement = utils.findAllElementByAttributeValue(
        root,
        'id',
        'stripes'
      );
      const blackFillElement = utils.findAllElementByAttributeValue(
        root,
        'id',
        'blackFill'
      );
      const blackStrokeElement = utils.findAllElementByAttributeValue(
        root,
        'id',
        'blackStroke'
      );

      if (
        blackStrokeElement.length > 1 ||
        blackFillElement.length > 1 ||
        stripesElement.length > 1
      ) {
        validateResult.hasIllustrationCorrectColorLayers = false;
        return validateResult;
      }

      if (blackStrokeElement.length < 1 || stripesElement.length < 1) {
        validateResult.hasIllustrationCorrectColorLayers = false;
        return validateResult;
      }

      const stripesFillElements = utils.findAllElementByAttribute(
        stripesElement[0],
        'fill'
      );
      const stripesColorsElements =
        collectFillsFromObjects(stripesFillElements);

      const blackStrokeColors = utils.findFillElementsByColors(
        blackStrokeElement[0],
        BLACK_FILL_AND_STROKE_COLOR
      );

      let blackFillResult = true;
      if (blackFillElement.length > 1) {
        const blackFillColors = utils.findFillElementsByColors(
          blackFillElement[0],
          BLACK_FILL_AND_STROKE_COLOR
        );
        blackFillResult = colorExistsInElement(
          blackFillColors,
          BLACK_FILL_AND_STROKE_COLOR
        );
      }

      result =
        isFillColorOrderCorrect(stripesColorsElements, stripeColorsOrder) &&
        blackFillResult &&
        colorExistsInElement(blackStrokeColors, BLACK_FILL_AND_STROKE_COLOR);
    }
  } else {
    console.error(ENOCLS);
  }

  validateResult.hasIllustrationCorrectColorLayers = result;

  return validateResult;
};

function colorExistsInElement(elementColors, checkedColor) {
  const result = elementColors.filter(
    (color) => color.toLowerCase() !== checkedColor.toLowerCase()
  );
  return result.length === 0;
}

function collectFillsFromObjects(elements) {
  const collectedFills = elements.map((element) => {
    if (element.attributes.fill) {
      return element.attributes.fill;
    }
  });
  return collectedFills;
}

// check if values have the same order in the arrays
function isFillColorOrderCorrect(elementColors, stripeColors) {
  let currentStripeColors = elementColors.map((color) => color.toLowerCase());
  for (let index = 0; index < stripeColors.length; index++) {
    if (stripeColors.includes(elementColors[index].toLowerCase())) {
      currentStripeColors = currentStripeColors.filter(
        (color) => color.toLowerCase() !== stripeColors[index].toLowerCase()
      );
    } else {
      return false;
    }
  }
  return currentStripeColors.length === 0;
}
