'use strict';

var regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
    regPathData = /[\-+]?\d*\.?\d+([eE][\-+]?\d+)?/g,
    transform2js = require('./_transforms').transform2js,
    transformsMultiply = require('./_transforms').transformsMultiply,
    cleanupOutData = require('../lib/svgo/tools').cleanupOutData;

/**
 * Convert path string to JS representation.
 *
 * @param {String} pathString input string
 * @param {Object} params plugin params
 * @return {Array} output array
 */
exports.path2js = function(pathString) {

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

};

/**
 * Convert relative Path data to absolute.
 *
 * @param {Array} data input data
 * @return {Array} output data
 */
exports.relative2absolute = function(data) {

    var currentPoint = [0, 0],
        subpathPoint = [0, 0],
        i;

    data.forEach(function(item) {

        if (item.instruction === 'M') {

            currentPoint = item.data.slice(-2);
            subpathPoint = item.data.slice(-2);

        } else if ('mlcsqta'.indexOf(item.instruction) > -1) {

            for (i = 0; i < item.data.length; i++) {
                if (i % 2 === 0) {
                    item.data[i] += currentPoint[0];
                } else {
                    item.data[i] += currentPoint[1];
                }

                if (i > 0) {
                    var index = i + 1;

                    if ('mlt'.indexOf(item.instruction) > -1 && index % 2 === 0) {
                        currentPoint[0] = item.data[i - 1];
                        currentPoint[1] = item.data[i];
                    } else if ('qs'.indexOf(item.instruction) > -1 && index % 4 === 0) {
                        currentPoint[0] = item.data[i - 1];
                        currentPoint[1] = item.data[i];
                    } else if (item.instruction === 'c' && index % 6 === 0) {
                        currentPoint[0] = item.data[i - 1];
                        currentPoint[1] = item.data[i];
                    } else if (item.instruction === 'a' && index % 7 === 0) {
                        currentPoint[0] = item.data[i - 1];
                        currentPoint[1] = item.data[i];
                    }
                }
            }

            if (item.instruction === 'm') {
                subpathPoint = item.data.slice(-2);
            }

        } else if (item.instruction === 'h') {

            for (i = 0; i < item.data.length; i++) {
                item.data[i] += currentPoint[0];
            }

            currentPoint[0] = item.data[item.data.length - 1];

        } else if (item.instruction === 'v') {

            for (i = 0; i < item.data.length; i++) {
                item.data[i] += currentPoint[1];
            }

            currentPoint[1] = item.data[item.data.length - 1];

        } else {

            currentPoint = subpathPoint;

        }

        item.instruction = item.instruction.toUpperCase();

    });

    return data;

};

/**
 * Apply transformation(s) to the Path data.
 *
 * @param {Object} elem current element
 * @param {Array} path input path data
 * @param {Boolean} applyTransformsStroked whether to apply transforms to stroked lines.
 * @param {Number} floatPrecision precision (used for stroke width)
 * @return {Array} output path data
 */
