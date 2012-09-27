var container = require('./_collections').elems.container;

/**
 * Remove empty containers.
 *
 * @see http://www.w3.org/TR/SVG/intro.html#TermContainerElement
 *
 * @example
 * <defs/>
 *
 * @example
 * <g><marker><a/></marker></g>
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeEmptyContainers = function(item, params) {

    return !(item.isElem(container) && item.isEmpty());

};
