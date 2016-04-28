'use strict';

exports.type = 'full';

exports.active = false;

exports.params = {
    leadingZero: true,
    negativeExtraSpace: true,
    floatPrecision: 3,
    applyViewBox: true
};

exports.description = 'scales decimal values to integers';

var path2js = require('./_path.js').path2js,
    js2path = require('./_path.js').js2path,
    transform2js = require('./_transforms.js').transform2js,
    cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g,

    // Handler for simple values (width, height etc.)
    simpleValueHandler = {
        get: getPrecision,
        set: scalePrecision
    },

    // Handler for value lists (viewBox, coordiates etc.)
    valueListHandler = {
        get: getValueListPrecision,
        set: scaleValueList
    },

    // Handler for transforms
    transformHandler = {
        set: scaleTransform
    },

    attrs = {
        'x': simpleValueHandler,
        'y': simpleValueHandler,
        'x1': simpleValueHandler,
        'y1': simpleValueHandler,
        'x2': simpleValueHandler,
        'y2': simpleValueHandler,
        'r': simpleValueHandler,
        'rx': simpleValueHandler,
        'ry': simpleValueHandler,
        'cx': simpleValueHandler,
        'cy': simpleValueHandler,
        'dx': simpleValueHandler,
        'dy': simpleValueHandler,
        'fx': simpleValueHandler,
        'fy': simpleValueHandler,
        'width': simpleValueHandler,
        'height': simpleValueHandler,
        'stroke-width': simpleValueHandler,
        'font-size': simpleValueHandler,
        'stdDeviation': simpleValueHandler,
        'viewBox': valueListHandler,
        'points': valueListHandler,
        'stroke-dasharray': valueListHandler,
        'transform': transformHandler,
        'gradientTransform': transformHandler
    };

/**
 * Scales decimal values into integers.
 *
 * @example
 * <svg width="100.25" height="50.25">
 *             ⬇
 * <svg width="10025" height="5025">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Keith Clark
 */
exports.fn = function (data, params) {
    var root = getSvgRoot(data),
        precision, width, height;

    if (!root) {
        return data;
    }

    // determine the document percision
    precision = Math.min(params.floatPrecision, getDocumentPrecision(data));

    // store the original image dimensions
    if (root.hasAttr('width')) {
        width = root.attr('width').value;
    }
    if (root.hasAttr('height')) {
        height = root.attr('height').value;
    }

    // We need to set a root `stroke-width` so that paths using the implied
    // default value of `1` will render at the correct scale.
    root.addAttr({
        name: 'stroke-width',
        value: 1,
        local: 'stroke-width',
        prefix: ''
    });

    // scale the document
    scaleDocumentPrecision(data, precision, params);

    // since we're scaling the image we need to add a viewBox and restore the
    // root width/height attributes to ensure the image will render at the
    // original size.
    if (params.applyViewBox && root.isElem('svg') && width && height) {
        setViewBox(root, 0, 0, root.attr('width').value, root.attr('height').value, params);
        root.attr('width').value = width;
        root.attr('height').value = height;
    }

    return data;
};


/**
 * gets the root SVG element.
 *
 * @param {number} value    value to test
 * @return {number} precision
 */
function getSvgRoot(data) {
    for (var c = 0; c < data.content.length; c++) {
        if (data.content[c].isElem('svg')) {
            return data.content[c];
        }
    }
}

/**
 * Determines the precision of the passed value.
 *
 * @param {number} value    value to test
 * @return {number} precision
 */
function getPrecision(value) {
    value = String(value);
    var dp = value.indexOf('.');
    return (dp > -1) ? value.substr(dp + 1).length : 0;
}

/**
 * Scales the passed value by the specified power of ten.
 *
 * @param {number} value    value to scale
 * @param {number} scale    scale factor (power of ten)
 * @return {number} scaled value
 */
function scalePrecision(value, scale) {
    // TODO: test for units
    if (isNaN(value)) {
        return value;
    }
    return +((+value) * Math.pow(10, scale)).toFixed();
}

/**
 * Determines the maximum precision of values in the passed
 * array.
 *
 * @param {number[]} arr   values to test
 * @return {number} precision
 */
function getArrayPrecision(arr) {
    var precision = 0;
    arr.forEach(function (val) {
        precision = Math.max(precision, getPrecision(val));
    });
    return precision;
}

/**
 * Scales the values in the passed array to the specified
 * power of ten.
 *
 * @param {number[]} arr   values to scale
 * @param {number} scale   scale factor (power of ten)
 * @return {number[]} scaled values
 */
function scaleArray(arr, scale) {
    return arr.map(function (val) {
        return scalePrecision(val, scale);
    });
}

/**
 * splits a list of values into an array of numbers
 * values.
 *
 * @param {string} values    value list to split
 * @return {number[]} numbers
 */
function valuesToArray(values) {
    return values.match(regNumber) || [];
}

/**
 * Determines the maximum precision of values in a list of
 * values.
 *
 * @param {string} coords    values list to test
 * @return {number} precision
 */
function getValueListPrecision(list) {
    return getArrayPrecision(valuesToArray(list));
}

/**
 * Scales the passed list of values to the specified power
 * of ten.
 *
 * @param {string} list    values to scale
 * @param {number} scale   scale factor (power of ten)
 * @param {Object} params  plugin params
 * @return {string} scaled scaled list
 */
