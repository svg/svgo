'use strict';

var pathElems = require('./_collections.js').pathElems;

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
exports.moveGroupAttrsToElems = function(item) {

    // move group transform attr to content's pathElems
    if (
        item.isElem('g') &&
        item.hasAttr('transform') &&
        !item.isEmpty() &&
        item.content.every(function(inner) {
            return inner.isElem(pathElems);
        })
    ) {
        item.content.forEach(function(inner) {
            if (inner.hasAttr('transform')) {
                inner.attr('transform').value = item.attr('transform').value + ' ' + inner.attr('transform').value;
            } else {
                inner.addAttr(item.attr('transform'));
            }
        });

        item.removeAttr('transform');
    }

};
