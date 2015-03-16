'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
    applyTransforms: true,
    applyTransformsStroked: true,
    straightCurves: true,
    lineShorthands: true,
    curveSmoothShorthands: true,
    floatPrecision: 3,
    removeUseless: true,
    collapseRepeated: true,
    utilizeAbsolute: true,
    leadingZero: true,
    negativeExtraSpace: true
};

var pathElems = require('./_collections.js').pathElems,
    path2js = require('./_path.js').path2js,
    js2path = require('./_path.js').js2path,
    applyTransforms = require('./_path.js').applyTransforms,
    cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    precision,
    error,
    hasMarkerMid;

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
exports.fn = function(item, params) {

    if (item.isElem(pathElems) && item.hasAttr('d')) {

        precision = params.floatPrecision;
        error = precision !== false ? +Math.pow(.1, precision).toFixed(precision) : 1e-2;
        hasMarkerMid = item.hasAttr('marker-mid');

        var data = path2js(item);

        // TODO: get rid of functions returns
        if (data.length) {
            convertToRelative(data);

            if (params.applyTransforms) {
                data = applyTransforms(item, data, params.applyTransformsStroked, params.floatPrecision);
            }

            data = filters(data, params);

            if (params.utilizeAbsolute) {
                data = convertToMixed(data, params);
            }

            js2path(item, data, params);
        }

    }

};

/**
 * Convert absolute path data coordinates to relative.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {Array} output path data
 */
