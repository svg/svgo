'use strict';

var regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
    regPathData = /[-+]?(?:\d*\.\d+|\d+\.?)([eE][-+]?\d+)?/g,
    regNumericValues = /[-+]?(\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/,
    transform2js = require('./_transforms').transform2js,
    transformsMultiply = require('./_transforms').transformsMultiply,
    collections = require('./_collections.js'),
    referencesProps = collections.referencesProps,
    defaultStrokeWidth = collections.attrsGroupsDefaults.presentation['stroke-width'],
    cleanupOutData = require('../lib/svgo/tools').cleanupOutData,
    removeLeadingZero = require('../lib/svgo/tools').removeLeadingZero;

/**
 * Convert path string to JS representation.
 *
 * @param {String} pathString input string
 * @param {Object} params plugin params
 * @return {Array} output array
 */
exports.path2js = function(path) {
    if (path.pathJS) return path.pathJS;

    var paramsLength = { // Number of parameters of every path command
            H: 1, V: 1, M: 2, L: 2, T: 2, Q: 4, S: 4, C: 6, A: 7,
            h: 1, v: 1, m: 2, l: 2, t: 2, q: 4, s: 4, c: 6, a: 7
        },
        pathData = [],   // JS representation of the path data
        instruction, // current instruction context
        startMoveto = false;

    // splitting path string into array like ['M', '10 50', 'L', '20 30']
    path.attr('d').value.split(regPathInstructions).forEach(function(data) {
        if (!data) return;
        if (!startMoveto) {
            if (data == 'M' || data == 'm') {
                startMoveto = true;
            } else return;
        }

        // instruction item
        if (regPathInstructions.test(data)) {
            instruction = data;

            // z - instruction w/o data
            if (instruction == 'Z' || instruction == 'z') {
                pathData.push({
                    instruction: 'z'
                });
            }
        // data item
        } else {
            data = data.match(regPathData);
            if (!data) return;

            data = data.map(Number);

            // Subsequent moveto pairs of coordinates are threated as implicit lineto commands
            // http://www.w3.org/TR/SVG/paths.html#PathDataMovetoCommands
            if (instruction == 'M' || instruction == 'm') {
                pathData.push({
                    instruction: pathData.length == 0 ? 'M' : instruction,
                    data: data.splice(0, 2)
                });
                instruction = instruction == 'M' ? 'L' : 'l';
            }

            for (var pair = paramsLength[instruction]; data.length;) {
                pathData.push({
                    instruction: instruction,
                    data: data.splice(0, pair)
                });
            }
        }
    });

    // First moveto is actually absolute. Subsequent coordinates were separated above.
    if (pathData.length && pathData[0].instruction == 'm') {
        pathData[0].instruction = 'M';
    }
    path.pathJS = pathData;

    return pathData;
};

/**
 * Convert relative Path data to absolute.
 *
 * @param {Array} data input data
 * @return {Array} output data
 */
var relative2absolute = exports.relative2absolute = function(data) {
    var currentPoint = [0, 0],
        subpathPoint = [0, 0],
        i;

    data = data.map(function(item) {

        var instruction = item.instruction,
            itemData = item.data && item.data.slice();

        if (instruction == 'M') {

            set(currentPoint, itemData);
            set(subpathPoint, itemData);

        } else if ('mlcsqt'.indexOf(instruction) > -1) {

            for (i = 0; i < itemData.length; i++) {
                itemData[i] += currentPoint[i % 2];
            }
            set(currentPoint, itemData);

            if (instruction == 'm') {
                set(subpathPoint, itemData);
            }

        } else if (instruction == 'a') {

            itemData[5] += currentPoint[0];
            itemData[6] += currentPoint[1];
            set(currentPoint, itemData);

        } else if (instruction == 'h') {

            itemData[0] += currentPoint[0];
            currentPoint[0] = itemData[0];

        } else if (instruction == 'v') {

            itemData[0] += currentPoint[1];
            currentPoint[1] = itemData[0];

        } else if ('MZLCSQTA'.indexOf(instruction) > -1) {

            set(currentPoint, itemData);

        } else if (instruction == 'H') {

            currentPoint[0] = itemData[0];

        } else if (instruction == 'V') {

            currentPoint[1] = itemData[0];

        } else if (instruction == 'z') {

            set(currentPoint, subpathPoint);

        }

        return instruction == 'z' ?
            { instruction: 'z' } :
            {
                instruction: instruction.toUpperCase(),
                data: itemData
            };

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
    // if there are no 'stroke' attr and references to other objects such as
    // gradiends or clip-path which are also subjects to transform.
    if (!elem.hasAttr('transform') ||
        elem.someAttr(function(attr) {
            return ~referencesProps.indexOf(attr.name) && ~attr.value.indexOf('url(')
        }))
        return path;

    var matrix = transformsMultiply(transform2js(elem.attr('transform').value)),
        splittedMatrix = matrix.splitted || splitMatrix(matrix.data),
        stroke = elem.computedAttr('stroke'),
        newPoint, sx, sy;

    if (stroke && stroke.value != 'none'){
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
        var strokeWidth = elem.computedAttr('stroke-width') || defaultStrokeWidth;

        if (elem.hasAttr('stroke-width')){
          elem.attrs['stroke-width'].value = elem.attrs['stroke-width'].value.trim()
            .replace(regNumericValues, function(num) { return removeLeadingZero(num * sx) });
        } else {
          elem.addAttr({
              name: 'stroke-width',
              prefix: '',
              local: 'stroke-width',
              value: strokeWidth.replace(regNumericValues, function(num) { return removeLeadingZero(num * sx) })
          });
        }
      }
    }

    // If an 'a' command can't be transformed directly, convert path to curves.
    if (!splittedMatrix.isSimple && path.some(function(i) { return i.instruction == 'a' })) {
        var prev;
        path.forEach(function(item, index, path){
            if (item.instruction == 'a') {
                var curves = a2c.apply(0, [0, 0].concat(item.data)),
                    items = [],
                    curveData;
                while ((curveData = curves.splice(0,6)).length) {
                    var base = prev.coords;
                    items.push(prev = {
                        instruction: 'c',
                        data: curveData,
                        coords: [base[0] + item.data[4], base[1] + item.data[5]],
                        base: prev.coords
                    });
                }
                path.splice.apply(path, [index, 1].concat(items));
            } else {
                if (prev) item.base = prev.coords;
                prev = item;
            }
        });
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
                set(pathItem.data, newPoint);
                set(pathItem.coords, newPoint);

                // clear translate() data from transform matrix
                matrix.data[4] = 0;
                matrix.data[5] = 0;

            } else {

                if (pathItem.instruction == 'a') {

                    pathItem.data[0] *= splittedMatrix.scalex;
                    pathItem.data[1] *= splittedMatrix.scaley;
                    pathItem.data[2] += splittedMatrix.rotate;
                    newPoint = transformPoint(matrix.data, pathItem.data[5], pathItem.data[6]);
                    pathItem.data[5] = newPoint[0];
                    pathItem.data[6] = newPoint[1];

                } else {

                    for (var i = 0; i < pathItem.data.length; i += 2) {
                        newPoint = transformPoint(matrix.data, pathItem.data[i], pathItem.data[i + 1]);
                        pathItem.data[i] = newPoint[0];
                        pathItem.data[i + 1] = newPoint[1];
                    }
                }

                pathItem.coords[0] = pathItem.base[0] + pathItem.data[pathItem.data.length - 2];
                pathItem.coords[1] = pathItem.base[1] + pathItem.data[pathItem.data.length - 1];

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
exports.js2path = function(path, data, params) {

    path.pathJS = data;

    if (params.collapseRepeated) {
        data = collapseRepeated(data);
    }

    path.attr('d').value = data.reduce(function(pathString, item) {
        return pathString += item.instruction + (item.data ? cleanupOutData(item.data, params) : '');
    }, '');

};

/**
 * Collapse repeated instructions data
 *
 * @param {Array} path input path data
 * @return {Array} output path data
 */
function collapseRepeated(data) {

    var prev,
        prevIndex;

    // copy an array and modifieds item to keep original data untouched
    data = data.reduce(function(newPath, item) {
        if (
            prev && item.data &&
            item.instruction == prev.instruction
        ) {
            // concat previous data with current
            prev = newPath[prevIndex] = {
                instruction: prev.instruction,
                data: prev.data.concat(item.data),
                coords: item.coords,
                base: prev.base
            }
        } else {
            newPath.push(item);
            prev = item;
            prevIndex = newPath.length - 1;
        }

        return newPath;
    }, []);

    return data;

}

function set(dest, source) {
    dest[0] = source[source.length - 2];
    dest[1] = source[source.length - 1];
    return dest;
}

/* Based on code from Snap.svg (Apache 2 license). http://snapsvg.io/
 * Thanks to Dmitry Baranovskiy for his great work!
 */

function norm(a) {
    return a[0] * a[0] + a[1] * a[1];
}

function normalize(a) {
    var mag = Math.sqrt(norm(a));
    if (a[0]) a[0] /= mag;
    if (a[1]) a[1] /= mag;
}

function deg(rad) {
    return rad * 180 / Math.PI % 360;
}

function determinant(matrix) {
    return matrix[0] * matrix[3] - matrix[1] * matrix[2];
}

/* Splits matrix into primitive transformations
 = (object) in format:
 o dx (number) translation by x
 o dy (number) translation by y
 o scalex (number) scale by x
 o scaley (number) scale by y
 o shear (number) shear
 o rotate (number) rotation in deg
 o isSimple (boolean) could it be represented via simple transformations
 */

function splitMatrix(matrix) {
    var out = {};
    // translation
    out.dx = matrix[4];
    out.dy = matrix[5];
    // scale and shear
    var row = [[matrix[0] , matrix[2] ], [matrix[1] , matrix[3]]];
    out.scalex = Math.sqrt(norm(row[0]));
    normalize(row[0]);
    out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
    row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];
    out.scaley = Math.sqrt(norm(row[1]));
    normalize(row[1]);
    out.shear /= out.scaley;
    if (determinant(matrix) < 0) {
        out.scalex = -out.scalex;
    }
    // rotation
    var sin = -row[0][1],
        cos = row[1][1];
    if (cos < 0) {
        out.rotate = deg(Math.acos(cos));
        if (sin < 0) {
            out.rotate = 360 - out.rotate;
        }
    } else {
        out.rotate = deg(Math.asin(sin));
    }
    out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
    return out;
}

function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
    // for more information of where this Math came from visit:
    // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
    var _120 = Math.PI * 120 / 180,
        rad = Math.PI / 180 * (+angle || 0),
        res = [],
        rotateX = function(x, y, rad) { return x * Math.cos(rad) - y * Math.sin(rad) },
        rotateY = function(x, y, rad) { return x * Math.sin(rad) + y * Math.cos(rad) };
    if (!recursive) {
        x1 = rotateX(x1, y1, -rad);
        y1 = rotateY(x1, y1, -rad);
        x2 = rotateX(x2, y2, -rad);
        y2 = rotateY(x2, y2, -rad);
        var x = (x1 - x2) / 2,
            y = (y1 - y2) / 2;
        var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (h > 1) {
            h = Math.sqrt(h);
            rx = h * rx;
            ry = h * ry;
        }
        var rx2 = rx * rx,
            ry2 = ry * ry,
            k = (large_arc_flag == sweep_flag ? -1 : 1) *
                Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
            cx = k * rx * y / ry + (x1 + x2) / 2,
            cy = k * -ry * x / rx + (y1 + y2) / 2,
            f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
            f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

        f1 = x1 < cx ? Math.PI - f1 : f1;
        f2 = x2 < cx ? Math.PI - f2 : f2;
        f1 < 0 && (f1 = Math.PI * 2 + f1);
        f2 < 0 && (f2 = Math.PI * 2 + f2);
        if (sweep_flag && f1 > f2) {
            f1 = f1 - Math.PI * 2;
        }
        if (!sweep_flag && f2 > f1) {
            f2 = f2 - Math.PI * 2;
        }
    } else {
        f1 = recursive[0];
        f2 = recursive[1];
        cx = recursive[2];
        cy = recursive[3];
    }
    var df = f2 - f1;
    if (Math.abs(df) > _120) {
        var f2old = f2,
            x2old = x2,
            y2old = y2;
        f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
        x2 = cx + rx * Math.cos(f2);
        y2 = cy + ry * Math.sin(f2);
        res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
    }
    df = f2 - f1;
    var c1 = Math.cos(f1),
        s1 = Math.sin(f1),
        c2 = Math.cos(f2),
        s2 = Math.sin(f2),
        t = Math.tan(df / 4),
        hx = 4 / 3 * rx * t,
        hy = 4 / 3 * ry * t,
        m = [
            - hx * s1, hy * c1,
            x2 + hx * s2 - x1, y2 - hy * c2 - y1,
            x2 - x1, y2 - y1
        ];
    if (recursive) {
        return m.concat(res);
    } else {
        res = m.concat(res);
        var newres = [];
        for (var i = 0, n = res.length; i < n; i++) {
            newres[i] = i % 2 ? rotateY(res[i - 1], res[i], rad) : rotateX(res[i], res[i + 1], rad);
        }
        return newres;
    }
}
