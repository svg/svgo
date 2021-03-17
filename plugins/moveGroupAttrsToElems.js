'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'moves some group attributes to the content elements';

var collections = require('./_collections.js'),
  pathElems = collections.pathElems.concat(['g', 'text']),
  referencesProps = collections.referencesProps;

/**
 * Move group attrs to the content elements.
 *
 * @example
 * <g transform="scale(2)">
 *     <path transform="rotate(45)" d="M0,0 L10,20"/>
 *     <path transform="translate(10, 20)" d="M0,10 L20,30"/>
 * </g>
 *                          ⬇
 * <g>
 *     <path transform="scale(2) rotate(45)" d="M0,0 L10,20"/>
 *     <path transform="scale(2) translate(10, 20)" d="M0,10 L20,30"/>
 * </g>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (item) {
  // move group transform attr to content's pathElems
  if (
    item.type === 'element' &&
    item.name === 'g' &&
    item.children.length !== 0 &&
    item.attributes.transform != null &&
    Object.entries(item.attributes).some(
      ([name, value]) =>
        referencesProps.includes(name) && value.includes('url(')
    ) === false &&
    item.children.every(
      (inner) => inner.isElem(pathElems) && !inner.hasAttr('id')
    )
  ) {
    for (const inner of item.children) {
      const value = item.attributes.transform;
      if (inner.attributes.transform != null) {
        inner.attributes.transform = value + ' ' + inner.attributes.transform;
      } else {
        inner.attributes.transform = value;
      }
    }

    delete item.attributes.transform;
  }
};
