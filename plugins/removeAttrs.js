'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
	"attrs": [ "test" ]
};


/**
 * Remove specific attributes
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Michael Porath (@poezn)
 */
exports.fn = function(item, params) {
	var attrsToRemove = params.attrs;

    if (item.elem) {

        item.eachAttr(function(attr) {
            if (attrsToRemove.indexOf(attr.name) >= 0) {
                item.removeAttr(attr.name);
            }
        });

    }

};
