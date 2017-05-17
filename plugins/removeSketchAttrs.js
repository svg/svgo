'use strict';

exports.type = 'perItem';

exports.active = false;

/**
 * Removes xmlns:sketch from svg element and all Sketch attributes
 * http://www.bohemiancoding.com/sketch
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Giovanni Collazo
 */

var sketchAttrRegex = /(sketch:[a-z]+)/;

exports.fn = function(item) {

    // Removes the xmlns:sketch from <svg> element
    if (item.attrs && item.attrs['xmlns:sketch']) {
      item.removeAttr('xmlns:sketch');
    }

    // Removes sketch:type="MSShapeGroup" attrs
    for (var attr in item.attrs) {
      var match = attr.match(sketchAttrRegex);

      if (match) {
        item.removeAttr(match[0]);
      }
    }

};
