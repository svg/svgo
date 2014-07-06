'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
    prefix: "pre-"
};

var regReferencesUrl = /^url\(#(.+?)\)$/;

/**
 * Adds prefix to every ID (For example, so that multiple SVGs that are embedded 
 * in an HTML page don't have matching IDs)
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Michael Porath (@poezn)
 */
exports.fn = function(item, params) {
	var prefix = params.prefix;

    var match;

    if (item.isElem()) {

        item.eachAttr(function(attr) {

            if (attr.name === 'id') {
            	attr.value = [prefix, attr.value].join("");
            }

            // also change references to IDs
            else if (attr.name === 'xlink:href') {
                match = attr.value.match(regReferencesUrl);
                if (match) {
                	attr.value = ["url(#", prefix, match[1], ")"].join("");
                }
            }
        });

    }

};