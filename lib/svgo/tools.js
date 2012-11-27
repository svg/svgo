'use strict';

var datauriSVGPrefix = exports.datauriSVGPrefix = 'data:image/svg+xml;base64,';

/**
 * Encode plain SVG data string into Data URI base64 string.
 *
 * @param {String} str input string
 *
 * @return {String} output string
 */
exports.encodeSVGDatauri = function(str) {

    return datauriSVGPrefix + new Buffer(str).toString('base64');

};

/**
 * Decode SVG Data URI base64 string into plain SVG data string.
 *
 * @param {string} str input string
 *
 * @return {String} output string
 */
exports.decodeSVGDatauri = function(str) {

    if (str.substring(0, 26) !== datauriSVGPrefix) return str;

    return new Buffer(str.substring(26), 'base64').toString('utf8');

};

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

exports.intersectArrays = function(a, b) {
    return a.filter(function(n) {
        return b.indexOf(n) > -1;
    });
};

exports.cleanupOutData = function(data, params) {

    var str = '',
        delimiter;

    data.forEach(function(item, i) {

        // space delimiter by default
        delimiter = ' ';

        // no extra space in front of first number
        if (i === 0) {
            delimiter = '';
        }

        // no extra space in front of negative number
        if (params.negativeExtraSpace && item < 0) {
            delimiter = '';
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
