'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'converts circles to paths';

/**
 * Converts circles to paths. Useful if a lot of SVGs are used
 * for icons on a webpage, so all styles can be applied to `path`.
 *
 * @param {Object} item current iteration item
 *
 * @author Lev Solntsev, Dan Newcome, Peter Oesteritz
 */
exports.fn = function(item) {

    if (
        item.isElem('circle') &&
        item.hasAttr('cx') &&
        item.hasAttr('cy') &&
        item.hasAttr('r')
    ) {

        var cx = item.attr('cx').value,
            cy = item.attr('cy').value,
            r = item.attr('r').value,
            pathData =
            'M' + cx + ' ' + cy +
            'a' + r + ' ' + r + ' 0 1 0 ' + (r * 2) + ' 0' +
            'a' + r + ' ' + r + ' 0 1 0 ' + (-r * 2) + ' 0z';

        item.renameElem('path');
        item.removeAttr(['cx', 'cy', 'r']);
        item.addAttr({
                name: 'd',
                value: pathData,
                prefix: '',
                local: 'd'
            });

    } else if (
        item.isElem('ellipse') &&
        item.hasAttr('cx') &&
        item.hasAttr('cy') &&
        item.hasAttr('rx') &&
        item.hasAttr('ry')
    ) {

        var cx = item.attr('cx').value,
            cy = item.attr('cy').value,
            rx = item.attr('rx').value,
            ry = item.attr('ry').value,
            pathData =
            'M' + cx + ' ' + cy +
            'a' + rx + ' ' + ry + ' 0 1 0 ' + (rx * 2) + ' 0' +
            'a' + rx + ' ' + ry + ' 0 1 0 ' + (-rx * 2) + ' 0z';

        item.renameElem('path');
        item.removeAttr(['cx', 'cy', 'rx', 'ry']);
        item.addAttr({
                name: 'd',
                value: pathData,
                prefix: '',
                local: 'd'
            });

    }

};
