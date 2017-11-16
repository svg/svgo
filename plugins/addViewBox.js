'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'adds viewBox attribute when possible';

var viewBoxElems = ['svg', 'pattern', 'symbol'];

/**
 * Add viewBox attr which coincides with a width/height box. Prevent SVGs from breaking in IE9+. Disabled by default.
 *
 * @see http://www.w3.org/TR/SVG/coords.html#ViewBoxAttribute
 *
 * @example
 * <svg width="100" height="50">
 *             ⬇
 * <svg width="100" height="50" viewBox="0 0 100 50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Andrew M
 */
exports.fn = function(item) {

    if (
        item.isElem(viewBoxElems) &&
        !item.hasAttr('viewBox') &&
        item.hasAttr('width') &&
        item.hasAttr('height')
    ) {
        var width = parseFloat(item.attr('width').value);
        var height = parseFloat(item.attr('height').value);

        item.addAttr({
            name: 'viewbox',
            value: [0, 0, width, height].join(' '),
            prefix: '',
            local: 'viewbox'
        });
    }

};
