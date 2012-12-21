'use strict';

var cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
    regPathData = /[\-+]?\d*\.?\d+([eE][\-+]?\d+)?/g,
    pathElems = ['path', 'glyph', 'missing-glyph'],
    hasMarkerMid,
    transform2js = require('./_transforms.js').transform2js,
    transformsMultiply = require('./_transforms.js').transformsMultiply;

/**
 * Convert absolute Path to relative,
 * collapse repeated instructions,
 * detect and convert Lineto shorthands,
 * remove useless instructions like "l0,0",
 * trim useless delimiters and leading zeros,
 * decrease accuracy of floating-point numbers.
 *
 * @see http://www.w3.org/TR/SVG/paths.html#PathData
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.convertPathData = function(item, params) {

    if (item.isElem(pathElems) && item.hasAttr('d')) {

        hasMarkerMid = item.hasAttr('marker-mid');

        var data = path2js(item.attr('d').value);


        // TODO: get rid of functions returns
        if (data.length) {
            data = convertToRelative(data);

            if (params.applyTransforms) {
                data = applyTransforms(item, data);
            }

            data = filters(data, params);

            if (params.collapseRepeated) {
                data = collapseRepeated(data, params);
            }

            item.attr('d').value = js2path(data, params);
        }

    }

};

/**
 * Convert path string to JS representation.
 *
 * @param {String} pathString input string
 * @param {Object} params plugin params
 * @return {Array} output array
 */
function path2js(pathString) {

        // JS representation of the path data
    var path = [],
        // current instruction context
        instruction;

    // splitting path string into array like ['M', '10 50', 'L', '20 30']
    pathString.split(regPathInstructions).forEach(function(data) {
        if (data) {
            // instruction item
            if (regPathInstructions.test(data)) {
                instruction = data;

                // z - instruction w/o data
                if ('Zz'.indexOf(instruction) > -1) {
                    path.push({
                        instruction: 'z'
                    });
                }
            // data item
            } else {

                data = data.trim().match(regPathData);

                if (data) {

                    var index = 0,
                        pair = 2;

                    data = data.map(function(str) {
                        return +str;
                    });

                    // deal with very first 'Mm' and multiple points data
                    if ('Mm'.indexOf(instruction) > -1) {

                        path.push({
                            instruction: instruction,
                            data: data.slice(index, index + pair)
                        });

                        index += pair;

                        if (data.length) {
                            instruction = instruction === instruction.toLowerCase() ? 'l' : 'L';
                        }

                    }

                    if ('HhVv'.indexOf(instruction) > -1) {
                        pair = 1;
                    } else if ('LlTt'.indexOf(instruction) > -1) {
                        pair = 2;
                    } else if ('QqSs'.indexOf(instruction) > -1) {
                        pair = 4;
                    } else if ('Cc'.indexOf(instruction) > -1) {
                        pair = 6;
                    } else if ('Aa'.indexOf(instruction) > -1) {
                        pair = 7;
                    }

                    while(index < data.length) {
                        path.push({
                            instruction: instruction,
                            data: data.slice(index, index + pair)
                        });

                        index += pair;
                    }

                }

            }
        }
    });

    return path;

}

/**
 * Convert absolute path data coordinates to relative.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {Array} output path data
 */
