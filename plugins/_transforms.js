'use strict';

var regTransformTypes = /matrix|translate|scale|rotate|skewX|skewY/,
    regTransformSplit = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/,
    regTransformDataSplit = /[\s,]+/;

/**
 * Convert transform string to JS representation.
 *
 * @param {String} transformString input string
 * @param {Object} params plugin params
 * @return {Array} output array
 */
exports.transform2js = function(transformString) {

        // JS representation of the transform data
    var transforms = [],
        // current transform context
        current;

    // split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate', '-45', '']
    transformString.split(regTransformSplit).forEach(function(item) {

        if (item) {
            // if item is a translate function
            if (regTransformTypes.test(item)) {
                // then collect it and change current context
                transforms.push(current = {
                    name: item
                });
            // else if item is data
            } else {
                // then split it into [10, 50] and collect as context.data
                current.data = item.split(regTransformDataSplit).map(function(i) {
                    return +i;
                });
            }
        }

    });

    return transforms;

};

/**
 * Multiply transforms into one.
 *
 * @param {Array} input transforms array
 * @return {Array} output matrix array
 */
exports.transformsMultiply = function(transforms) {

    // convert transforms objects to the matrices
    transforms = transforms.map(function(transform) {
        return transform.name === 'martix' ?
            transform :
            transformToMatrix(transform);
    });

    // multiply all matrices into one
    transforms = {
        name: 'matrix',
        data: transforms.reduce(function(a, b) {
            return multiplyTransformMatrices(a, b);
        })
    };

    return transforms;

};

/**
 * Do math like a schoolgirl.
 *
 * @type {Object}
 */
var mth = exports.mth = {

    rad: function(deg) {
        return deg * Math.PI / 180;
    },

    deg: function(rad) {
        return rad * 180 / Math.PI;
    },

    cos: function(deg) {
        return Math.cos(this.rad(deg));
    },

    acos: function(val, floatPrecision) {
        return +(this.deg(Math.acos(val)).toFixed(floatPrecision));
    },

    sin: function(deg) {
        return Math.sin(this.rad(deg));
    },

    asin: function(val, floatPrecision) {
        return +(this.deg(Math.asin(val)).toFixed(floatPrecision));
    },

    tan: function(deg) {
        return Math.tan(this.rad(deg));
    },

    atan: function(val, floatPrecision) {
        return +(this.deg(Math.atan(val)).toFixed(floatPrecision));
    }

};

/**
 * Convert matrix data to the transform alias.
 *
 * @param {Object} data matrix transform object
 * @return {Object} transform object
 */
exports.matrixToTransform = function(transform, params) {

    var data = transform.data;

    // [1, 0, 0, 1, tx, ty] → translate(tx, ty)
    if (
        data[0] === 1 &&
        data[1] === 0 &&
        data[2] === 0 &&
        data[3] === 1
    ) {
        transform.name  = 'translate';
        transform.data = [data[4], data[5]];

    // [sx, 0, 0, sy, 0, 0] → scale(sx, sy)
    } else if (
        data[1] === 0 &&
        data[2] === 0 &&
        data[4] === 0 &&
        data[5] === 0
    ) {
        transform.name = 'scale';
        transform.data = [data[0], data[3]];

    // [cos(a), sin(a), -sin(a), cos(a), 0 0] → rotate(a)
    } else if (
        data[0] === data[3] &&
        data[1] === -data[2] &&
        data[4] === 0 &&
        data[5] === 0
    ) {
        var a1 = mth.acos(data[0], params.floatPrecision),
            a2 = mth.asin(data[1], params.floatPrecision);

        a1 = a2 < 0 ? -a1 : a1;

        if (Math.round(a1) === Math.round(a2)) {
            transform.name = 'rotate';
            transform.data = [a1];
        }

    // [1, 0, tan(a), 1, 0, 0] → skewX(a)
    } else if (
       data[0] === 1 &&
       data[1] === 0 &&
       data[3] === 1 &&
       data[4] === 0 &&
       data[5] === 0
    ) {
        transform.name = 'skewX';
        transform.data = [mth.atan(data[2], params.floatPrecision)];

    // [1, tan(a), 0, 1, 0, 0] → skewY(a)
    } else if (
       data[0] === 1 &&
       data[2] === 0 &&
       data[3] === 1 &&
       data[4] === 0 &&
       data[5] === 0
    ) {
        transform.name = 'skewY';
        transform.data = [mth.atan(data[1], params.floatPrecision)];
    }

    return transform;

};

/**
 * Convert transform to the matrix data.
 *
 * @param {Object} transform transform object
 * @return {Array} matrix data
 */
var transformToMatrix = exports.transformToMatrix = function(transform) {

    if (transform.name === 'matrix') return transform.data;

    var matrix;

    switch(transform.name) {
        case 'translate':
            // [1, 0, 0, 1, tx, ty]
            matrix = [1, 0, 0, 1, transform.data[0], transform.data[1] || 0];
            break;
        case 'scale':
            // [sx, 0, 0, sy, 0, 0]
            matrix = [transform.data[0], 0, 0, transform.data[1] || transform.data[0], 0, 0];
            break;
        case 'rotate':
            // [cos(a), sin(a), -sin(a), cos(a), 0, 0]
            var cos = mth.cos(transform.data[0]),
                sin = mth.sin(transform.data[0]);

            matrix = [cos, sin, -sin, cos, 0, 0];
            break;
        case 'skewX':
            // [1, 0, tan(a), 1, 0, 0]
            matrix = [1, 0, mth.tan(transform.data[0]), 1, 0, 0];
            break;
        case 'skewY':
            // [1, tan(a), 0, 1, 0, 0]
            matrix = [1, mth.tan(transform.data[0]), 0, 1, 0, 0];
            break;
    }

    return matrix;

};

/**
 * Multiply transformation matrices.
 *
 * @param {Array} a matrix A data
 * @param {Array} b matrix B data
 * @return {Array} result
 */
function multiplyTransformMatrices(a, b) {

    return [
        +(a[0] * b[0] + a[2] * b[1]).toFixed(3),
        +(a[1] * b[0] + a[3] * b[1]).toFixed(3),
        +(a[0] * b[2] + a[2] * b[3]).toFixed(3),
        +(a[1] * b[2] + a[3] * b[3]).toFixed(3),
        +(a[0] * b[4] + a[2] * b[5] + a[4]).toFixed(3),
        +(a[1] * b[4] + a[3] * b[5] + a[5]).toFixed(3)
    ];

}
