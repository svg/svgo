'use strict';

exports.type = 'perItem';

exports.active = true;

var regEnableBackground = /^new\s0\s0\s([\-+]?\d*\.?\d+([eE][\-+]?\d+)?)\s([\-+]?\d*\.?\d+([eE][\-+]?\d+)?)$/,
    elems = ['svg', 'mask', 'pattern'];

/**
 * Remove or cleanup enable-background attr which coincides with a width/height box.
 *
 * @see http://www.w3.org/TR/SVG/filters.html#EnableBackgroundProperty
 *
 * @example
 * <svg width="100" height="50" enable-background="new 0 0 100 50">
 *             ⬇
 * <svg width="100" height="50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    if (
        item.isElem(elems) &&
        item.hasAttr('enable-background') &&
        item.hasAttr('width') &&
        item.hasAttr('height')
    ) {

        var match = item.attr('enable-background').value.match(regEnableBackground);

        if (match) {
            if (
                item.attr('width').value === match[1] &&
                item.attr('height').value === match[3]
            ) {
                if (item.isElem('svg')) {
                    item.removeAttr('enable-background');
                } else {
                    item.attr('enable-background').value = 'new';
                }
            }
        }

    }

};
