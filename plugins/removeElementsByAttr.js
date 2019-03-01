'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'removes arbitrary elements by attribute (disabled by default)';

// exports.params = {
//     id: [],
//     class: [],
// };

function normalizeParams(params) {
    var out = {};

    for (let paramName in params) {
        let value = params[paramName];

        out[paramName] = Array.isArray(value) ? value : [value];
    }

    return out;
}

/**
 * Remove arbitrary SVG elements by attribute.
 *
 * examples:
 *   removeElementsByAttr:
 *    // Remove element if element.class === ...
 *    class: 'class-num-1'
 *    // Remove element if ANY of classes === ...
 *    class: [ 'class-num-1', 'class-num-2' ]
 *    // Remove element if class === 'extra-class' or class contains 'num'
 *    class: [ 'extra-class', (name) => name.test(/num/i) ]
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Eli Dupuis (@elidupuis)
 */
exports.fn = function(item, params) {
    // abort if current item is no an element
    if (!item.isElem()) {
        return;
    }

    var $params = normalizeParams(params);
    /**
     * If function returns true -> element will be removed
     */
    var attrFunctions = {
        /**
         * backward compatibility for class (use regex instead)
         * values[]: { class: [ 'class-1', 'class-2' ] }
         */
        class(values) {
            let elemClass = item.attr('class');

            if (elemClass) {
                var hasClassRegex = new RegExp(values.join('|'));
                return hasClassRegex.test(elemClass.value);
            }
        },
    };

    const defaultFunction = (attr, values) => {
        let $attr = item.attr(attr);

        if (!$attr) {
            return;
        }

        let attrValue = $attr.value;
        let matched = false;

        // by value types
        values.forEach((value) => {
            /**
             * {
             *   removeElementsByAttr: { id: [ ..., /l\-[0-9]+/i, ... ] }
             * }
             */
            if (value instanceof RegExp && value.test(attrValue)) {
                matched = true;
            }

            /**
             * {
             *   removeElementsByAttr: { id: [ ..., (id) => id === 'l-1', ... ] }
             * }
             */
            else if (typeof value === 'function' && value(attrValue)) {
                matched = true;
            }

            /**
             * {
             *   removeElementsByAttr: { id: [ ..., [String, Number, ...], ... ] }
             * }
             */
            else if (attrValue === value) {
                matched = true;
            }
        });

        // By specified functions
        if (!matched && attrFunctions[attr] && attrFunctions[attr](values)) {
            matched = true;
        }

        return matched;
    };

    for (let paramName in $params) {
        let value = $params[paramName];
        let fn = attrFunctions[paramName];

        // Call pre-defined value processor or default
        let isMatched = defaultFunction(paramName, value);

        if (isMatched) {
            return false;
        }
    }
};
