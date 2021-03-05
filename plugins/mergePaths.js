'use strict';

const { computeStyle } = require('../lib/style.js');
const { path2js, js2path, intersects } = require('./_path.js');

exports.type = 'perItem';

exports.active = true;

exports.description = 'merges multiple paths in one if possible';

exports.params = {
  collapseRepeated: true,
  force: false,
  leadingZero: true,
  negativeExtraSpace: true,
  noSpaceAfterFlags: false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
};

/**
 * Merge multiple Paths into one.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich, Lev Solntsev
 */
exports.fn = function (item, params) {
  if (!item.isElem() || item.isEmpty()) return;

  var prevContentItem = null,
    prevContentItemKeys = null;

  item.content = item.content.filter(function (contentItem) {
    if (
      prevContentItem &&
      prevContentItem.isElem('path') &&
      prevContentItem.isEmpty() &&
      prevContentItem.hasAttr('d') &&
      contentItem.isElem('path') &&
      contentItem.isEmpty() &&
      contentItem.hasAttr('d')
    ) {
      const computedStyle = computeStyle(contentItem);
      // keep path to not break markers
      if (
        computedStyle['marker-start'] ||
        computedStyle['marker-mid'] ||
        computedStyle['marker-end']
      ) {
        return true;
      }
      if (!prevContentItemKeys) {
        prevContentItemKeys = Object.keys(prevContentItem.attrs);
      }

      var contentItemAttrs = Object.keys(contentItem.attrs),
        equalData =
          prevContentItemKeys.length == contentItemAttrs.length &&
          contentItemAttrs.every(function (key) {
            return (
              key == 'd' ||
              (prevContentItem.hasAttr(key) &&
                prevContentItem.attr(key).value == contentItem.attr(key).value)
            );
          }),
        prevPathJS = path2js(prevContentItem),
        curPathJS = path2js(contentItem);

      if (equalData && (params.force || !intersects(prevPathJS, curPathJS))) {
        js2path(prevContentItem, prevPathJS.concat(curPathJS), params);
        return false;
      }
    }

    prevContentItem = contentItem;
    prevContentItemKeys = null;
    return true;
  });
};