function scaleValueList(list, scale, params) {
    return cleanupOutData(scaleArray(valuesToArray(list), scale), params);
}

/**
 * Scales the passed transform string to the specified power
 * of ten.
 *
 * @param {string} transform   coordinates to scale
 * @param {number} scale       scale factor (power of ten)
 * @param {Object} params      plugin params
 * @return {string} scaled transform
 */
function scaleTransform(transform, scale, params) {
    var transforms = transform2js(transform);
    transforms.forEach(function (transform) {
        if (transform.name === 'translate') {
            transform.data = scaleArray(transform.data, scale);
        } else if (transform.name === 'matrix') {
            transform.data[4] = scalePrecision(transform.data[4], scale);
            transform.data[5] = scalePrecision(transform.data[5], scale);
        }
    });
    return js2transform(transforms, params);
}

/**
 * Converts a js object into a transform string.
 *
 * @param {Object[]} transformJS   object to convert
 * @param {Object} params          plugin params
 * @return {string}                converted string
 */
function js2transform(transformJS, params) {
    var transformString = '';

    // collect output value string
    transformJS.forEach(function (transform) {
        transformString += (transformString && ' ') + transform.name + '(' + cleanupOutData(transform.data, params) + ')';
    });

    return transformString;
}

/**
 * Scales the passed path string to the specified power of ten.
 *
 * @param {string} path      path to scale
 * @param {number} scale     scale factor (power of ten)
 * @param {Object} params    plugin params
 * @return {string} scaled path
 */
function getPathPrecision(path) {
    var precision = 0;
    var segments = path2js(path);
    segments.forEach(function (segment) {
        var instruction = segment.instruction;
        if ('MmLlHhVvCcSsQqTt'.indexOf(instruction) > -1) {
            precision = Math.max(precision, getArrayPrecision(segment.data));
        } else if ('Aa'.indexOf(instruction) > -1) {
            precision = Math.max(precision, getPrecision(segment.data[0]));
            precision = Math.max(precision, getPrecision(segment.data[1]));
            precision = Math.max(precision, getPrecision(segment.data[5]));
            precision = Math.max(precision, getPrecision(segment.data[6]));
        }
    });
    return precision;
}

/**
 * Scales the passed path string to the specified power of ten.
 *
 * @param {string} path      path to scale
 * @param {number} scale     scale factor (power of ten)
 * @param {Object} params    plugin params
 * @return {string} scaled path
 */
function scalePath(path, scale, params) {
    var segments = path2js(path);
    segments.forEach(function (segment) {
        var instruction = segment.instruction;
        if ('MmLlHhVvCcSsQqTt'.indexOf(instruction) > -1) {
            segment.data = scaleArray(segment.data, scale);
        } else if ('Aa'.indexOf(instruction) > -1) {
            segment.data[0] = scalePrecision(segment.data[0], scale);
            segment.data[1] = scalePrecision(segment.data[1], scale);
            segment.data[5] = scalePrecision(segment.data[5], scale);
            segment.data[6] = scalePrecision(segment.data[6], scale);
        }
    });
    js2path(path, segments, params);
}

/**
 * applies a viewBox to an element
 *
 * @param {Object} item      SVG element to apply viewbox to
 * @param {number} minX      minimum x value
 * @param {number} minY      minimum y value
 * @param {number} width     rectangle width
 * @param {number} height    rectangle height
 * @param {Object} params    plugin params
 */
function setViewBox(item, minX, minY, width, height, params) {
    if (!item.hasAttr('viewBox') && item.hasAttr('width') && item.hasAttr('height')) {
        item.addAttr({
            name: 'viewBox',
            value: cleanupOutData([minX, minY, width, height], params),
            prefix: '',
            local: 'viewBox'
        });
    }
}

/**
 * Determines the largest precision used in a document.
 *
 * @param {Object} items             SVG items to process
 * @param {number} basePrecision     starting precision
 * @return {string} precision
 */
function getDocumentPrecision(items, basePrecision) {
    var precision = basePrecision || 0;

    items.content.forEach(function (item) {
        if (item.isElem()) {
            Object.keys(attrs).forEach(function (key) {
                if (item.hasAttr(key) && attrs[key].get) {
                    precision = Math.max(precision, attrs[key].get(item.attr(key).value));
                }
            });
            if (item.isElem('path')) {
                precision = Math.max(precision, getPathPrecision(item));
            }
        }
        if (item.content) {
            precision = Math.max(precision, getDocumentPrecision(item, precision));
        }
    });
    return precision;
}

/**
 * Scales the passed document fragment to the specified power of ten.
 *
 * @param {Object} items     SVG items to process
 * @param {number} scale     scale factor (power of ten)
 * @param {Object} params    plugin params
 */
function scaleDocumentPrecision(items, scale, params) {
    items.content.forEach(function (item) {
        if (item.isElem()) {
            Object.keys(attrs).forEach(function (key) {
                var attr;
                if (item.hasAttr(key) && attrs[key].set) {
                    attr = item.attr(key);
                    attr.value = attrs[key].set(attr.value, scale, params);
                }
            });

            if (item.isElem('path')) {
                scalePath(item, scale, params);
            }
        }

        if (item.content) {
            scaleDocumentPrecision(item, scale, params);
        }
    });
}
