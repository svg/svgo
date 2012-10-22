var cleanupOutData = require('../lib/tools').cleanupOutData,
    regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
    regPathData = /(?=-)|[\s,]+/;

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

    if (item.isElem('path') && item.hasAttr('d')) {

        var data = path2js(item.attr('d').value);

        data = convertToRelative(data, params);

        data = filters(data, params);

        item.attr('d').value = js2path(data, params);

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
function convertToRelative(path, params) {

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
            if (params.convertToRelative) {

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
                    data[0] -= point[0];
                    data[1] -= point[1];
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

            // calculate new current point
            } else {

                if ('MCSLQTA'.indexOf(instruction) > -1) {

                    newPoint = data.slice(-2);

                    point[0] = newPoint[0];
                    point[1] = newPoint[1];

                } else if (instruction === 'H') {

                    point[0] = data[0];

                } else if (instruction === 'V') {

                    point[1] = data[0];

                }

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
        };

    path = path.filter(function(item) {

        instruction = item.instruction;
        data = item.data;
        point = item.point;

        if (data) {

            if (params.floatPrecision) {
                data = roundData(data, params.floatPrecision);
            }

            // horizontal and vertical line shorthands
            // l 50 0 → h 50
            // l 0 50 → v 50
            if (
                params.lineShorthands &&
                'Ll'.indexOf(instruction) > -1
            ) {
                var lowerCase = instruction === instruction.toLowerCase();

                if (point[1] - prev.point[1] === 0) {
                    instruction = lowerCase ? 'h' : 'H';
                    data = [data[0]];
                } else if (point[0] - prev.point[0] === 0) {
                    instruction = lowerCase ? 'v' : 'V';
                    data = [data[1]];
                }
            }

            // remove useless path segments
            if (params.removeUseless) {

                // m 0,0 / l 0,0 / h 0 / v 0 / q 0,0 0,0 / t 0,0 / c 0,0 0,0 0,0 / s 0,0 0,0
                if (
                    'mlhvqtcs'.indexOf(instruction) > -1 &&
                    data.every(function(i) { return i === 0; })
                ) {
                    return false;
                }

                // M25,25 L25,25 C 25,25 25,25 25,25
                if ('MLHVQTCS'.indexOf(instruction) > -1) {
                    var i = -1,
                        every = data.every(function(d) {
                            return d - prev.point[++i % 2] === 0;
                        });

                    if (every) {
                        return false;
                    }
                }

                // a 25,25 -30 0,1 0,0
                if (
                    'aA'.indexOf(item.instruction) > -1 &&
                    point[0] - prev.point[0] === 0 &&
                    point[1] - prev.point[1] === 0
                ) {
                    return false;
                }

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
                // replace previous H or V data with current
                } else if (instruction === 'H' || instruction === 'V') {
                    prev.item.data[0] = data[0];
                // concat previous data with current
                } else {
                    prev.item.data = prev.item.data.concat(data);
                }

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
 * @param {Number} num input number
 * @param {Number} fixed number of decimals
 *
 * @return {Number} output number
 */
function roundData(data, fixed) {

    return data.map(function(num) {
        return +num.toFixed(fixed);
    });

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
