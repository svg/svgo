'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
	"ids": [ "test_to_delete", "test_child_to_delete" ]
};

/**
 * Cleanup attributes values from newlines, trailing and repeating spaces.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Kir Belevich
 */
exports.fn = function(item, params) {
	var idsToDelete = params.ids;

	var remove = false;

    if (item.isElem()) {

        item.eachAttr(function(attr) {

            if (attr.name === 'id' && idsToDelete.indexOf(attr.value) >= 0) {
            	remove = true;
            	return;
            }

        });

        if (remove) {
        	return false;
        }

    }

};
