'use strict';

var regNewlines = /\n/g,
    regSpaces = /\s{2,}/g;

/**
 * Cleanup attributes values from newlines, trailing and repeating spaces.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.cleanupAttrs = function(item, params) {

    if (item.isElem()) {

        item.eachAttr(function(attr) {

            if (params.newlines) {
                attr.value = attr.value.replace(regNewlines, '');
            }

            if (params.trim) {
                attr.value = attr.value.trim();
            }

            if (params.spaces) {
                attr.value = attr.value.replace(regSpaces, ' ');
            }

        });

    }

};