function convertToRelative(path) {

    var instruction,
        data,
        newPoint,
        point = [0, 0],
        subpathPoint = [0, 0],
        index = 0;

    path.forEach(function(item) {

        instruction = item.instruction;
        data = item.data;

        index++;

        // data !== !z
        if (data) {

            // already relative
            // recalculate current point
            if ('mcslqta'.indexOf(instruction) > -1) {

                newPoint = data.slice(-2);

                point[0] += newPoint[0];
                point[1] += newPoint[1];

                if (instruction === 'm') {
                    subpathPoint = point.slice(-2);
                }

            } else if (instruction === 'h') {

                point[0] += data[0];

            } else if (instruction === 'v') {

                point[1] += data[0];

            }

            // convert absolute path data coordinates to relative
            // M → m
            if (instruction === 'M') {

                if (index > 1) {
                    instruction = 'm';
                }

                data[0] -= point[0];
                data[1] -= point[1];

                point[0] += data[0];
                point[1] += data[1];

                subpathPoint = point.slice(-2);

            }

            // L → l
            // T → t
            else if ('LT'.indexOf(instruction) > -1) {

                instruction = instruction.toLowerCase();

                // x y
                // 0 1
                data[0] -= point[0];
                data[1] -= point[1];

                point[0] += data[0];
                point[1] += data[1];

            // C → c
            } else if (instruction === 'C') {

                instruction = 'c';

                // x1 y1 x2 y2 x y
                // 0  1  2  3  4 5
                data[0] -= point[0];
                data[1] -= point[1];
                data[2] -= point[0];
                data[3] -= point[1];
                data[4] -= point[0];
                data[5] -= point[1];

                point[0] += data[4];
                point[1] += data[5];

            // S → s
            // Q → q
            } else if ('SQ'.indexOf(instruction) > -1) {

                instruction = instruction.toLowerCase();

                // x1 y1 x y
                // 0  1  2 3
                data[0] -= point[0];
                data[1] -= point[1];
                data[2] -= point[0];
                data[3] -= point[1];

                point[0] += data[2];
                point[1] += data[3];

            // A → a
            } else if (instruction === 'A') {

                instruction = 'a';

                // rx ry x-axis-rotation large-arc-flag sweep-flag x y
                // 0  1  2               3              4          5 6
                data[5] -= point[0];
                data[6] -= point[1];

                point[0] += data[5];
                point[1] += data[6];

            // H → h
            } else if (instruction === 'H') {

                instruction = 'h';

                data[0] -= point[0];

                point[0] += data[0];

            // V → v
            } else if (instruction === 'V') {

                instruction = 'v';

                data[0] -= point[1];

                point[1] += data[0];

            }

            item.instruction = instruction;
            item.data = data;
            item.point = point.slice(0);

        }

        // !data === z, reset current point
        else {
            point = subpathPoint;
        }

    });

    return path;

}

/**
 * Apply transformation(s) to the Path data.
 *
 * @param {Object} elem current element
 * @param {Array} path input path data
 * @return {Array} output path data
 */
function applyTransforms(elem, path) {

    // if there are no 'stroke' attr and 'a' segments
    if (
        elem.hasAttr('transform') &&
        !elem.hasAttr('stroke') &&
        path.every(function(i) { return i.instruction !== 'a'; })
    ) {

        var matrix = transformsMultiply(transform2js(elem.attr('transform').value)),
            currentPoint;

        // if there is a translate() transform
        if (matrix.data[4] !== 0 || matrix.data[5] !== 0) {

            // then apply it only to the first absoluted M
            currentPoint = transformPoint(matrix.data, path[0].data[0], path[0].data[1]);
            path[0].data[0] = currentPoint[0];
            path[0].data[1] = currentPoint[1];

            // clear translate() data from transform matrix
            matrix.data[4] = 0;
            matrix.data[5] = 0;

            // apply transform to other segments
            path.slice(1).forEach(function(pathItem) {
                pathItem = transformData(matrix, pathItem);
            });

        } else {

            path.forEach(function(pathItem) {
                pathItem = transformData(matrix, pathItem);
            });

        }

        // remove transform attr
        elem.removeAttr('transform');

    }

    return path;

}

/**
 * Apply transformation(s) to the Path item data.
 *
 * @param {Array} matrix transform 3x3 matrix
 * @param {Object} item input Path item
 * @return {Object} output Path item
 */
