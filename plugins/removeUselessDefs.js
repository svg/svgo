'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'removes elements in <defs> without id';

var nonRendering = require('./_collections').elemsGroups.nonRendering;

/**
 * Removes content of defs and properties that aren't rendered directly without ids.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
exports.fn = function (item) {
  if (item.isElem('defs')) {
    item.children = getUsefulItems(item, []);
    if (item.children.length === 0) {
      return false;
    }
  } else if (item.isElem(nonRendering) && !item.hasAttr('id')) {
    return false;
  }
};

function getUsefulItems(item, usefulItems) {
  for (const child of item.children) {
    if (child.type === 'element') {
      if (child.hasAttr('id') || child.isElem('style')) {
        usefulItems.push(child);
        child.parentNode = item;
      } else {
        child.children = getUsefulItems(child, usefulItems);
      }
    }
  }

  return usefulItems;
}
