'use strict';

var container = require('./_collections').elemsGroups.container;

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
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeEmptyContainers = function(item) {

    return !(item.isElem(container) && !item.isElem('svg') && item.isEmpty());

};
