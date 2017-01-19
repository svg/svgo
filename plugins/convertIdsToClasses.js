'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'convert ids to classes (disabled by default)';

/**
 * Convert ids to classes
 * Disabled by default.
 *
 * @param {Object} item current iteration item
 *
 * @author Michael Baldwin
 */
exports.fn = function(item) {

    if (item.hasAttr('id')) {
        var id = item.attr('id');

        // add class attribute using id value
        item.addAttr({
            name: 'class',
            value: id.value,
            prefix: '',
            local: 'class',
        });

        // remove id attribute
        item.removeAttr('id');
    }

};
