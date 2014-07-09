'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
	"ids": [ "test_to_delete", "test_child_to_delete" ]
};

/**
 * Removes specific elements (by their ID). This plugin can delete multiple 
 * ids, as specified in the "ids" array
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Michael Porath (@poezn)
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
