exports.extend = require('node.extend');

exports.flattenOneLevel = function(array) {
    var result = [];

    array.forEach(function(item) {
        Array.prototype.push.apply(
            result,
            Array.isArray(item) ? item : [item]
        );
    });

    return result;
};

exports.intersectAttrs = function(a, b) {
    var c = {};

    for (var n in a) {
        if (
            b.hasOwnProperty(n) &&
            a[n].name === b[n].name &&
            a[n].value === b[n].value &&
            a[n].prefix === b[n].prefix &&
            a[n].local === b[n].local
        ) {
            c[n] = a[n];
        }
    }

    if (!Object.keys(c).length) return false;

    return c;
};

exports.intersectArrays = function(a, b) {
    return a.filter(function(n) {
        return b.indexOf(n) > -1;
    });
};
