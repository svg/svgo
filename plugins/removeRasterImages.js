'use strict';

exports.type = 'perItem';

exports.active = false;

/**
 * Remove raster images references in <image>.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=63548
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    if (
        item.isElem('image') &&
        item.hasAttr('xlink:href') &&
        /(\.|image\/)(jpg|png|gif)/.test(item.attr('xlink:href').value)
    ) {
        return false;
    }

};
