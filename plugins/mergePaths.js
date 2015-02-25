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

        var prevContentItem,
            prevContentItemKeys = null;

        item.content = item.content.filter(function(contentItem) {

            // merge only <path d="...z" />
            if (prevContentItem &&
                prevContentItem.isElem('path') &&
                prevContentItem.hasAttr('d') &&
                contentItem.isElem('path') &&
                contentItem.hasAttr('d')
            ) {

                if (prevContentItemKeys == null) {
                    prevContentItemKeys = Object.keys(prevContentItem.attrs);
                }

                var contentItemKeys = Object.keys(contentItem.attrs);
                if (contentItemKeys.length > 1 || prevContentItemKeys.length > 1) {
                    if (contentItemKeys.length != prevContentItemKeys.length) {
                        prevContentItem = contentItem;
                        prevContentItemKeys = null;
                        return true;
                    }

                    var equalData = contentItemKeys.every(function(key) {
                            return key == 'd' ||
                                prevContentItem.hasAttr(key) &&
                                prevContentItem.attr(key).value == contentItem.attr(key).value;
                        });
                    if (!equalData) {
                        prevContentItem = contentItem;
                        prevContentItemKeys = null;
                        return true;
                    }
                }

                prevContentItem.attr('d').value += contentItem.attr('d').value.replace(/m/i, 'M');

                var pathJS = prevContentItem.pathJS;
                if (pathJS) {
                    pathJS.push.apply(pathJS, contentItem.pathJS);
                }
                return false;
            }

            prevContentItem = contentItem;
            prevContentItemKeys = null;
            return true;

        });
    }

};
