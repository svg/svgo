import { colorsNames, colorsProps, colorsShortNames } from './_collections.js';
import { includesUrlReference } from '../lib/svgo/tools.js';

/**
 * @typedef ConvertColorsParams
 * @property {boolean | string | RegExp | {value?: boolean | string | RegExp, excludeMulticolor?: boolean}=} currentColor
 * @property {boolean=} names2hex
 * @property {boolean=} rgb2hex
 * @property {false | 'lower' | 'upper'=} convertCase
 * @property {boolean=} shorthex
 * @property {boolean=} shortname
 */

export const name = 'convertColors';
export const description =
  'converts colors: rgb() to #rrggbb and #rrggbb to #rgb';

const rNumber = '([+-]?(?:\\d*\\.\\d+|\\d+\\.?)%?)';
const rComma = '(?:\\s*,\\s*|\\s+)';
const regRGB = new RegExp(
  '^rgb\\(\\s*' + rNumber + rComma + rNumber + rComma + rNumber + '\\s*\\)$',
);
const regHEX = /^#(([a-fA-F0-9])\2){3}$/;

/**
 * Convert [r, g, b] to #rrggbb.
 *
 * @see https://gist.github.com/983535
 *
 * @example
 * rgb2hex([255, 255, 255]) // '#ffffff'
 *
 * @author Jed Schmidt
 *
 * @param {ReadonlyArray<number>} param0
 * @returns {string}
 */
const convertRgbToHex = ([r, g, b]) => {
  // combine the octets into a 32-bit integer as: [1][r][g][b]
  const hexNumber =
    // operator precedence is (+) > (<<) > (|)
    ((((256 + // [1][0]
      r) << // [1][r]
      8) | // [1][r][0]
      g) << // [1][r][g]
      8) | // [1][r][g][0]
    b;
  // serialize [1][r][g][b] to a hex string, and
  // remove the 1 to get the number with 0s intact
  return '#' + hexNumber.toString(16).slice(1).toUpperCase();
};

/**
 * Check if SVG is single-color icon.
 *
 * @param {Object} node - SVG node
 * @returns {boolean}
 */