function convertToRelative(path) {

    var point = [0, 0],
        subpathPoint = [0, 0],
        baseItem;

    path.forEach(function(item, index) {

        var instruction = item.instruction,
            data = item.data;

        // data !== !z
        if (data) {

            // already relative
            // recalculate current point
            if ('mcslqta'.indexOf(instruction) > -1) {

                point[0] += data[data.length - 2];
                point[1] += data[data.length - 1];

                if (instruction === 'm') {
                    subpathPoint[0] = point[0];
                    subpathPoint[1] = point[1];
                    baseItem = item;
                }

            } else if (instruction === 'h') {

                point[0] += data[0];

            } else if (instruction === 'v') {

                point[1] += data[0];

            }

            // convert absolute path data coordinates to relative
            // if "M" was not transformed from "m"
            // M → m
            if (instruction === 'M') {

                if (index > 0) instruction = 'm';

                data[0] -= point[0];
                data[1] -= point[1];

                subpathPoint[0] = point[0] += data[0];
                subpathPoint[1] = point[1] += data[1];

                baseItem = item;

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

            // store absolute coordinates for later use
            item.coords = point.slice(-2);

        }

        // !data === z, reset current point
        else if (instruction == 'z') {
            if (baseItem) {
                item.coords = baseItem.coords;
            }
            point[0] = subpathPoint[0];
            point[1] = subpathPoint[1];
        }

        item.base = index > 0 ? path[index - 1].coords : [0, 0];

    });

    return path;

}

/**
 * Main filters loop.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {Array} output path data
 */
function filters(path, params) {

    var relSubpoint = [0, 0],
        pathBase = [0, 0],
        prev = {};

    path = path.filter(function(item, index) {

        var instruction = item.instruction,
            data = item.data;

        if (data) {

            if (instruction === 's') {
                var sdata = [0, 0].concat(data);

                if ('cs'.indexOf(prev.instruction) > -1) {
                    var pdata = prev.data,
                        n = pdata.length;

                    // (-x, -y) of the prev tangent point relative to the current point
                    sdata[0] = pdata[n - 2] - pdata[n - 4];
                    sdata[1] = pdata[n - 1] - pdata[n - 3];
                }

            }

            // Rounding relative coordinates, taking in account accummulating error
            // to get closer to absolute coordinates. Sum of rounded value remains same:
            // l .25 3 .25 2 .25 3 .25 2 -> l .3 3 .2 2 .3 3 .2 2
            if (precision !== false) {
                if ('mltqsc'.indexOf(instruction) > -1) {
                    for (var i = data.length; i--;) {
                        data[i] += item.base[i % 2] - relSubpoint[i % 2];
                    }
                } else if (instruction == 'h') {
                    data[0] += item.base[0] - relSubpoint[0];
                } else if (instruction == 'v') {
                    data[0] += item.base[1] - relSubpoint[1];
                } else if (instruction == 'a') {
                    data[5] += item.base[0] - relSubpoint[0];
                    data[6] += item.base[1] - relSubpoint[1];
                }
                roundData(data);

                if      (instruction == 'h') relSubpoint[0] += data[0];
                else if (instruction == 'v') relSubpoint[1] += data[0];
                else {
                    relSubpoint[0] += data[data.length - 2];
                    relSubpoint[1] += data[data.length - 1];
                }
                roundData(relSubpoint);

                if (instruction.toLowerCase() == 'm') {
                    pathBase[0] = relSubpoint[0];
                    pathBase[1] = relSubpoint[1];
                }
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
                else if (
                    instruction === 's' &&
                    isCurveStraightLine(
                        [ 0, sdata[0], sdata[2], sdata[4] ],
                        [ 0, sdata[1], sdata[3], sdata[5] ]
                    )
                ) {
                    instruction = 'l';
                    data = data.slice(-2);
                }

                // q
                else if (
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
                        prev.original &&
                        prev.original.instruction === 'q'
                    ) {
                        if (isCurveStraightLine(
                            [ prev.original.data[0], prev.original.data[2], data[0] ],
                            [ prev.original.data[1], prev.original.data[3], data[1] ]
                        )) {
                            instruction = 'l';
                            data = data.slice(-2);
                        } else {
                            prev.instruction = 'q';
                            prev.data = prev.original.data;
                        }
                    }

                    // [^qt] + t
                    else if ('qt'.indexOf(prev.instruction) < 0) {
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
                    data.pop();
                } else if (data[0] === 0) {
                    instruction = 'v';
                    data.shift();
                }
            }

            // collapse repeated commands
            // h 20 h 30 -> h 50
            if (
                params.collapseRepeated &&
                !hasMarkerMid &&
                ('mhv'.indexOf(instruction) > -1) &&
                prev.instruction &&
                instruction == prev.instruction.toLowerCase() &&
                (
                    (instruction != 'h' && instruction != 'v') ||
                    (prev.data[0] >= 0) == (item.data[0] >= 0)
            )) {
                prev.data[0] += data[0];
                if (instruction != 'h' && instruction != 'v') {
                    prev.data[1] += data[1];
                }
                prev.coords = item.coords;
                if (prev.original) prev.original = null;
                path[index] = prev;
                return false;
            }

            // convert curves into smooth shorthands
            if (params.curveSmoothShorthands && prev.instruction) {

                // curveto
                if (instruction === 'c') {

                    // c + c → c + s
                    if (
                        prev.instruction === 'c' &&
                        data[0] === -(prev.data[2] - prev.data[4]) &&
                        data[1] === -(prev.data[3] - prev.data[5])
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                    // s + c → s + s
                    else if (
                        prev.instruction === 's' &&
                        data[0] === -(prev.data[0] - prev.data[2]) &&
                        data[1] === -(prev.data[1] - prev.data[3])
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                    // [^cs] + c → [^cs] + s
                    else if (
                        'cs'.indexOf(prev.instruction) === -1 &&
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
                        prev.instruction === 'q' &&
                        data[0] === (prev.data[2] - prev.data[0]) &&
                        data[1] === (prev.data[3] - prev.data[1])
                    ) {
                        instruction = 't';
                        data = data.slice(2);
                    }

                    // t + q → t + t
                    else if (
                        prev.instruction === 't' &&
                        data[2] === prev.data[0] &&
                        data[3] === prev.data[1]
                    ) {
                        instruction = 't';
                        data = data.slice(2);
                    }

                }

            }

            // remove useless non-first path segments
            if (params.removeUseless) {

                // l 0,0 / h 0 / v 0 / q 0,0 0,0 / t 0,0 / c 0,0 0,0 0,0 / s 0,0 0,0
                if (
                    (
                     'lhvqtcs'.indexOf(instruction) > -1
                    ) &&
                    data.every(function(i) { return i === 0; })
                ) {
                    path[index] = prev;
                    return false;
                }

                // a 25,25 -30 0,1 0,0
                if (
                    instruction === 'a' &&
                    data[5] === 0 &&
                    data[6] === 0
                ) {
                    path[index] = prev;
                    return false;
                }

            }

            item.instruction = instruction;
            item.data = data;

            prev = item;

        } else {

            // z resets coordinates
            relSubpoint[0] = pathBase[0];
            relSubpoint[1] = pathBase[1];
            if (prev.instruction == 'z') return false;
            prev = item;

        }

        return true;

    });

    return path;

}

/**
 * Writes data in shortest form using absolute or relative coordinates.
 *
 * @param {Array} data input path data
 * @return {Boolean} output
 */
function convertToMixed(path, params) {

    var prev = path[0];

    path = path.filter(function(item, index) {

        if (index == 0) return true;
        if (!item.data) {
            prev = item;
            return true;
        }

        var instruction = item.instruction,
            data = item.data,
            adata = data && data.slice(0);

        if ('mltqsc'.indexOf(instruction) > -1) {
            for (var i = adata.length; i--;) {
                adata[i] += item.base[i % 2];
            }
        } else if (instruction == 'h') {
                adata[0] += item.base[0];
        } else if (instruction == 'v') {
                adata[0] += item.base[1];
        } else if (instruction == 'a') {
                adata[5] += item.base[0];
                adata[6] += item.base[1];
        }

        roundData(adata);

        var absoluteDataStr = cleanupOutData(adata, params),
            relativeDataStr = cleanupOutData(data, params);

        // Convert to absolute coordinates if it's shorter.
        // v-20 -> V0
        // Don't convert if it fits following previous instruction.
        // l20 30-10-50 instead of l20 30L20 30
        if (
            absoluteDataStr.length < relativeDataStr.length &&
            !(
                params.negativeExtraSpace &&
                instruction == prev.instruction &&
                prev.instruction.charCodeAt(0) > 96 &&
                absoluteDataStr.length == relativeDataStr.length - 1 &&
                (data[0] < 0 || 0 < data[0] && data[0] < 1 && prev.data[prev.data.length - 1] % 1)
            )
        ) {
            item.instruction = instruction.toUpperCase();
            item.data = adata;
        }

        prev = item;

        return true;

    });

    return path;

}

/**
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 * Smart rounds values like 2.349 to 2.35.
 *
 * @param {Array} data input data array
 * @param {Number} fixed number of decimals
 * @return {Array} output data array
 */
function roundData(data) {

    function round(data) {
        for (var i = data.length; i--;) {
            data[i] = +data[i].toFixed(precision);
        }
        return data;
    }

    function strongRound(data) {
        for (var i = data.length; i--;) {
            var rounded = +data[i].toFixed(precision - 1);
            data[i] = +Math.abs(rounded - data[i]).toFixed(precision) > error ?
                +data[i].toFixed(precision) :
                rounded;
        }
        return data;
    }

    roundData = precision > 0 ? strongRound : round;

    return roundData(data);

}

/**
 * Checks if a curve is a straight line by measuring distance
 * from middle points to the line formed by end points.
 *
 * @param {Array} xs array of curve points x-coordinates
 * @param {Array} ys array of curve points y-coordinates
 * @return {Boolean}
 */

function isCurveStraightLine(xs, ys) {

    // Get line equation a·x + b·y + c = 0 coefficients a, b, c by start and end points.
    var i = xs.length - 1,
        a = ys[0] - ys[i], // y1 − y2
        b = xs[i] - xs[0], // x2 − x1
        c = xs[0] * ys[i] - xs[i] * ys[0], // x1·y2 − x2·y1
        d = 1 / (a * a + b * b); // same part for all points

    if (!isFinite(d)) return false; // curve that ends at start point isn't the case

    // Distance from point (x0, y0) to the line is sqrt((c − a·x0 − b·y0)² / (a² + b²))
    while (--i) {
        if (Math.sqrt(Math.pow(c - a * xs[i] - b * ys[i], 2) * d) > error)
            return false;
    }

    return true;

}
