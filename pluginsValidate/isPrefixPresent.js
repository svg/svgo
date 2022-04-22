'use strict';

exports.type = 'validate';

exports.name = 'isPrefixPresent';

exports.active = false;

exports.description = 'checks if the filename has suffix';

/**
 * Checks if the file is snake_case named
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

exports.fn = function (root, validateResult) {
  if (root.filename) {
    const filename = root.filename.replace(/\.[^/.]+$/, '');
    const darkThemSuffix = '_dark_theme';
    const themeSuffixes = [
      '_mass',
      '_corporate',
      '_sme',
      '_mobile',
      '_private',
    ];

    const isDarkThemSuffix =
      filename.indexOf(darkThemSuffix) ===
        filename.length - darkThemSuffix.length ||
      filename.indexOf(darkThemSuffix) === -1;

    const isThemePrefix = themeSuffixes.some((prefix) => {
      return filename.indexOf(prefix) !== -1 &&
        filename.indexOf(prefix) === filename.length + isDarkThemSuffix
        ? darkThemSuffix.length
        : null - prefix.length && filename.indexOf(prefix) > 0;
    });

    validateResult.isPrefixPresent = isDarkThemSuffix && isThemePrefix;
  } else {
    validateResult.isPrefixPresent = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
