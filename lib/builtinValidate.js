'use strict';

exports.builtinValidate = [
  require('../pluginsValidate/isSnakeCase.js'),
  require('../pluginsValidate/isArtboardCorrect.js'),
  require('../pluginsValidate/isFillRule.js'),
  require('../pluginsValidate/isWorkingAreaCorrect.js'),
  require('../pluginsValidate/isCorrectSvg.js'),
  require('../pluginsValidate/isJSON.js'),
  require('../pluginsValidate/isText.js'),
  require('../pluginsValidate/hasNoDiacriticCharacters.js'),
  require('../pluginsValidate/isSuffixPresent.js'),
  require('../pluginsValidate/areLayersIDsOrderCorrect.js'),
  require('../pluginsValidate/elementsLimitation.js'),
  require('../pluginsValidate/isISO3166_1Alpha2.js'),
  require('../pluginsValidate/hasNoAttribute.js'),
  require('../pluginsValidate/hasCorrectStripeColors.js'),
  require('../pluginsValidate/hasIllustrationCorrectColorLayers.js'),
  require('../pluginsValidate/hasNoColorSuffix.js'),
  require('../pluginsValidate/isDarkmodeMaskCorrect.js'),
  require('../pluginsValidate/isBlackStrokeCorrect.js'),
];
