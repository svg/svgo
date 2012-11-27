'use strict';

var cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    regTransformTypes = /matrix|translate|scale|rotate|skewX|skewY/,
    regTransformSplit = /(matrix|translate|scale|rotate|skewX|skewY)\s*\((.+?)\)[\s,]*/,
    regTransformDataSplit = /[\s,]+/;

/**
 * Convert matrices to the short aliases,
 * convert long translate, scale or rotate transform notations to the shorts ones,
 * convert transforms to the matrices and multiply them all into one,
 * remove useless transforms.
 *
 * @see http://www.w3.org/TR/SVG/coords.html#TransformMatrixDefined
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.convertTransform = function(item, params) {

    if (item.elem) {

        // transform
        if (item.hasAttr('transform')) {
            convertTransform(item, 'transform', params);
        }

        // gradientTransform
        if (item.hasAttr('gradientTransform')) {
            convertTransform(item, 'gradientTransform', params);
        }

        // patternTransform
        if (item.hasAttr('patternTransform')) {
            convertTransform(item, 'patternTransform', params);
        }

    }

};

/**
 * Main function.
 *
 * @param {Object} item input item
 * @param {String} attrName attribute name
 * @param {Object} params plugin params
 */
function convertTransform(item, attrName, params) {

    var data = transform2js(item.attr(attrName).value);

    if (params.convertToShorts) {
        data = convertToShorts(data, params);
    }

    if (params.removeUseless) {
        data = removeUseless(data);
    }

    if (params.collapseIntoOne) {
        data = collapseIntoOne(data, params);
    }

    item.attr(attrName).value = js2transform(data, params);

}

/**
 * Convert transform string to JS representation.
 *
 * @param {String} transformString input string
 * @param {Object} params plugin params
 *
 * @return {Array} output array
 */
function transform2js(transformString) {

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

}

/**
 * Convert transforms to the shorthand alternatives.
 *
 * @param {Array} transforms input array
 * @param {Object} params plugin params
 *
 * @return {Array} output array
 */
function convertToShorts(transforms, params) {

    for(var i = 0; i < transforms.length; i++) {

        var transform = transforms[i];

        // convert matrix to the short aliases
        if (
            params.matrixToTransform &&
            transforms.length < 3 &&
            transform.name === 'matrix'
        ) {
            transforms[i] = matrixToTransform(transform);
        }

        // fixed-point numbers
        // 12.754997 → 12.755
        if (params.floatPrecision) {
            transform.data = transform.data.map(function(num) {
                return +num.toFixed(params.floatPrecision);
            });
        }

        // convert long translate or scale transform notations to the shorts ones
        if (
            params.shortTranslateScale &&
            (transform.name === 'translate' ||
             transform.name === 'scale')
        ) {
            transform.data = longTranslateScaleToShort(transform.data);
        }

        // convert long rotate transform notation to the short one
        // translate(cx cy) rotate(a) translate(-cx -cy) → rotate(a cx cy)
        if (
            params.shortRotate &&
            transforms[i - 2] &&
            transforms[i - 2].name === 'translate' &&
            transforms[i - 1].name === 'rotate' &&
            transforms[i].name === 'translate' &&
            transforms[i - 2].data[0] === -transforms[i].data[0] &&
            transforms[i - 2].data[1] === -transforms[i].data[1]
        ) {
            transforms.splice(i - 2, 3, {
                name: 'rotate',
                data: [
                    transforms[i - 1].data[0],
                    transforms[i - 2].data[0],
                    transforms[i - 2].data[1]
                ]
            });

            // splice compensation
            i -= 2;

            transform = transforms[i];
        }

    }

    return transforms;

}

/**
 * Remove useless transforms.
 *
 * @param {Array} transforms input array
 *
 * @return {Array} output array
 */
function removeUseless(transforms) {

    return transforms.filter(function(transform) {

        // translate(0), rotate(0), skewX(0), skewY(0)
        if (
            ['translate', 'rotate', 'skewX', 'skewY'].indexOf(transform.name) > -1 &&
            transform.data.length === 1 &&
            transform.data[0] === 0
        ) {
            return false;
        // scale(1)
        } else if (
            transform.name === 'scale' &&
            transform.data.length === 1 &&
            transform.data[0] === 1
        ) {
            return false;
        }

        return true;

    });

}

