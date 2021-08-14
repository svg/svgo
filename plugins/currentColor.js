'use strict';

exports.type = 'perItem'

exports.active = false

exports.description = 'change fill and stroke attributes to "currentColor"'

/**
 * Replace values in fill and stroke attributes to "currentColor"
 * for redefine ability from CSS
 * Replacing works in cases, when attribute value is not equal to
 * "none"
 *
 * @param {Object} item current iteration item
 *
 * @author Konstantin Epishev
 */
exports.fn = function (item) {
    if (!item.isElem()) return
    if (!item.hasAttr('stroke') && !item.hasAttr('fill') && !item.hasAttr('color')) return

    item.eachAttr(function(attr) {
        var name = attr.name
        var value = attr.value
        var isColorAttr = name === 'stroke' || name === 'fill' || name === 'color'

        if (!isColorAttr || value === 'none') return

        item.attr(name).value = 'currentColor'
    })
};
