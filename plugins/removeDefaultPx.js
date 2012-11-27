'use strict';

var regValPx = /^(-?(?:[0-9]+|[0-9]*\.[0-9]+))px$/;

/**
 * Remove default "px" unit from attributes values.
 *
 * "One px unit is defined to be equal to one user unit.
 * Thus, a length of 5px is the same as a length of 5"
 * http://www.w3.org/TR/SVG/coords.html#Units
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeDefaultPx = function(item) {

    if (item.elem) {

        item.eachAttr(function(attr) {
            attr.value = attr.value.replace(regValPx, '$1');
        });

    }

};
