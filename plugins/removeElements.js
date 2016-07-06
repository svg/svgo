'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'removes arbitrary elements by ID (disabled by default)';

exports.params = {
    ids: []
};

/**
 * Remove SVG elements by ID.
 *
 * @param ids
 *   examples:
 *
 *     > single: remove element with ID of `elementID`
 *     ---
 *     removeElements:
 *       ids: 'elementID'
 *
 *     > list: remove multiple elements by ID
 *     ---
 *     removeElements:
 *       ids:
 *         - 'elementID'
 *         - 'anotherID'
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Eli Dupuis
 */
exports.fn = function(item, params) {
    var elemId;

    // wrap into an array if params is not
    if (!Array.isArray(params.ids)) {
        params.ids = [params.ids];
    }

    if (!item.isElem()) {
        return;
    }

    elemId = item.attr('id');
    if (elemId) {
        return params.ids.indexOf(elemId.value) === -1;
    }
};
