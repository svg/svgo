var cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
    regPathData = /(?=-)|[\s,]+/,
    pathElems = ['path', 'glyph', 'missing-glyph'];

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

        var data = path2js(item.attr('d').value);

        if (data.length) {
            data = convertToRelative(data);

            data = filters(data, params);

            item.attr('d').value = js2path(data, params);
        }

    }

};

/**
 * Convert path string to JS representation.
 *
 * @param {String} pathString input string
 * @param {Object} params plugin params
 *
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

                // M 35.898 14.374 L 35.898 14.374 → M35.898 14.374L35.898 14.374
                data = data.trim().split(regPathData).map(function(str) {
                    return +str;
                });

                // very stupid defense strategy
                if (!isNaN(data[0])) {

                    var pair = 0;

                    if ('HhVv'.indexOf(instruction) > -1) {
                        pair = 1;
                    } else if ('MmLlTt'.indexOf(instruction) > -1) {
                        pair = 2;
                    } else if ('QqSs'.indexOf(instruction) > -1) {
                        pair = 4;
                    } else if ('Cc'.indexOf(instruction) > -1) {
                        pair = 6;
                    } else if ('Aa'.indexOf(instruction) > -1) {
                        pair = 7;
                    }

                    while(data.length) {
                        path.push({
                            instruction: instruction,
                            data: data.splice(0, pair)
                        });
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
 *
 * @return {Array} output path data
 */
function convertToRelative(path) {

    var instruction,
        data,
        newPoint,
        point = [0, 0];

    path.forEach(function(item) {

        instruction = item.instruction;
        data = item.data;

        if (data) {

            // already relative
            // recalculate current point
            if ('mcslqta'.indexOf(instruction) > -1) {

                newPoint = data.slice(-2);

                point[0] += newPoint[0];
                point[1] += newPoint[1];

            } else if (instruction === 'h') {

                point[0] += data[0];

            } else if (instruction === 'v') {

                point[1] += data[0];

            }

            // convert absolute path data coordinates to relative
            // M → m
            // L → l
            // T → t
            if ('MLT'.indexOf(instruction) > -1) {

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

    });

    return path;

}

/**
 * Main filters loop.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 *
 * @return {Array} output path data
 */
function filters(path, params) {

    var instruction,
        data,
        point = [0, 0],
        prev = {
            point: [0, 0]
        },
        index = 0;

    path = path.filter(function(item) {

        instruction = item.instruction;
        data = item.data;
        point = item.point;

        index++;

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
                     'lhvqtcs'.indexOf(instruction) > -1 ||
                     (instruction === 'm' && index > 1)
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

            // collapse moveto + lineto
            if (
                params.collapseMovetoLineto &&
                prev.item &&
                prev.item.instruction === 'm' &&
                instruction === 'l'
            ) {
                prev.item.data = prev.item.data.concat(data);

                return false;
            }

            // collapse repeated instructions data
            if (
                params.collapseRepeated &&
                prev.item &&
                instruction === prev.item.instruction
            ) {
                // increase previous h or v data with current
                if (instruction === 'h' || instruction === 'v') {
                    prev.item.data[0] += data[0];
                // concat previous data with current
                } else {
                    prev.item.data = prev.item.data.concat(data);
                }

                // if there was an original then remove it because of the new data
                delete prev.item.original;

                // filter current item
                return false;
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
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 *
 * @param {Array} data input data array
 * @param {Number} fixed number of decimals
 *
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
 *
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

    return !+area.toFixed(2);

}

/**
 * Convert path array to string.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 *
 * @return {String} output path string
 */
function js2path(path, params) {

        // out path data string
    var pathString = '';

    path.forEach(function(item) {

        pathString += item.instruction + (item.data ? cleanupOutData(item.data, params) : '');

    });

    return pathString;

}
