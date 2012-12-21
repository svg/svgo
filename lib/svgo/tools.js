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
        delimiter,
        prev;

    data.forEach(function(item, i) {

        // space delimiter by default
        delimiter = ' ';

        // no extra space in front of first number
        if (i === 0) {
            delimiter = '';
        }

        // no extra space in front of negative number or
        // in front of a floating number if a previous number is floating too
        if (
            params.negativeExtraSpace &&
            (item < 0 ||
             (item > 0 && item < 1 && prev % 1 !== 0)
            )
        ) {
            delimiter = '';
        }

        // save prev item value
        prev = item;

        // remove floating-point numbers leading zeros
        // 0.5 → .5
        // -0.5 → -.5
        if (params.leadingZero) {
            item = removeLeadingZero(item);
        }

        str += delimiter + item;

    });

    return str;

};

/**
 * Remove floating-point numbers leading zero.
 *
 * @example
 * 0.5 → .5
 *
 * @example
 * -0.5 → -.5
 *
 * @param {Float} num input number
 *
 * @return {String} output number as string
 */
var removeLeadingZero = exports.removeLeadingZero = function(num) {

    if (num > 0 && num < 1) {
        num = ('' + num).slice(1);
    } else if (num < 0 && num > -1) {
        num = '-' + ('' + num).slice(2);
    }

    return num;

};
