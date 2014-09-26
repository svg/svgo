'use strict';

exports.type = 'perItem';

exports.active = false;

/**
 * Remove <desc>.
 * Disabled by default cause it may be used for accessibility.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Daniel Wabyick
 */
exports.fn = function(item) {

    return !item.isElem('desc');

};
