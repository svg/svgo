'use strict';

var regNumericValues = /^([\-+]?\d*\.?\d+)(px|pt|pc|mm|cm|m|in|ft|em|ex|%)?$/,
    removeLeadingZero = require('../lib/svgo/tools').removeLeadingZero;

/**
 * Round numeric values to the fixed precision.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.roundNumericValues = function(item, params) {

    if (item.isElem()) {

        var match;

        item.eachAttr(function(attr) {
            match = attr.value.match(regNumericValues);

            // if attribute value matches regNumericValues
            if (match) {
                // then round it to the fixed precision
                var num = +(+match[1]).toFixed(params.floatPrecision) + (match[2] || '');

                // and remove leading zero
                if (params.leadingZero) {
                    num = removeLeadingZero(num);
                }

                attr.value = num;
            }
        });

    }

};
