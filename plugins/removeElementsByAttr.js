'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'removes arbitrary elements by ID (disabled by default)';

exports.params = {
    id: [],
    class: []
};

/**
 * Remove SVG elements by ID.
 *
 * @param id
 *   examples:
 *
 *     > single: remove element with ID of `elementID`
 *     ---
 *     removeElementsByAttr:
 *       id: 'elementID'
 *
 *     > list: remove multiple elements by ID
 *     ---
 *     removeElementsByAttr:
 *       id:
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
    if (!Array.isArray(params.id)) {
        params.id = [params.id];
    }

    if (!item.isElem()) {
        return;
    }

    elemId = item.attr('id');
    if (elemId) {
        return params.id.indexOf(elemId.value) === -1;
    }
};
