'use strict';

exports.type = 'perItem';

exports.active = true;

var EXTEND = require('whet.extend'),
    stylingProps = require('./_collections').stylingProps,
    regCleanupStyle = /(:|;)\s+/g;

/**
 * Convert style in attributes.
 *
 * @example
 * <g style="fill:#000; color: #fff;">
 *             ⬇
 * <g fill="#000" color="#fff">
 *
 * @example
 * <g style="fill:#000; color: #fff; -webkit-blah: blah">
 *             ⬇
 * <g fill="#000" color="#fff" slyle="-webkit-blah: blah">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    if (item.elem && item.hasAttr('style')) {
            // ['opacity: 1', 'color: #000']
        var styles = item.attr('style').value.split(';').filter(function(style) {
                return style;
            }),
            attrs = {};

        if (styles.length) {

            styles = styles.filter(function(style) {
                if (style) {
                    // ['opacity', 1]
                    style = style.split(':');

                    var prop = style[0].trim(),
                        val = style[1].replace(/^[\'\"](.+)[\'\"]$/, '$1').trim();

                    if (stylingProps.indexOf(prop) > -1) {

                        attrs[prop] = {
                            name: prop,
                            value: val,
                            local: prop,
                            prefix: ''
                        };

                        return false;
                    }
                }

                return true;
            });

            EXTEND(item.attrs, attrs);

            if (styles.length) {
                item.attr('style').value = styles.join(';')
                                                .replace(regCleanupStyle, '$1')
                                                .trim();
            } else {
                item.removeAttr('style');
            }

        }

    }

};
