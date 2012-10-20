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

exports.cleanupOutData = function(data, params) {
    var str = '';

    data.forEach(function(item, i) {
        // there is no delimiter by default
        var delimiter = '';

        // but if item >= 0 and item index > 0
        // then must be a delimiter (space) between items
        if (item >= 0 && i > 0) {
            delimiter = ' ';
        }

        // remove floating-point numbers leading zeros
        // 0.5 → .5
        // -0.5 → -.5
        if (params.leadingZero) {
            if (item > 0 && item < 1) {
                item = ('' + item).slice(1);
            }

            if (item < 0 && item > -1) {
                item = '-' + ('' + item).slice(2);
            }
        }

        str += delimiter + item;

    });

    return str;
};
