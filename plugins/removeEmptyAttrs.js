/**
 * Remove attributes with empty values.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeEmptyAttrs = function(item, params) {

    if (item.isElem() && item.hasAttr()) {

        item.eachAttr(function(attr) {
            if (attr.value === '') {
                item.removeAttr(attr.name);
            }
        });

    }

};
