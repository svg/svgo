'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
    stroke: true,
    fill: true
};

var regStrokeProps = /^stroke/,
    regFillProps = /^fill/;

/**
 * Remove useless stroke and fill attrs.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item, params) {

    if (item.isElem()) {

        // remove stroke*
        if (
            params.stroke &&
            (!item.hasAttr('stroke') ||
             item.hasAttr('stroke-opacity', '0') ||
             item.hasAttr('stroke-width', '0')
            )
        ) {
            item.eachAttr(function(attr) {
                if (regStrokeProps.test(attr.name)) {
                    item.removeAttr(attr.name);
                }
            });
        }

        // remove fill*
        if (
            params.fill &&
            item.hasAttr('fill', 'none') ||
            item.hasAttr('fill-opacity', '0')
        ) {
            item.eachAttr(function(attr) {
                if (regFillProps.test(attr.name)) {
                    item.removeAttr(attr.name);
                }
            });

            item.addAttr({
                name: 'fill',
                value: 'none',
                prefix: '',
                local: 'fill'
            });
        }

    }

};
