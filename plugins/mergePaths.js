'use strict';

exports.type = 'perItem';

exports.active = true;

var path2js = require('./_path.js').path2js,
    relative2absolute = require('./_path.js').relative2absolute;

/**
 * Merge multiple Paths into one.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    if (!item.isElem() || item.isEmpty()) return;

    var prevContentItem,
        prevContentItemKeys = null;

    item.content = item.content.filter(function(contentItem) {

        if (prevContentItem &&
            prevContentItem.isElem('path') &&
            prevContentItem.hasAttr('d') &&
            contentItem.isElem('path') &&
            contentItem.hasAttr('d')
        ) {

            if (prevContentItemKeys == null) {
                prevContentItemKeys = Object.keys(prevContentItem.attrs);
            }

            var contentItemAttrs = Object.keys(contentItem.attrs),
                equalData = prevContentItemKeys.length == contentItemAttrs.length &&
                    contentItemAttrs.every(function(key) {
                        return key == 'd' ||
                            prevContentItem.hasAttr(key) &&
                            prevContentItem.attr(key).value == contentItem.attr(key).value;
                    });

            if (equalData) {
                var prevPathJS = prevContentItem.pathJS;
                if (prevContentItem.pathJS) {
                    prevPathJS.push.apply(prevPathJS, contentItem.pathJS);
                }

                prevContentItem.attr('d').value += contentItem.attr('d').value.replace(/m/i, 'M');
                return false;
            }
        }

        prevContentItem = contentItem;
        prevContentItemKeys = null;
        return true;

    });

};
