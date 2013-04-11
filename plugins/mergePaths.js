'use strict';

exports.type = 'perItem';

exports.active = true;

/**
 * Merge multiple Paths into one.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    if (item.isElem() && !item.isEmpty()) {

        var prevContentItem;

        item.content = item.content.filter(function(contentItem) {

            // merge only <path d="...z" />
            if (prevContentItem &&
                prevContentItem.isElem('path') &&
                prevContentItem.hasAttr('d') &&
                Object.keys(prevContentItem.attrs).length === 1 &&
                prevContentItem.attr('d').value.charAt(prevContentItem.attr('d').value.length - 1) === 'z' &&
                contentItem.isElem('path') &&
                contentItem.hasAttr('d') &&
                Object.keys(contentItem.attrs).length === 1
            ) {
                prevContentItem.attr('d').value += contentItem.attr('d').value;

                return false;
            }

            prevContentItem = contentItem;

            return true;

        });
    }

};
