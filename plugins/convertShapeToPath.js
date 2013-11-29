'use strict';

exports.type = 'perItem';

exports.active = true;

var empty = { value: 0 },
    regSeparator = /\s+,?\s*|,\s*/;

/**
 * Converts basic shape to more compact path.
 * It also allows further optimizations like
 * combining paths with similar attributes.
 *
 * @see http://www.w3.org/TR/SVG/shapes.html
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
exports.fn = function(item, params) {

    if (
        item.isElem('rect') &&
        item.hasAttr('width') &&
        item.hasAttr('height') &&
        !item.hasAttr('rx') &&
        !item.hasAttr('ry')
    ) {

        var x = +(item.attr('x') || empty).value,
            y = +(item.attr('y') || empty).value,
            width  = +item.attr('width').value,
            height = +item.attr('height').value;

            // Values like '100%' compute to NaN, thus running after
            // cleanupNumericValues when 'px' units has already been removed.
            // TODO: Calculate sizes from % and non-px units if possible.
        if (isNaN(x - y + width - height)) return;

        var pathData =
            'M' + x + ' ' + y +
            'H' + (x + width) +
            'V' + (y + height) +
            'H' + x +
            'z';

        item.addAttr({
                name: 'd',
                value: pathData,
                prefix: '',
                local: 'd'
            });

        ['x', 'y', 'width', 'height'].forEach(function(attr){ item.removeAttr(attr) });
        item.elem = item.local = 'path';

    } else if (item.isElem('line')) {

        var x1 = +(item.attr('x1') || empty).value,
            y1 = +(item.attr('y1') || empty).value,
            x2 = +(item.attr('x2') || empty).value,
            y2 = +(item.attr('y2') || empty).value;
        if (isNaN(x1 - y1 + x2 - y2)) return;

        item.addAttr({
                name: 'd',
                value: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2,
                prefix: '',
                local: 'd'
            });

        ['x1', 'y1', 'x2', 'y2'].forEach(function(attr){ item.removeAttr(attr) });
        item.elem = item.local = 'path';

    } else if ((
            item.isElem('polyline') ||
            item.isElem('polygon')
        ) &&
        item.hasAttr('points')
    ) {

        var coords = item.attr('points').value.split(regSeparator);
        if (coords.length < 4) return false;

        item.addAttr({
                name: 'd',
                value: 'M' + coords.slice(0,2).join(' ') +
                       'L' + coords.slice(2).join(' ') +
                       (item.isElem('polygon') ? 'z' : ''),
                prefix: '',
                local: 'd'
            });

        item.removeAttr('points');
        item.elem = item.local = 'path';

    }

};