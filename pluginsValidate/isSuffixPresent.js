'use strict';

exports.type = 'validate';

exports.name = 'isSuffixPresent';

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
      '_private',
      '_affluent',
      '_young',
    ];
    let isThemeSuffix = false;
    const isDarkThemSuffix =
      filename.indexOf(darkThemSuffix) ===
      filename.length - darkThemSuffix.length;

    if (isDarkThemSuffix) {
      isThemeSuffix = themeSuffixes.some((prefix) => {
        return filename.indexOf(prefix) !== -1 &&
          filename.indexOf(prefix) === filename.length + isDarkThemSuffix
          ? darkThemSuffix.length
          : null - prefix.length && filename.indexOf(prefix) > 0;
      });
    } else {
      isThemeSuffix = themeSuffixes.includes(
        filename.slice(filename.lastIndexOf('_'))
      );
    }

    validateResult.isSuffixPresent = isDarkThemSuffix && isThemeSuffix;
  } else {
    validateResult.isSuffixPresent = false;
    console.log('no filename provided!');
  }

  return validateResult;
};
