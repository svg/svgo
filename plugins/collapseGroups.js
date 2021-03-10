'use strict';

exports.type = 'perItemReverse';

exports.active = true;

exports.description = 'collapses useless groups';

var collections = require('./_collections'),
  attrsInheritable = collections.inheritableAttrs,
  animationElems = collections.elemsGroups.animation;

function hasAnimatedAttr(item) {
  return (
    (item.isElem(animationElems) && item.hasAttr('attributeName', this)) ||
    (item.type === 'element' &&
      item.children.length !== 0 &&
      item.children.some(hasAnimatedAttr, this))
  );
}

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
exports.fn = function (item) {
  // non-empty elements
  if (
    item.type === 'element' &&
    !item.isElem('switch') &&
    item.children.length !== 0
  ) {
    item.children.forEach(function (g, i) {
      // non-empty groups
      if (g.isElem('g') && g.children.length !== 0) {
        // move group attibutes to the single child element
        if (g.hasAttr() && g.children.length === 1) {
          var inner = g.children[0];

          if (
            inner.type === 'element' &&
            !inner.hasAttr('id') &&
            !g.hasAttr('filter') &&
            !(g.hasAttr('class') && inner.hasAttr('class')) &&
            ((!g.hasAttr('clip-path') && !g.hasAttr('mask')) ||
              (inner.isElem('g') &&
                !g.hasAttr('transform') &&
                !inner.hasAttr('transform')))
          ) {
            g.eachAttr(function (attr) {
              if (g.children.some(hasAnimatedAttr, attr.name)) return;

              if (!inner.hasAttr(attr.name)) {
                inner.addAttr(attr);
              } else if (attr.name == 'transform') {
                inner.attr(attr.name).value =
                  attr.value + ' ' + inner.attr(attr.name).value;
              } else if (inner.hasAttr(attr.name, 'inherit')) {
                inner.attr(attr.name).value = attr.value;
              } else if (
                attrsInheritable.indexOf(attr.name) < 0 &&
                !inner.hasAttr(attr.name, attr.value)
              ) {
                return;
              }

              g.removeAttr(attr.name);
            });
          }
        }

        // collapse groups without attributes
        if (
          !g.hasAttr() &&
          !g.children.some(function (item) {
            return item.isElem(animationElems);
          })
        ) {
          item.spliceContent(i, 1, g.children);
        }
      }
    });
  }
};
