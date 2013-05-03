'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
      convertToShorts: true,
      floatPrecision: 3,
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

    var data = transform2js(item.attr(attrName).value);

    if (params.convertToShorts) {
        data = convertToShorts(data, params);
    }

    if (params.removeUseless) {
        data = removeUseless(data);
    }

    if (
        params.collapseIntoOne &&
        (data.length >= 3 ||
         data.some(function(i) { return i.name === 'matrix'; })
        )
    ) {
        data = [transformsMultiply(data, params)];

        if (params.matrixToTransform) {
            data = [matrixToTransform(data[0], params)];
        }
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
            transforms.length < 3 &&
            transform.name === 'matrix'
        ) {
            transforms[i] = matrixToTransform(transform, params);
        }

        // fixed-point numbers
        // 12.754997 → 12.755
        if (params.floatPrecision !== false) {
            transform.data = transform.data.map(function(num) {
                return +num.toFixed(params.floatPrecision);
            });
        }

        // convert long translate transform notation to the shorts one
        // translate(10 0) → translate(10)
        if (
            params.shortTranslate &&
            transform.name === 'translate' &&
            transform.data.length === 2 &&
            transform.data[1] === 0
        ) {
            transform.data = [transform.data[0]];
        }

        // convert long scale transform notation to the shorts one
        // scale(2 2) → scale(2)
        if (
            params.shortScale &&
            transform.name === 'scale' &&
            transform.data.length === 2 &&
            transform.data[0] === transform.data[1]
        ) {
            transform.data = [transform.data[0]];
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

        transformString += (transformString ? ' ' : '') + transform.name + '(' + cleanupOutData(transform.data, params) + ')';

    });

    return transformString;

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
