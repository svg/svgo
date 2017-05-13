'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'cleanup .classes or #ids in layer names exported from Adobe Illustrator';

/**
 * Cleanup .classes or #ids in layer names exported from Adobe Illustrator.
 *
 * @param {Object} item current iteration item
 *
 * @author Daniel Bayley
 */
exports.fn = function(item) {

    function update(_prefix, name) {
        item.addAttr({
            name: name,
            value: layer.replace(_prefix,''),
            prefix: '',
            local: name
        });
    }
    if (item.hasAttr('id')) {

        var layer = item.attr('id').value,
            _class = '_x2E_', // .class
            _id = '_x23_'; // #id

        if (layer.startsWith(_class)) {
            update(_class, 'class');
            item.removeAttr('id');
        }
        else if (layer.startsWith(_id)) {
            update(_id, 'id');
        }
    }
};
