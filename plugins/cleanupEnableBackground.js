'use strict';

exports.type = 'full';

exports.active = true;

exports.description =
  'remove or cleanup enable-background attribute when possible';

/**
 * Remove or cleanup enable-background attr which coincides with a width/height box.
 *
 * @see https://www.w3.org/TR/SVG11/filters.html#EnableBackgroundProperty
 *
 * @example
 * <svg width="100" height="50" enable-background="new 0 0 100 50">
 *             ⬇
 * <svg width="100" height="50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (data) {
  var regEnableBackground = /^new\s0\s0\s([-+]?\d*\.?\d+([eE][-+]?\d+)?)\s([-+]?\d*\.?\d+([eE][-+]?\d+)?)$/,
    hasFilter = false,
    elems = ['svg', 'mask', 'pattern'];

  function checkEnableBackground(item) {
    if (
      item.isElem(elems) &&
      item.attributes['enable-background'] != null &&
      item.attributes.width != null &&
      item.attributes.height != null
    ) {
      var match = item.attributes['enable-background'].match(
        regEnableBackground
      );

      if (match) {
        if (
          item.attributes.width === match[1] &&
          item.attributes.height === match[3]
        ) {
          if (item.isElem('svg')) {
            delete item.attributes['enable-background'];
          } else {
            item.attributes['enable-background'] = 'new';
          }
        }
      }
    }
  }

  function checkForFilter(item) {
    if (item.isElem('filter')) {
      hasFilter = true;
    }
  }

  function monkeys(items, fn) {
    items.children.forEach(function (item) {
      fn(item);

      if (item.children) {
        monkeys(item, fn);
      }
    });
    return items;
  }

  var firstStep = monkeys(data, function (item) {
    checkEnableBackground(item);
    if (!hasFilter) {
      checkForFilter(item);
    }
  });

  return hasFilter
    ? firstStep
    : monkeys(firstStep, (item) => {
        if (item.type === 'element') {
          //we don't need 'enable-background' if we have no filters
          delete item.attributes['enable-background'];
        }
      });
};
