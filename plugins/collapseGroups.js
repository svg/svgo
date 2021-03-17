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
    item.name !== 'switch' &&
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
            for (const [name, value] of Object.entries(g.attributes)) {
              if (g.children.some(hasAnimatedAttr, name)) return;

              if (!inner.hasAttr(name)) {
                inner.attributes[name] = value;
              } else if (name == 'transform') {
                inner.attributes[name] = value + ' ' + inner.attributes[name];
              } else if (inner.hasAttr(name, 'inherit')) {
                inner.attributes[name] = value;
              } else if (
                attrsInheritable.includes(name) === false &&
                !inner.hasAttr(name, value)
              ) {
                return;
              }

              delete g.attributes[name];
            }
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
