/**
 * Adopted from jquery's extend method. Under the terms of MIT License.
 *
 * http://code.jquery.com/jquery-1.4.2.js
 *
 * Modified by mscdex to use Array.isArray instead of the custom isArray method
 */
 var extend = exports.extend = function() {
    // copy reference to target object
    var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && !typeof target === 'function')
        target = {};

    var isPlainObject = function(obj) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
            return false;

        var has_own_constructor = hasOwnProperty.call(obj, 'constructor');
        var has_is_property_of_method = hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf');
        // Not own constructor property must be Object
        if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
            return false;

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key, last_key;
        for (key in obj)
            last_key = key;

        return typeof last_key === 'undefined' || hasOwnProperty.call(obj, last_key);
    };


    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) !== null) {
            // Extend the base object
            for (name in options) {
                if (!hasOwnProperty.call(options, name))
                    continue;
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target === copy)
                    continue;

                // Recurse if we're merging object literal values or arrays
                if (deep && copy && (isPlainObject(copy) || Array.isArray(copy))) {
                    var clone = src && (isPlainObject(src) || Array.isArray(src)) ? src : Array.isArray(copy) ? [] : {};

                    // Never move original objects, clone them
                    target[name] = extend(deep, clone, copy);

                // Don't bring in undefined values
                } else if (typeof copy !== 'undefined')
                    target[name] = copy;
            }
        }
    }

    // Return the modified object
    return target;
};

exports.flatten = function(array) {
    var result = [],
        that = arguments.callee;

    array.forEach(function(item) {
        Array.prototype.push.apply(
            result,
            Array.isArray(item) ? that(item) : [item]
        );
    });

    return result;
};

exports.intersectAttrs = function(a, b) {
    var c = {};

    Object.getOwnPropertyNames(a).forEach(function(n) {
        if (
            b.hasOwnProperty(n) &&
            a[n].name === b[n].name &&
            a[n].value === b[n].value &&
            a[n].prefix === b[n].prefix &&
            a[n].local === b[n].local
        ) {
            c[n] = a[n];
        }
    });

    return c;
};

exports.intersectArrays = function(a, b) {
    return a.filter(function(n) {
        return b.indexOf(n) > -1;
    });
};
