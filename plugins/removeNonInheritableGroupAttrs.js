'use strict';

var inheritableAttrs = require('./_collections').inheritableAttrs,
    presentationAttrs = require('./_collections').attrsGroups.presentation,
    excludedAttrs = ['display', 'opacity'];

/**
 * Remove non-inheritable group's "presentation" attributes.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeNonInheritableGroupAttrs = function(item) {

    if (item.isElem('g')) {

        item.eachAttr(function(attr) {
            if (
                presentationAttrs.indexOf(attr.name) !== -1 &&
                excludedAttrs.indexOf(attr.name) === -1 &&
                inheritableAttrs.indexOf(attr.name) === -1
            ) {
                item.removeAttr(attr.name);
            }
        });

    }

};