function isSingleColorIcon(node) {
  const colorValues = new Set();
  let hasMultipleColors = false;

  /**
   * Collect all color values, excluding masks.
   *
   * @param {any} element
   * @param {boolean} inMask
   */
  function collectColors(element, inMask = false) {
    if (hasMultipleColors) {
      return;
    }

    if (!element.attributes) {
      return;
    }

    for (const [name, value] of Object.entries(element.attributes)) {
      // skip non-color properties
      if (!colorsProps.has(name)) {
        continue;
      }

      // skip none and currentColor
      if (value === 'none' || value === 'currentColor') {
        continue;
      }

      // skip mask colors
      if (inMask || element.name === 'mask') {
        continue;
      }

      colorValues.add(value);

      if (colorValues.size > 1) {
        hasMultipleColors = true;
        return;
      }
    }

    if (!hasMultipleColors && element.children) {
      for (const child of element.children) {
        // mark children as in mask
        const childInMask = inMask || element.name === 'mask';
        collectColors(child, childInMask);

        // check after each child
        if (hasMultipleColors) {
          return;
        }
      }
    }
  }

  collectColors(node);

  if (hasMultipleColors) {
    return false;
  }

  // check for gradients
  if (colorValues.size === 1) {
    const hasGradient = Array.from(colorValues).some(
      (value) => typeof value === 'string' && includesUrlReference(value),
    );

    if (hasGradient) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a color value matches the currentColor configuration.
 *
 * @param {boolean | string | RegExp | {value?: boolean | string | RegExp, excludeMulticolor?: boolean}} currentColor - currentColor configuration
 * @param {string} val - color value to check
 * @returns {boolean} true if color should be converted
 */
function isColorMatched(currentColor, val) {
  if (typeof currentColor === 'string') {
    return val === currentColor;
  }

  if (currentColor instanceof RegExp) {
    return currentColor.exec(val) != null;
  }

  if (typeof currentColor === 'object' && !(currentColor instanceof RegExp)) {
    // object form: check value if provided, otherwise convert all
    if (currentColor.value != null) {
      if (typeof currentColor.value === 'string') {
        return val === currentColor.value;
      }
      if (currentColor.value instanceof RegExp) {
        return currentColor.value.exec(val) != null;
      }
      return currentColor.value && val !== 'none';
    }
    // no value specified, convert all non-none colors
    return val !== 'none';
  }

  return typeof currentColor === 'boolean' && currentColor && val !== 'none';
}

/**
 * Convert different colors formats in element attributes to hex.
 *
 * @see https://www.w3.org/TR/SVG11/types.html#DataTypeColor
 * @see https://www.w3.org/TR/SVG11/single-page.html#types-ColorKeywords
 *
 * @example
 * Convert color name keyword to long hex:
 * fuchsia ➡ #ff00ff
 *
 * Convert rgb() to long hex:
 * rgb(255, 0, 255) ➡ #ff00ff
 * rgb(50%, 100, 100%) ➡ #7f64ff
 *
 * Convert long hex to short hex:
 * #aabbcc ➡ #abc
 *
 * Convert hex to short name
 * #000080 ➡ navy
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin<ConvertColorsParams>}
 */
export const fn = (_root, params) => {
  const {
    currentColor = false,
    names2hex = true,
    rgb2hex = true,
    convertCase = 'lower',
    shorthex = true,
    shortname = true,
  } = params;

  let maskCounter = 0;
  let isSingleColor = false;
  let hasCheckedIconType = false;

  // only check icon type when needed
  const needsIconTypeCheck =
    currentColor &&
    typeof currentColor === 'object' &&
    !(currentColor instanceof RegExp) &&
    currentColor.excludeMulticolor === true;

  return {
    element: {
      enter: (node) => {
        if (node.name === 'mask') {
          maskCounter++;
        }

        // check icon type when needed
        if (needsIconTypeCheck && node.name === 'svg' && !hasCheckedIconType) {
          isSingleColor = isSingleColorIcon(node);
          hasCheckedIconType = true;
        }

        for (const [name, value] of Object.entries(node.attributes)) {
          if (colorsProps.has(name)) {
            let val = value;

            // convert colors to currentColor
            if (currentColor && maskCounter === 0) {
              let shouldConvert = true;

              // exclude multi-color icons (unless specific value is provided)
              if (needsIconTypeCheck) {
                // if value is specified, always convert that specific color
                // if no value, only convert on single-color icons
                shouldConvert = currentColor.value != null || isSingleColor;
              }

              if (shouldConvert) {
                const matched = isColorMatched(currentColor, val);
                if (matched) {
                  val = 'currentColor';
                }
              }
            }

            // convert color name keyword to long hex
            if (names2hex) {
              const colorName = val.toLowerCase();
              if (colorsNames[colorName] != null) {
                val = colorsNames[colorName];
              }
            }

            // convert rgb() to long hex
            if (rgb2hex) {
              const match = val.match(regRGB);
              if (match != null) {
                const nums = match.slice(1, 4).map((m) => {
                  let n;
                  if (m.indexOf('%') > -1) {
                    n = Math.round(parseFloat(m) * 2.55);
                  } else {
                    n = Number(m);
                  }
                  return Math.max(0, Math.min(n, 255));
                });
                val = convertRgbToHex(nums);
              }
            }

            if (
              convertCase &&
              !includesUrlReference(val) &&
              val !== 'currentColor'
            ) {
              if (convertCase === 'lower') {
                val = val.toLowerCase();
              } else if (convertCase === 'upper') {
                val = val.toUpperCase();
              }
            }

            // convert long hex to short hex
            if (shorthex) {
              const match = regHEX.exec(val);
              if (match != null) {
                val = '#' + match[0][1] + match[0][3] + match[0][5];
              }
            }

            // convert hex to short name
            if (shortname) {
              const colorName = val.toLowerCase();
              if (colorsShortNames[colorName] != null) {
                val = colorsShortNames[colorName];
              }
            }

            node.attributes[name] = val;
          }
        }
      },
      exit: (node) => {
        if (node.name === 'mask') {
          maskCounter--;
        }
      },
    },
  };
};