exports.applyTransforms = function(elem, path, applyTransformsStroked, floatPrecision) {
    // if there are no 'stroke' attr and 'a' segments
    if (
        !elem.hasAttr('transform') ||
        !path.every(function(i) { return i.instruction !== 'a'; })
    ) {
      return path;
    }
    var matrix = transformsMultiply(transform2js(elem.attr('transform').value)),
          newPoint, sx, sy, strokeWidth;

    if (elem.hasAttr('stroke') || elem.hasAttr('stroke-width')){
      if (!applyTransformsStroked){
        return path;
      }
      if (matrix.name == 'matrix'){
        sx = +Math.sqrt(matrix.data[0] * matrix.data[0] + matrix.data[1] * matrix.data[1]).toFixed(floatPrecision);
        sy = +Math.sqrt(matrix.data[2] * matrix.data[2] + matrix.data[3] * matrix.data[3]).toFixed(floatPrecision);
      } else if (matrix.name == 'scale'){
        sx = +matrix.data[0].toFixed(floatPrecision);
        sy = +matrix.data[1].toFixed(floatPrecision);
      } else {
        sx = 1;
        sy = 1;
      }

      if (sx !== sy){
        return path;
      }
      if (sx !== 1){
        if (elem.hasAttr('stroke-width')){
          elem.attrs['stroke-width'].value = elem.attrs['stroke-width'].value * sx;
        } else {
          elem.addAttr({
              name: 'stroke-width',
              prefix: '',
              local: 'stroke-width',
              value: sx
          });
        }
      }
    }

    path.forEach(function(pathItem) {

        if (pathItem.data) {

            // h -> l
            if (pathItem.instruction === 'h') {

                pathItem.instruction = 'l';
                pathItem.data[1] = 0;

            // v -> l
            } else if (pathItem.instruction === 'v') {

                pathItem.instruction = 'l';
                pathItem.data[1] = pathItem.data[0];
                pathItem.data[0] = 0;

            }

            // if there is a translate() transform
            if (pathItem.instruction === 'M' &&
                (matrix.data[4] !== 0 ||
                matrix.data[5] !== 0)
            ) {

                // then apply it only to the first absoluted M
                newPoint = transformPoint(matrix.data, pathItem.data[0], pathItem.data[1]);
                pathItem.data[0] = pathItem.coords[0] = newPoint[0];
                pathItem.data[1] = pathItem.coords[1] = newPoint[1];

                // clear translate() data from transform matrix
                matrix.data[4] = 0;
                matrix.data[5] = 0;

            } else {

                for (var i = 0; i < pathItem.data.length; i += 2) {
                    newPoint = transformPoint(matrix.data, pathItem.data[i], pathItem.data[i + 1]);
                    pathItem.data[i] = newPoint[0];
                    pathItem.data[i + 1] = newPoint[1];
                }

                pathItem.coords[0] = pathItem.base[0] + pathItem.data[pathItem.data.length - 2]
                pathItem.coords[1] = pathItem.base[1] + pathItem.data[pathItem.data.length - 1]

            }

        }

    });

    // remove transform attr
    elem.removeAttr('transform');

    return path;

};

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
 * Compute Cubic Bézie bounding box.
 *
 * @see http://processingjs.nihongoresources.com/bezierinfo/
 *
 * @param {Float} xa
 * @param {Float} ya
 * @param {Float} xb
 * @param {Float} yb
 * @param {Float} xc
 * @param {Float} yc
 * @param {Float} xd
 * @param {Float} yd
 *
 * @return {Object}
 */
exports.computeCubicBoundingBox = function(xa, ya, xb, yb, xc, yc, xd, yd) {

    var minx = Number.POSITIVE_INFINITY,
        miny = Number.POSITIVE_INFINITY,
        maxx = Number.NEGATIVE_INFINITY,
        maxy = Number.NEGATIVE_INFINITY,
        ts,
        t,
        x,
        y,
        i;

    // X
    if (xa < minx) { minx = xa; }
    if (xa > maxx) { maxx = xa; }
    if (xd < minx) { minx= xd; }
    if (xd > maxx) { maxx = xd; }

    ts = computeCubicFirstDerivativeRoots(xa, xb, xc, xd);

    for (i = 0; i < ts.length; i++) {

        t = ts[i];

        if (t >= 0 && t <= 1) {
            x = computeCubicBaseValue(t, xa, xb, xc, xd);
            // y = computeCubicBaseValue(t, ya, yb, yc, yd);

            if (x < minx) { minx = x; }
            if (x > maxx) { maxx = x; }
        }

    }

    // Y
    if (ya < miny) { miny = ya; }
    if (ya > maxy) { maxy = ya; }
    if (yd < miny) { miny = yd; }
    if (yd > maxy) { maxy = yd; }

    ts = computeCubicFirstDerivativeRoots(ya, yb, yc, yd);

    for (i = 0; i < ts.length; i++) {

        t = ts[i];

        if (t >= 0 && t <= 1) {
            // x = computeCubicBaseValue(t, xa, xb, xc, xd);
            y = computeCubicBaseValue(t, ya, yb, yc, yd);

            if (y < miny) { miny = y; }
            if (y > maxy) { maxy = y; }
        }

    }

    return {
        minx: minx,
        miny: miny,
        maxx: maxx,
        maxy: maxy
    };

};

