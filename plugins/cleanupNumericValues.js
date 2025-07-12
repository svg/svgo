import { removeLeadingZero } from '../lib/svgo/tools.js';

/**
 * @typedef CleanupNumericValuesParams
 * @property {number=} floatPrecision
 * @property {boolean=} leadingZero
 * @property {boolean=} defaultPx
 * @property {boolean=} convertToPx
 */

export const name = 'cleanupNumericValues';
export const description =
  'rounds numeric values to the fixed precision, removes default "px" units';

const regNumericValues =
  /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)(px|pt|pc|mm|cm|m|in|ft|em|ex|%)?$/;

const absoluteLengths = {
  // relative to px
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  in: 96,
  pt: 4 / 3,
  pc: 16,
  px: 1,
};

/**
 * Round numeric values to the fixed precision, remove default 'px' units.
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin<CleanupNumericValuesParams>}
 */
export const fn = (_root, params) => {
  const {
    floatPrecision = 3,
    leadingZero = true,
    defaultPx = true,
    convertToPx = true,
  } = params;

  return {
    element: {
      enter: (node) => {
        if (node.attributes.viewBox != null) {
          const nums = node.attributes.viewBox.trim().split(/(?:\s,?|,)\s*/g);
          node.attributes.viewBox = nums
            .map((value) => {
              const num = Number(value);
              return Number.isNaN(num)
                ? value
                : Number(num.toFixed(floatPrecision));
            })
            .join(' ');
        }

        for (const [name, value] of Object.entries(node.attributes)) {
          // The `version` attribute is a text string and cannot be rounded
          if (name === 'version') {
            continue;
          }

          const match = regNumericValues.exec(value);

          // if attribute value matches regNumericValues
          if (match) {
            // round it to the fixed precision
            let num = Number(Number(match[1]).toFixed(floatPrecision));
            /** @type {any} */
            const matchedUnit = match[3] || '';
            /** @type {'' | keyof typeof absoluteLengths} */
            let units = matchedUnit;

            // convert absolute values to pixels
            if (convertToPx && units !== '' && units in absoluteLengths) {
              const pxNum = Number(
                (absoluteLengths[units] * Number(match[1])).toFixed(
                  floatPrecision,
                ),
              );
              if (pxNum.toString().length < match[0].length) {
                num = pxNum;
                units = 'px';
              }
            }

            // and remove leading zero
            let str;
            if (leadingZero) {
              str = removeLeadingZero(num);
            } else {
              str = num.toString();
            }

            // remove default 'px' units
            if (defaultPx && units === 'px') {
              units = '';
            }

            node.attributes[name] = str + units;
          }
        }
      },
    },
  };
};
