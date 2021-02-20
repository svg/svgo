'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'removes editors namespaces, elements and attributes';

var editorNamespaces = require('./_collections').editorNamespaces,
    prefixes = [],
    preserve = [];

exports.params = {
    additionalNamespaces: [],
    preserve: [],  // preserves elements and attributes
};

/**
 * Remove editors namespaces, elements and attributes.
 *
 * @example
 * <svg xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">
 * <sodipodi:namedview/>
 * <path sodipodi:nodetypes="cccc"/>
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item, params) {

    if (Array.isArray(params.additionalNamespaces)) {
        editorNamespaces = editorNamespaces.concat(params.additionalNamespaces);
    }
    if (Array.isArray(params.preserve)) {
        preserve = preserve.concat(params.preserve);
    }

    if (item.elem) {

        if (item.isElem('svg')) {

            item.eachAttr(function(attr) {
                if (attr.prefix === 'xmlns' && editorNamespaces.indexOf(attr.value) > -1) {
                    prefixes.push(attr.local);

                    // <svg xmlns:sodipodi="">
                    if (preserve.indexOf(attr.name) === -1) {
                      item.removeAttr(attr.name);
                    }
                }
            });

        }

        // <* sodipodi:*="">
        item.eachAttr(function(attr) {
            if (prefixes.indexOf(attr.prefix) > -1 && preserve.indexOf(attr.name) === -1) {
                item.removeAttr(attr.name);
            }
        });

        // <sodipodi:*>
        if (prefixes.indexOf(item.prefix) > -1 && preserve.indexOf(item.elem) === -1) {
            return false;
        }

    }

};
