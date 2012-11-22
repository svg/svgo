var flattenOneLevel = require('../lib/svgo/tools').flattenOneLevel,
    elems = require('./_collections').elems;

// flatten and extend all collection references
for (var elem in elems) {
    elem = elems[elem];

    // attrs
    if (elem.attrs) {
        elem.attrs = flattenOneLevel(elem.attrs);
    }

    // contennt
    if (elem.content) {
        elem.content = flattenOneLevel(elem.content);
    }

    // extend defaults with groupDefaults
    if (elem.groupDefaults) {
        elem.defaults = elem.defaults || {};
        for(var groupDefault in elem.groupDefaults) {
            elem.defaults[groupDefault] = elem.groupDefaults[groupDefault];
        }
    }
}

/**
 * Remove unknown elements content and attributes,
 * remove attributes with default values.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeUnknownsAndDefaults = function(item, params) {

    // elems w/o namespace prefix
    if (item.isElem() && !item.prefix) {

        var elem = item.elem;

        // remove unknown element's content
        if (
            params.unknownContent &&
            !item.isEmpty() &&
            elems[elem].content
        ) {
            item.content.forEach(function(content, i) {
                if (
                    content.isElem() &&
                    !content.prefix &&
                    elems[elem].content.indexOf(content.elem) === -1
                ) {
                    item.content.splice(i, 1);
                }
            });
        }

        // remove element's unknown attrs and attrs with default values
        if (elems[elem].attrs) {

            item.eachAttr(function(attr) {

                if (attr.name !== 'xmlns' && !attr.prefix) {
                    if (
                        // unknown attrs
                        (params.unknownAttrs &&
                         elems[elem].attrs.indexOf(attr.name) === -1) ||
                        // attrs with default values
                        (params.defaultAttrs &&
                         elems[elem].defaults &&
                         elems[elem].defaults[attr.name] === attr.value
                         )
                    ) {
                        item.removeAttr(attr.name);
                    }
                }

            });

        }

    }

};
