"use strict";

exports.type = 'perItem';

exports.active = true;

/**
 * Removes content of defs without ids and thus useless.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
exports.fn = function(item) {

    if (item.isElem('defs')) {

        if (!item.isEmpty())
            item.content = item.content.reduce(getUsefulItems, []);

        if (item.isEmpty()) return false;

    }

};

function getUsefulItems(usefulItems, item) {

    if (item.hasAttr('id')) {

        usefulItems.push(item);

    } else if (!item.isEmpty()) {

        item.content.reduce(getUsefulItems, usefulItems);

    }

    return usefulItems;
}
