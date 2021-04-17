'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'converts colors: rgb() to #rrggbb and #rrggbb to #rgb';

exports.params = {
  currentColor: false,
  names2hex: true,
  hsl2hex: true,
  rgb2hex: true,
  shorthex: true,
  shortname: true,
};

var collections = require('./_collections'),
  rNumber = '([+-]?(?:\\d*\\.\\d+|\\d+\\.?)%?)',
  rComma = '\\s*,\\s*',
  regHSL = new RegExp(
    '^hsl\\(\\s*' + rNumber + rComma + rNumber + '%' + rComma + rNumber + '%\\s*\\)$'
  ),
  regRGB = new RegExp(
    '^rgb\\(\\s*' + rNumber + rComma + rNumber + rComma + rNumber + '\\s*\\)$'
  ),
  regHEX = /^#(([a-fA-F0-9])\2){3}$/,
  none = /\bnone\b/i;

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
 * Convert hsl() to long hex:
 * hsl(120, 100%, 50%) ➡ #00ff00
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
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (item, params) {
  if (item.type === 'element') {
    for (const [name, value] of Object.entries(item.attributes)) {
      if (collections.colorsProps.includes(name)) {
        let val = value;
        let match;

        // Convert colors to currentColor
        if (params.currentColor) {
          if (typeof params.currentColor === 'string') {
            match = val === params.currentColor;
          } else if (params.currentColor.exec) {
            match = params.currentColor.exec(val);
          } else {
            match = !val.match(none);
          }
          if (match) {
            val = 'currentColor';
          }
        }

        // Convert color name keyword to long hex
        if (params.names2hex && val.toLowerCase() in collections.colorsNames) {
          val = collections.colorsNames[val.toLowerCase()];
        }

        // Convert hsl() to long hex
        if (params.hsl2hex && (match = val.match(regHSL))) {
          match = match.slice(1, 4);
          val = hsl2hex(match);
        }

        // Convert rgb() to long hex
        if (params.rgb2hex && (match = val.match(regRGB))) {
          match = match.slice(1, 4).map(function (m) {
            if (m.indexOf('%') > -1) m = Math.round(parseFloat(m) * 2.55);

            return Math.max(0, Math.min(m, 255));
          });

          val = rgb2hex(match);
        }

        // Convert long hex to short hex
        if (params.shorthex && (match = val.match(regHEX))) {
          val = '#' + match[0][1] + match[0][3] + match[0][5];
        }

        // Convert hex to short name
        if (params.shortname) {
          var lowerVal = val.toLowerCase();
          if (lowerVal in collections.colorsShortNames) {
            val = collections.colorsShortNames[lowerVal];
          }
        }

        item.attributes[name] = val;
      }
    }
  }
};

/**
 * Convert [h, s, l] to #rrggbb.
 *
 * @example
 * hsl2hex([120, 100, 50]) // '#00ff00'
 *
 * @param {Array} hsl [h, s, l]
 * @return {String} #rrggbb
 */
function hsl2hex(hsl) {
  hsl[2] /= 100;
  const a = hsl[1] * Math.min(hsl[2], 1 - hsl[2]) / 100;
  const f = n => {
    const k = (n + hsl[0] / 30) % 12;
    const color = hsl[2] - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Convert [r, g, b] to #rrggbb.
 *
 * @see https://gist.github.com/983535
 *
 * @example
 * rgb2hex([255, 255, 255]) // '#ffffff'
 *
 * @param {Array} rgb [r, g, b]
 * @return {String} #rrggbb
 *
 * @author Jed Schmidt
 */
function rgb2hex(rgb) {
  return (
    '#' +
    ('00000' + ((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]).toString(16))
      .slice(-6)
      .toUpperCase()
  );
}
