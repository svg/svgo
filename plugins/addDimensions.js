'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'adds width and height in presence of viewBox';

var regSeparator = /\s+,?\s*|,\s*/;

/**
 * Add width/height attributes when a viewBox attribute is present.
 *
 * @example
 * <svg viewBox="0 0 100 50">
 *   ↓
 * <svg width="100" height="50" viewBox="0 0 100 50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if true, with and height will be added
 *
 * @author Tom Longson
 */
exports.fn = function(item) {

    if (
        item.isElem('svg') &&
        item.hasAttr('viewBox')
    ) {
        var dimensions = getDimensions(item.attrs.viewBox);
        
        if (dimensions != null) {
            item.addAttr({
                    name: "width",
                    prefix: '',
                    local: "width",
                    value: dimensions[0]
                });
            item.addAttr({
                    name: "height",
                    prefix: '',
                    local: "height",
                    value: dimensions[1]
                });
        }
    }

    function getDimensions($prop){
        var lists = $prop.value,
            listsArr = lists.split(regSeparator),
            width = listsArr[2] || null,
            height = listsArr[3] || null;
        
        if (width && height) {
            return [width, height];
        } else {
            return null;
        }
    }
    return item;
};
