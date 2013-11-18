'use strict';

exports.type = 'perItemReverse';

exports.active = true;

var flattenOneLevel = require('../lib/svgo/tools').flattenOneLevel;

/*
 * Collapse useless groups.
 *
 * @example
 * <g>
 *     <g attr1="val1">
 *         <path d="..."/>
 *     </g>
 * </g>
 *         ⬇
 * <g>
 *     <g>
 *         <path attr1="val1" d="..."/>
 *     </g>
 * </g>
 *         ⬇
 * <path attr1="val1" d="..."/>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    // non-empty elements
    if (item.elem && !item.isEmpty()) {

        var unflatten = false;

        item.content.forEach(function(g, i) {

            // non-empty groups
            if (g.isElem('g') && !g.isEmpty()) {

                // move group attibutes to the single content element
                if (g.attrs && g.content.length === 1) {
                    var inner = g.content[0];

                    if (inner.elem && !(g.hasAttr('transform') && g.hasAttr('clip-path') && inner.hasAttr('transform'))) {
                        g.eachAttr(function(attr) {
                            if (!inner.hasAttr(attr.name)) {
                                inner.addAttr(attr);
                            } else if (attr.name === 'transform') {
                                inner.attr(attr.name).value = attr.value + ' ' + inner.attr(attr.name).value;
                            }
                            g.removeAttr(attr.name);
                        });
                    }
                }

                // collapse groups without attributes
                if (!g.attrs) {
                    unflatten = true;

                    item.content.splice(i, 1, g.content);
                }
            }

        });

        if (unflatten) {
            item.content = flattenOneLevel(item.content);
        }

    }

};
