var flattenOneLevel = require('../lib/tools').flattenOneLevel;

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
 * <path d="..."/>
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.collapseGroups = function(item, params) {

    // non-empty elements
    if (item.isElem() && !item.isEmpty()) {

        var unflatten = false;

        item.content.forEach(function(g, i) {

            // non-empty groups
            if (g.isElem('g') && !g.isEmpty()) {

                // move group attibutes to the single content element
                if (g.hasAttr() && g.content.length === 1) {
                    var inner = g.content[0];

                    if (inner.isElem()) {
                        g.eachAttr(function(attr) {
                            if (!inner.hasAttr(attr.name)) {
                                inner.addAttr(attr);
                            }
                            g.removeAttr(attr);
                        });
                    }
                }

                // collapse groups without attributes
                if (!g.hasAttr()) {
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
