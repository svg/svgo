/* jshint quotmark: false */
'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'converts class to style';

var rClass = /^(.+){(.+)}$/;

/**
 * Convert class in inline style.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Dmitry Panchenko
 */

var classes = {};

exports.fn = function(item) {
    if (item.elem && item.elem === 'style') {
        classes = {};
        var style = item.content.length && item.content[0].text || '';
        style.split('.').forEach(function (item) {
            var result = rClass.exec(item);
            if (result !== null) {
                classes[result[1]] = result[2];
            }
        });
        return false;
    }
    if (item.elem && item.hasAttr('class')) {
        var classValue = item.attr('class').value;
        if (classes[classValue]) {
            if (item.hasAttr('style')) {
                item.attr('style').value = item.attr('style').value + ';' + classes[classValue];
            } else {
                item.addAttr({
                    name: 'style',
                    value: classes[classValue],
                    local: 'style',
                    prefix: ''
                });
            }
        }
        item.removeAttr('class');
    }
};