/**
 * Collapse multiple transforms into one.
 *
 * @param {Array} transforms input array
 * @param {Object} params plugin params
 *
 * @return {Array} output array
 */
function collapseIntoOne(transforms, params) {

    if (
        (transforms.length >= 3 ||
        transforms.some(function(i) { return i.name === 'matrix'; }))
    ) {

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
                return multiplyMatrices(a, b);
            })
        };

        // and try to get a jackpot
        if (params.matrixToTransform) {
            transforms = matrixToTransform(transforms);
        }

        transforms = [transforms];

    }

    return transforms;

}

/**
 * Convert transforms JS representation to string.
 *
 * @param {Array} transformJS JS representation array
 * @param {Object} params plugin params
 *
 * @return {String} output string
 */
function js2transform(transformJS, params) {

    var transformString = '';

    // collect output value string
    transformJS.forEach(function(transform) {

        transformString += (transformString ? ' ' : '') + transform.name + '(' + cleanupOutData(transform.data, params) + ')';

    });

    return transformString;

}

/**
 * Do math like a schoolgirl.
 *
 * @type {Object}
 */
var mth = {

    rad: function(deg) {
        return deg * Math.PI / 180;
    },

    deg: function(rad) {
        return rad * 180 / Math.PI;
    },

    cos: function(deg) {
        return Math.cos(this.rad(deg));
    },

    acos: function(val) {
        return Math.round(this.deg(Math.acos(val)));
    },

    sin: function(deg) {
        return Math.sin(this.rad(deg));
    },

    asin: function(val) {
        return Math.round(this.deg(Math.asin(val)));
    },

    tan: function(deg) {
        return Math.tan(this.rad(deg));
    },

    atan: function(val) {
        return Math.round(this.deg(Math.atan(val)));
    }

};

/**
 * Convert transform to the matrix data.
 *
 * @param {Object} transform transform object
 *
 * @return {Array} matrix data
 */
function transformToMatrix(transform) {

    if (transform.name === 'matrix') return transform.data;

    var matrix;

    switch(transform.name) {
        case 'translate':
            // [1, 0, 0, 1, tx, ty]
            matrix = [1, 0, 0, 1, transform.data[0], transform.data[1] || transform.data[0]];
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

}

/**
 * Convert matrix data to the transform alias.
 *
 * @param {Object} data matrix transform object
 *
 * @return {Object} transform object
 */
function matrixToTransform(transform) {

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
        var a1 = mth.acos(data[0]),
            a2 = mth.asin(data[1]);

        a1 = a2 < 0 ? -a1 : a1;

        if (a1 === a2) {
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
        transform.data = [mth.atan(data[2])];

    // [1, tan(a), 0, 1, 0, 0] → skewY(a)
    } else if (
       data[0] === 1 &&
       data[2] === 0 &&
       data[3] === 1 &&
       data[4] === 0 &&
       data[5] === 0
    ) {
        transform.name = 'skewY';
        transform.data = [mth.atan(data[1])];
    }

    return transform;

}

/**
 * Convert long translate or scale transforms to the shorts ones.
 *
 * @param {Array} data transform data
 *
 * @return {Array} output data
 */
function longTranslateScaleToShort(data) {

    // translate(50 50) → translate(50)
    // scale(2 2) → scale(2)
    if (data[1] !== undefined && data[1] === data[0]) {
        data = [data[0]];
    }

    return data;

}

/**
 * Multiply matrices.
 *
 * @param {Array} a matrix A data
 * @param {Array} b matrix B data
 *
 * @return {Array} result
 */
function multiplyMatrices(a, b) {

    return [
        +(a[0] * b[0] + a[2] * b[1]).toFixed(3),
        +(a[1] * b[0] + a[3] * b[1]).toFixed(3),
        +(a[0] * b[2] + a[2] * b[3]).toFixed(3),
        +(a[1] * b[2] + a[3] * b[3]).toFixed(3),
        +(a[0] * b[4] + a[2] * b[5]).toFixed(3),
        +(a[1] * b[4] + a[3] * b[5] + a[5]).toFixed(3)
    ];

}