function transformData(matrix, item) {

    if (item.data) {

        var currentPoint;

        // h
        if (item.instruction === 'h') {
            item.instruction = 'l';
            item.data[1] = 0;
        // v
        } else if (item.instruction === 'v') {
            item.instruction = 'l';
            item.data[1] = item.data[0];
            item.data[0] = 0;
        }

        for (var i = 0; i < item.data.length; i += 2) {
            currentPoint = transformPoint(matrix.data, item.data[i], item.data[i + 1]);
            item.data[i] = currentPoint[0];
            item.data[i + 1] = currentPoint[1];
        }

    }

    return item;

}

/**
 * Apply transform 3x3 matrix to x-y point.
 *
 * @param {Array} matrix transform 3x3 matrix
 * @param {Array} point x-y point
 * @return {Array} point with new coordinates
 */
function transformPoint(matrix, x, y) {

    return [
        matrix[0] * x + matrix[2] * y + matrix[4],
        matrix[1] * x + matrix[3] * y + matrix[5]
    ];

}

/**
 * Main filters loop.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {Array} output path data
 */
function filters(path, params) {

    var instruction,
        data,
        point = [0, 0],
        prev = {
            point: [0, 0]
        };

    path = path.filter(function(item) {

        instruction = item.instruction;
        data = item.data;
        point = item.point;

        if (data) {

            if (params.floatPrecision) {
                data = roundData(data, params.floatPrecision);
            }

            // convert straight curves into lines segments
            if (params.straightCurves) {

                // c
                if (
                    instruction === 'c' &&
                    isCurveStraightLine(
                        [ 0, data[0], data[2], data[4] ],
                        [ 0, data[1], data[3], data[5] ]
                    )
                ) {
                    instruction = 'l';
                    data = data.slice(-2);
                }

                // s
                else if (instruction === 's') {

                    if (
                        isCurveStraightLine(
                            [ 0, data[0], data[2] ],
                            [ 0, data[1], data[3] ]
                        )
                    ) {
                        instruction = 'l';
                        data = data.slice(-2);
                    }

                }

                // q
                else if (
                    prev.item &&
                    instruction === 'q' &&
                    isCurveStraightLine(
                        [ 0, data[0], data[2] ],
                        [ 0, data[1], data[3] ]
                    )
                ) {
                    // save the original one for the future potential q + t conversion
                    item.original = {
                        instruction: instruction,
                        data: data
                    };

                    instruction = 'l';
                    data = data.slice(-2);
                }

                else if (instruction === 't') {

                    // q (original) + t
                    if (
                        prev.item &&
                        prev.item.original &&
                        prev.item.original.instruction === 'q'
                    ) {
                        if (isCurveStraightLine(
                            [ prev.item.original.data[0], prev.item.original.data[2], data[0] ],
                            [ prev.item.original.data[1], prev.item.original.data[3], data[1] ]
                        )) {
                            instruction = 'l';
                            data = data.slice(-2);
                        } else {
                            prev.item.instruction = 'q';
                            prev.item.data = prev.item.original.data;
                        }
                    }

                    // [^qt] + t
                    else if (!prev.item || 'qt'.indexOf(prev.item.instruction) === -1) {
                        instruction = 'l';
                        data = data.slice(-2);
                    }

                }

                // a
                else if (
                    instruction === 'a' &&
                    (data[0] === 0 || data[1] === 0)
                ) {
                    instruction = 'l';
                    data = data.slice(-2);
                }
            }

            // horizontal and vertical line shorthands
            // l 50 0 → h 50
            // l 0 50 → v 50
            if (
                params.lineShorthands &&
                instruction === 'l'
            ) {
                if (data[1] === 0) {
                    instruction = 'h';
                    data = [data[0]];
                } else if (data[0] === 0) {
                    instruction = 'v';
                    data = [data[1]];
                }
            }

            // convert curves into smooth shorthands
            if (params.curveSmoothShorthands && prev.item) {

                // curveto
                if (instruction === 'c') {

                    // c + c → c + s
                    if (
                        prev.item.instruction === 'c' &&
                        data[0] === -(prev.item.data[2] - prev.item.data[4]) &&
                        data[1] === -(prev.item.data[3] - prev.item.data[5])
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                    // s + c → s + s
                    else if (
                        prev.item.instruction === 's' &&
                        data[0] === -(prev.item.data[0] - prev.item.data[2]) &&
                        data[1] === -(prev.item.data[1] - prev.item.data[3])
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                    // [^cs] + c → [^cs] + s
                    else if (
                        'cs'.indexOf(prev.item.instruction) === -1 &&
                        data[0] === 0 &&
                        data[1] === 0
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                }

                // quadratic Bézier curveto
                else if (instruction === 'q') {

                    // q + q → q + t
                    if (
                        prev.item.instruction === 'q' &&
                        data[0] === (prev.item.data[2] - prev.item.data[0]) &&
                        data[1] === (prev.item.data[3] - prev.item.data[1])
                    ) {
                        instruction = 't';
                        data = data.slice(2);
                    }

                    // t + q → t + t
                    else if (
                        prev.item.instruction === 't' &&
                        data[2] === prev.item.data[0] &&
                        data[3] === prev.item.data[1]
                    ) {
                        instruction = 't';
                        data = data.slice(2);
                    }

                }

            }

            // remove useless non-first path segments
            if (params.removeUseless) {

                // m 0,0 / l 0,0 / h 0 / v 0 / q 0,0 0,0 / t 0,0 / c 0,0 0,0 0,0 / s 0,0 0,0
                if (
                    (
                     'lhvqtcs'.indexOf(instruction) > -1
                    ) &&
                    data.every(function(i) { return i === 0; })
                ) {
                    return false;
                }

                // a 25,25 -30 0,1 0,0
                if (
                    instruction === 'a' &&
                    data[5] === 0 &&
                    data[6] === 0
                ) {
                    return false;
                }

            }

            item.instruction = instruction;
            item.data = data;

            prev = {
                item: item,
                point: point.slice(0)
            };

        }

        return true;

    });

    return path;

}

/**
 * Collapse repeated instructions data
 *
 * @param {Array} path input path data
 * @return {Array} output path data
 */
function collapseRepeated(path) {

    var prev;

    path = path.filter(function(item) {

        if (
            !hasMarkerMid &&
            prev &&
            item.instruction === prev.instruction
        ) {
            // increase previous h or v data with current
            if (item.instruction === 'h' || item.instruction === 'v') {
                prev.data[0] += item.data[0];
            // concat previous data with current
            } else {
                prev.data = prev.data.concat(item.data);
            }

            // filter current item
            return false;
        }

        prev = item;

        return true;

    });

    return path;

}

/**
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 *
 * @param {Array} data input data array
 * @param {Number} fixed number of decimals
 * @return {Array} output data array
 */
function roundData(data, fixed) {

    return data.map(function(num) {
        return +num.toFixed(fixed);
    });

}

/**
 * Checks if curve is a straight line by calculating a polygon area.
 *
 * @see http://www.mathopenref.com/coordpolygonarea2.html
 *
 * @param {Array} xs array of curve points x-coordinates
 * @param {Array} ys array of curve points y-coordinates
 * @return {Boolean}
 */

function isCurveStraightLine(xs, ys) {

    var points = xs.length,
        area = 0,
        j = points - 1;

    for (var i=0; i < points; i++) {
        area += (xs[j] + xs[i]) * (ys[j] - ys[i]);
        j = i;
    }

    if (+area.toFixed(2)) return false;

    return true;

}

/**
 * Convert path array to string.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {String} output path string
 */
function js2path(path, params) {

        // output path data string
    var pathString = '';

    path.forEach(function(item) {

        pathString += item.instruction + (item.data ? cleanupOutData(item.data, params) : '');

    });

    return pathString;

}
