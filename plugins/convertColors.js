'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
    names2hex: true,
    rgb2hex: true,
    shorthex: true
};

var collections = require('./_collections'),
    regRGB = /^rgb\((\d+%?),\s*(\d+%?),\s*(\d+%?)\)$/,
    regHEX = /^\#(([a-fA-F0-9])\2){3}$/;

/**
 * Convert different colors formats in element attributes to hex.
 *
 * @see http://www.w3.org/TR/SVG/types.html#DataTypeColor
 * @see http://www.w3.org/TR/SVG/single-page.html#types-ColorKeywords
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
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item, params) {

    if (item.elem) {

        item.eachAttr(function(attr) {

            if (collections.colorsProps.indexOf(attr.name) > -1) {

                var val = attr.value.toLowerCase(),
                    tmp = val,
                    match;

                // Convert color name keyword to long hex
                if (params.names2hex && val in collections.colorsNames) {
                    val = collections.colorsNames[val];
                }

                // Convert rgb() to long hex
                if (params.rgb2hex && (match = val.match(regRGB))) {
                    match = match.slice(1, 4).map(function(m) {
                        if (m.indexOf('%') > -1) {
                            m = Math.round(parseFloat(m) * 2.55);
                        }

                        return +m;
                    });

                    val = rgb2hex(match);
                }

                // Convert long hex to short hex
                if (params.shorthex && (match = val.match(regHEX))) {
                    val = '#' + match[0][1] + match[0][3] + match[0][5];
                }

                if (tmp !== val) attr.value = val;

            }

        });

    }

};

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
    return '#' + ((256 + rgb[0] << 8 | rgb[1]) << 8 | rgb[2]).toString(16).slice(1);
}
