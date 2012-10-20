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

        if (params.convertToRelative) {
            data = convertToRelative(data, params);
        }

        if (params.removeUseless) {
            data = removeUseless(data);
        }

        if (params.collapseRepeated) {
            data = collapseRepeated(data);
        }

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
 * @param {Object} item input array
 *
 * @return {Object} output array
 */
function convertToRelative(path, params) {

    var point = [0, 0];

    path.forEach(function(item) {

        var instruction = item.instruction,
            data = item.data;

        if (data) {

            // already relative
            // recalculate current point
            if ('mcslqta'.indexOf(instruction) > -1) {
                var newPoint = data.slice(-2);
                // x
                point[0] += newPoint[0];
                // y
                point[1] += newPoint[1];
            }

            if (instruction === 'h') {
                // x
                point[0] += data[data.length - 1];
            }

            if (instruction === 'v') {
                // y
                point[1] += data[data.length - 1];
            }

            // absolute
            // M → m
            // L → l
            // T → t
            if ('MLT'.indexOf(instruction) > -1) {
                instruction = instruction.toLowerCase();

                // x y
                // 0 1
                // for(i = 0; i < data.length; i += 2) {
                    data[0] -= point[0];
                    data[1] -= point[1];

                    point[0] += data[0];
                    point[1] += data[1];
                // }
            }

            // C → c
            if (instruction === 'C') {
                instruction = 'c';

                // x1 y1 x2 y2 x y
                // 0  1  2  3  4 5
                // for(i = 0; i < data.length; i += 6) {
                    data[0] -= point[0];
                    data[1] -= point[1];
                    data[2] -= point[0];
                    data[3] -= point[1];
                    data[4] -= point[0];
                    data[5] -= point[1];

                    point[0] += data[4];
                    point[1] += data[5];
                // }
            }

            // S → s
            // Q → q
            if ('SQ'.indexOf(instruction) > -1) {
                instruction = instruction.toLowerCase();

                // x1 y1 x y
                // 0  1  2 3
                // for(i = 0; i < data.length; i += 4) {
                    data[0] -= point[0];
                    data[1] -= point[1];
                    data[2] -= point[0];
                    data[3] -= point[1];

                    point[0] += data[2];
                    point[1] += data[3];
                // }
            }

            // A → a
            if (instruction === 'A') {
                instruction = 'a';

                // rx ry x-axis-rotation large-arc-flag sweep-flag x y
                // 0  1  2               3              4          5 6
                // for(i = 0; i < data.length; i += 7) {
                    data[0] -= point[0];
                    data[1] -= point[1];
                    data[5] -= point[0];
                    data[6] -= point[1];

                    point[0] += data[5];
                    point[1] += data[6];
                // }
            }

            // H → h
            if (instruction === 'H') {
                instruction = 'h';

                // for(i = 0; i < data.length; i++) {
                    data[0] -= point[0];

                    point[0] += data[0];
                // }
            }

            // V → v
            if (instruction === 'V') {
                instruction = 'v';

                // for(i = 0; i < data.length; i++) {
                    data[0] -= point[1];

                    point[1] += data[0];
                // }
            }

            // horizontal and vertical line shorthands
            // l 50 0 → h 50
            // l 0 50 → v 50
            if (params.lineShorthands && instruction === 'l') {
                if (data[1] === 0) {
                    instruction = 'h';
                    data = [data[0]];
                } else if (data[0] === 0) {
                    instruction = 'v';
                    data = [data[1]];
                }
            }

            // fixed-point numbers
            // 12.754997 → 12.755
            if (params.floatPrecision) {
                data = data.map(function(num) {
                    return +num.toFixed(params.floatPrecision);
                });
            }

            item.instruction = instruction;
            item.data = data;

        }

    });

    return path;

}

/**
 * Remove useless path segments.
 *
 * @param {Array} path input array
 *
 * @return {Array} output array
 */
function removeUseless(path) {

    return path.filter(function(item) {

        // m 0,0 / l 0,0 / h 0 / v 0 / q 0,0 0,0 / t 0,0 / c 0,0 0,0 0,0 / s 0,0 0,0
        if (
            'mMlLhHvVqQtTcCsS'.indexOf(item.instruction) > -1 &&
            item.data.every(function(i) { return i === 0; })
        ) {
            return false;
        // a 25,25 -30 0,1 0,0
        } else if (
            'aA'.indexOf(item.instruction) > -1 &&
            item.data[5] === 0 &&
            item.data[6] === 0
        ) {
            return false;
        }

        return true;

    });

}

/**
 * Collapse repeated instructions data.
 *
 * @param {Array} items input array
 *
 * @return {Array} output array
 */
function collapseRepeated(items) {

    var prev;

    return items.filter(function(item) {

        if (prev && item.instruction === prev.instruction) {
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

}

/**
 * Convert path JS representation to string.
 *
 * @param {Array} pathJS JS representation array
 * @param {Object} params plugin params
 *
 * @return {String} output string
 */
function js2path(pathJS, params) {

        // out path data string
    var pathString = '';

    pathJS.forEach(function(path) {

        pathString += path.instruction + (path.data ? cleanupOutData(path.data, params) : '');

    });

    return pathString;

}
