'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
    convertToShorts: true,
    // degPrecision: 3, // transformPrecision (or matrix precision) - 2 by default
    floatPrecision: 3,
    transformPrecision: 5,
    matrixToTransform: true,
    shortTranslate: true,
    shortScale: true,
    shortRotate: true,
    removeUseless: true,
    collapseIntoOne: true,
    leadingZero: true,
    negativeExtraSpace: false
};

var cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    transform2js = require('./_transforms.js').transform2js,
    transformsMultiply = require('./_transforms.js').transformsMultiply,
    matrixToTransform = require('./_transforms.js').matrixToTransform;

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
exports.fn = function(item, params) {

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
    var data = transform2js(item.attr(attrName).value),
        matrixData = data.reduce(function(a, b) { return b.name == 'matrix' ? a.concat(b.data.slice(0, 4)) : a }, []),
        degPrecision = params.floatPrecision,
        significantDigits = params.transformPrecision;

    // Limit transform precision with matrix one. Calculating with larger precision doesn't add any value.
    if (matrixData.length) {
        params.transformPrecision = Math.min(params.transformPrecision,
            Math.max.apply(Math, matrixData.map(function(n) {
                return (n = String(n)).slice(n.indexOf('.')).length - 1; // Number of digits after point. 0.125 → 3
            })) || params.transformPrecision);
        significantDigits = Math.max.apply(Math, matrixData.map(function(n) {
            return String(n).replace(/\D+/g, '').length; // Number of digits in number. 123.45 → 5
        }));
    }
    // No sense in angle precision more then number of significant digits in matrix.
    if (!('degPrecision' in params)) {
        params.degPrecision = Math.max(0, Math.min(params.floatPrecision, significantDigits - 2));
    }

    if (params.collapseIntoOne && data.length > 1) {
        data = [transformsMultiply(data)];
    }

    if (params.convertToShorts) {
        data = convertToShorts(data, params);
    } else {
        data.forEach(function(transform) {
            transform = roundTransform(transform, params);
        });
    }

    if (params.removeUseless) {
        data = removeUseless(data);
    }

    item.attr(attrName).value = js2transform(data, params);
}

/**
 * Convert transforms to the shorthand alternatives.
 *
 * @param {Array} transforms input array
 * @param {Object} params plugin params
 * @return {Array} output array
 */
function convertToShorts(transforms, params) {

    for(var i = 0; i < transforms.length; i++) {

        var transform = transforms[i];

        // convert matrix to the short aliases
        if (
            params.matrixToTransform &&
            transform.name === 'matrix'
        ) {
            var decomposed = matrixToTransform(transform, params);
            if (decomposed != transform &&
                js2transform(decomposed, params).length <= js2transform([transform], params).length) {

                transforms.splice.apply(transforms, [i, 1].concat(decomposed));
            }
            transform = transforms[i];
        }

        transform = roundTransform(transform, params);

        // fixed-point numbers
        // 12.754997 → 12.755
        if (params.transformPrecision !== false) {
            transform.data = transform.data.map(function(num) {
                return +num.toFixed(params.transformPrecision);
            });
        }

        // convert long translate transform notation to the shorts one
        // translate(10 0) → translate(10)
        if (
            params.shortTranslate &&
            transform.name === 'translate' &&
            transform.data.length === 2 &&
            !transform.data[1]
        ) {
            transform.data.pop();
        }

        // convert long scale transform notation to the shorts one
        // scale(2 2) → scale(2)
        if (
            params.shortScale &&
            transform.name === 'scale' &&
            transform.data.length === 2 &&
            transform.data[0] === transform.data[1]
        ) {
            transform.data.pop();
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
 * @return {Array} output array
 */
function removeUseless(transforms) {

    return transforms.filter(function(transform) {

        // translate(0), rotate(0[, cx, cy]), skewX(0), skewY(0)
        if (
            ['translate', 'rotate', 'skewX', 'skewY'].indexOf(transform.name) > -1 &&
            (transform.data.length == 1 || transform.name == 'rotate') &&
            !transform.data[0] ||

            // translate(0, 0)
            transform.name == 'translate' &&
            !transform.data[0] &&
            !transform.data[1] ||

            // scale(1)
            transform.name == 'scale' &&
            transform.data[0] == 1 &&
            (transform.data.length < 2 || transform.data[1] == 1) ||

            // matrix(1 0 0 1 0 0)
            transform.name == 'matrix' &&
            transform.data[0] == 1 &&
            transform.data[3] == 1 &&
            !(transform.data[1] || transform.data[2] || transform.data[4] || transform.data[5])
        ) {
            return false
        }

        return true;

    });

}

/**
 * Convert transforms JS representation to string.
 *
 * @param {Array} transformJS JS representation array
 * @param {Object} params plugin params
 * @return {String} output string
 */
function js2transform(transformJS, params) {

    var transformString = '';

    // collect output value string
    transformJS.forEach(function(transform) {
        transform = roundTransform(transform, params);
        transformString += (transformString && ' ') + transform.name + '(' + cleanupOutData(transform.data, params) + ')';
    });

    return transformString;

}

function roundTransform(transform, params) {
    var floatRound = params.floatPrecision > 0 ? smartRound : round,
        transformRound = params.transformPrecision > 0 ? smartRound : round;

    switch (transform.name) {
        case 'translate':
            transform.data = floatRound(transform.data, params.floatPrecision);
            break;
        case 'rotate':
            transform.data = floatRound(transform.data.slice(0, 1), params.degPrecision)
                .concat(floatRound(transform.data.slice(1), params.floatPrecision));
            break;
        case 'skewX':
        case 'skewY':
            transform.data = floatRound(transform.data, params.degPrecision);
            break;
        case 'scale':
            transform.data = transformRound(transform.data, params.transformPrecision);
            break;
        case 'matrix':
            transform.data = transformRound(transform.data.slice(0, 4), params.transformPrecision)
                .concat(floatRound(transform.data.slice(4), params.floatPrecision));
            break;
    }

    return transform;
}

function round(data) {
    return data.map(Math.round);
}

/**
 * Decrease accuracy of floating-point numbers
 * in transforms keeping a specified number of decimals.
 * Smart rounds values like 2.349 to 2.35.
 *
 * @param {Array} data input data array
 * @param {Number} fixed number of decimals
 * @return {Array} output data array
 */
function smartRound(data, precision) {
    for (var i = data.length, tolerance = Math.pow(.1, precision); i--;) {
        var rounded = +data[i].toFixed(precision - 1);
        data[i] = +Math.abs(rounded - data[i]).toFixed(precision) >= tolerance ?
            +data[i].toFixed(precision) :
            rounded;
    }
    return data;
}
