'use strict';

exports.type = 'perItemReverse';

exports.active = true;

exports.description = 'moves elements attributes to the existing group wrapper';

var inheritableAttrs = require('./_collections').inheritableAttrs,
  pathElems = require('./_collections.js').pathElems;

/**
 * Collapse content's intersected and inheritable
 * attributes to the existing group wrapper.
 *
 * @example
 * <g attr1="val1">
 *     <g attr2="val2">
 *         text
 *     </g>
 *     <circle attr2="val2" attr3="val3"/>
 * </g>
 *              ⬇
 * <g attr1="val1" attr2="val2">
 *     <g>
 *         text
 *     </g>
 *    <circle attr3="val3"/>
 * </g>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (item) {
  if (item.isElem('g') && item.children.length > 1) {
    var intersection = {},
      hasTransform = false,
      hasClip = item.hasAttr('clip-path') || item.hasAttr('mask'),
      intersected = item.children.every(function (inner) {
        if (inner.type === 'element' && inner.hasAttr()) {
          // don't mess with possible styles (hack until CSS parsing is implemented)
          if (inner.hasAttr('class')) return false;
          if (!Object.keys(intersection).length) {
            intersection = inner.attributes;
          } else {
            intersection = intersectInheritableAttrs(
              intersection,
              inner.attributes
            );

            if (!intersection) return false;
          }

          return true;
        }
      }),
      allPath = item.children.every(function (inner) {
        return inner.isElem(pathElems);
      });

    if (intersected) {
      item.children.forEach(function (g) {
        for (const [name, value] of Object.entries(intersection)) {
          if ((!allPath && !hasClip) || name !== 'transform') {
            delete g.attributes[name];

            if (name === 'transform') {
              if (!hasTransform) {
                if (item.hasAttr('transform')) {
                  item.attr('transform').value += ' ' + value;
                } else {
                  item.addAttr({ name, value });
                }

                hasTransform = true;
              }
            } else {
              item.addAttr({ name, value });
            }
          }
        }
      });
    }
  }
};

/**
 * Intersect inheritable attributes.
 *
 * @param {Object} a first attrs object
 * @param {Object} b second attrs object
 *
 * @return {Object} intersected attrs object
 */
function intersectInheritableAttrs(a, b) {
  var c = {};

  for (const [name, value] of Object.entries(a)) {
    if (
      // eslint-disable-next-line no-prototype-builtins
      b.hasOwnProperty(name) &&
      inheritableAttrs.includes(name) &&
      value === b[name]
    ) {
      c[name] = value;
    }
  }

  if (!Object.keys(c).length) return false;

  return c;
}
