'use strict';

exports.type = 'perItem';

exports.active = true;

var EXTEND = require('whet.extend'),
    stylingProps = require('./_collections').stylingProps,
    regDeclarationBlock = /\s*((?:[\w-]+|\\(?:[0-9a-f]{1,6}|.)\s?)*)\s*:\s*((?:[^'"();\\]+|\\(?:[0-9a-f]{1,6}|.)\s?|'(?:[^'\\\n\r]|\\(?:[0-9a-f]{1,6}|\r\n|.)\s?)*'|"(?:[^"\\\n\r]|\\(?:[0-9a-f]{1,6}|\r\n|.)\s?)*"|[\w-]+\((?:[^'"()]+|'(?:[^'\\\n\r]|\\(?:[0-9a-f]{1,6}|\r\n|.)\s?)*'|"(?:[^"\\\n\r]|\\(?:[0-9a-f]{1,6}|\r\n|.)\s?)*")*\))*|[^;]*)\s*(?:;\s*|$)/ig,
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
        var styleValue = item.attr('style').value,
            styles = [],
            attrs = {};

        regDeclarationBlock.lastIndex = 0;
        for (var rule, decl; rule = regDeclarationBlock.exec(styleValue);) {
            decl = [rule[1], rule[2]];
            decl.toString = stringifyDeclaration;
            styles.push(decl);
        }

        if (styles.length) {

            styles = styles.filter(function(style) {
                if (style) {
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

function stringifyDeclaration() {
    return this.join(':');
}