// compute the value for the cubic bezier function at time=t
function computeCubicBaseValue(t, a, b, c, d) {

    var mt = 1 - t;

    return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;

}

// compute the value for the first derivative of the cubic bezier function at time=t
function computeCubicFirstDerivativeRoots(a, b, c, d) {

    var result = [-1, -1],
        tl = -a + 2 * b - c,
        tr = -Math.sqrt(-a * (c - d) + b * b - b * (c + d) + c * c),
        dn = -a + 3 * b - 3 * c + d;

    if (dn !== 0) {
        result[0] = (tl + tr) / dn;
        result[1] = (tl - tr) / dn;
    }

    return result;

}

/**
 * Compute Quadratic Bézier bounding box.
 *
 * @see http://processingjs.nihongoresources.com/bezierinfo/
 *
 * @param {Float} xa
 * @param {Float} ya
 * @param {Float} xb
 * @param {Float} yb
 * @param {Float} xc
 * @param {Float} yc
 *
 * @return {Object}
 */
exports.computeQuadraticBoundingBox = function(xa, ya, xb, yb, xc, yc) {

    var minx = Number.POSITIVE_INFINITY,
        miny = Number.POSITIVE_INFINITY,
        maxx = Number.NEGATIVE_INFINITY,
        maxy = Number.NEGATIVE_INFINITY,
        t,
        x,
        y;

    // X
    if (xa < minx) { minx = xa; }
    if (xa > maxx) { maxx = xa; }
    if (xc < minx) { minx = xc; }
    if (xc > maxx) { maxx = xc; }

    t = computeQuadraticFirstDerivativeRoot(xa, xb, xc);

    if (t >= 0 && t <= 1) {
        x = computeQuadraticBaseValue(t, xa, xb, xc);
        // y = computeQuadraticBaseValue(t, ya, yb, yc);

        if (x < minx) { minx = x; }
        if (x > maxx) { maxx = x; }
    }

    // Y
    if (ya < miny) { miny = ya; }
    if (ya > maxy) { maxy = ya; }
    if (yc < miny) { miny = yc; }
    if (yc > maxy) { maxy = yc; }

    t = computeQuadraticFirstDerivativeRoot(ya, yb, yc);

    if (t >= 0 && t <=1 ) {
        // x = computeQuadraticBaseValue(t, xa, xb, xc);
        y = computeQuadraticBaseValue(t, ya, yb, yc);

        if (y < miny) { miny = y; }
        if (y > maxy) { maxy = y ; }

    }

    return {
        minx: minx,
        miny: miny,
        maxx: maxx,
        maxy: maxy
    };

};

// compute the value for the quadratic bezier function at time=t
function computeQuadraticBaseValue(t, a, b, c) {

    var mt = 1 - t;

    return mt * mt * a + 2 * mt * t * b + t * t * c;

}

// compute the value for the first derivative of the quadratic bezier function at time=t
function computeQuadraticFirstDerivativeRoot(a, b, c) {

    var t = -1,
        denominator = a - 2 * b + c;

    if (denominator !== 0) {
        t = (a - b) / denominator;
    }

    return t;

}

/**
 * Convert path array to string.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {String} output path string
 */
exports.js2path = function(path, params) {

        // output path data string
    var pathString = '';

    path.forEach(function(item) {

        pathString += item.instruction + (item.data ? cleanupOutData(item.data, params) : '');

    });

    return pathString;

};
