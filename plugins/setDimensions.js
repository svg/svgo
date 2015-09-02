'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'adds or updates specified width and height';

exports.params = {
    width: 50,
    height: 50
};

/**
 * Remove width/height attributes when a viewBox attribute is present.
 *
 * @example
 * <svg>
 *   ↓
 * <svg width="50" height="50">
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Ally Palanzi
 */
exports.fn = function(item, params) {

    if (item.isElem('svg')) {
        item.addAttr({
            name: 'width',
            local: 'width',
            prefix: '',
            value: params.width
        });
        item.addAttr({
            name: 'height',
            local: 'height',
            prefix: '',
            value: params.height
        });
    }
};
