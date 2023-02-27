'use strict';

/**
 * @typedef {import('../lib//types').PathDataItem} PathDataItem
 */

const { collectStylesheet, computeStyle } = require('../lib/style.js');
const { visit } = require('../lib/xast.js');
const { pathElems } = require('./_collections.js');
const { path2js, js2path } = require('./_path.js');
const { findArc } = require('./_arc.js');
const { applyTransforms } = require('./applyTransforms.js');
const { cleanupOutData } = require('../lib/svgo/tools');

exports.name = 'convertPathData';
exports.description =
  'optimizes path data: writes in shorter form, applies transformations';

/**
 * @type {(data: number[]) => number[]}
 */
let roundData;
/**
 * @type {number | false}
 */
let precision;
/**
 * @type {number}
 */
let error;
/**
 * @type {number}
 */
let arcThreshold;
/**
 * @type {number}
 */
let arcTolerance;

/**
 * @typedef {{
 *   applyTransforms: boolean,
 *   applyTransformsStroked: boolean,
 *   makeArcs: {
 *     threshold: number,
 *     tolerance: number,
 *   },
 *   straightCurves: boolean,
 *   lineShorthands: boolean,
 *   curveSmoothShorthands: boolean,
 *   floatPrecision: number | false,
 *   transformPrecision: number,
 *   removeUseless: boolean,
 *   collapseRepeated: boolean,
 *   utilizeAbsolute: boolean,
 *   leadingZero: boolean,
 *   negativeExtraSpace: boolean,
 *   noSpaceAfterFlags: boolean,
 *   forceAbsolutePath: boolean,
 * }} InternalParams
 */

/**
 * @typedef {[number, number]} Point
 */

/**
 * @typedef {{
 *   center: Point,
 *   radius: number
 * }} Circle
 */

/**
 * Convert absolute Path to relative,
 * collapse repeated instructions,
 * detect and convert Lineto shorthands,
 * remove useless instructions like "l0,0",
 * trim useless delimiters and leading zeros,
 * decrease accuracy of floating-point numbers.
 *
 * @see https://www.w3.org/TR/SVG11/paths.html#PathData
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'convertPathData'>}
 */
exports.fn = (root, params) => {
  const {
    // TODO convert to separate plugin in v3
    applyTransforms: _applyTransforms = true,
    applyTransformsStroked = true,
    makeArcs = {
      threshold: 2.5, // coefficient of rounding error
      tolerance: 0.5, // percentage of radius
    },
    straightCurves = true,
    lineShorthands = true,
    curveSmoothShorthands = true,
    floatPrecision = 3,
    transformPrecision = 5,
    removeUseless = true,
    collapseRepeated = true,
    utilizeAbsolute = true,
    leadingZero = true,
    negativeExtraSpace = true,
    noSpaceAfterFlags = false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
    forceAbsolutePath = false,
  } = params;

  /**
   * @type {InternalParams}
   */
  const newParams = {
    applyTransforms: _applyTransforms,
    applyTransformsStroked,
    makeArcs,
    straightCurves,
    lineShorthands,
    curveSmoothShorthands,
    floatPrecision,
    transformPrecision,
    removeUseless,
    collapseRepeated,
    utilizeAbsolute,
    leadingZero,
    negativeExtraSpace,
    noSpaceAfterFlags,
    forceAbsolutePath,
  };

  // invoke applyTransforms plugin
  if (_applyTransforms) {
    visit(
      root,
      // @ts-ignore
      applyTransforms(root, {
        transformPrecision,
        applyTransformsStroked,
      })
    );
  }

  const stylesheet = collectStylesheet(root);
  return {
    element: {
      enter: (node) => {
        if (pathElems.includes(node.name) && node.attributes.d != null) {
          const computedStyle = computeStyle(stylesheet, node);
          precision = floatPrecision;
          error =
            precision !== false
              ? +Math.pow(0.1, precision).toFixed(precision)
              : 1e-2;
          roundData = precision > 0 && precision < 20 ? strongRound : round;
          if (makeArcs) {
            arcThreshold = makeArcs.threshold;
            arcTolerance = makeArcs.tolerance;
          }
          const hasMarkerMid = computedStyle['marker-mid'] != null;

          const maybeHasStroke =
            computedStyle.stroke &&
            (computedStyle.stroke.type === 'dynamic' ||
              computedStyle.stroke.value !== 'none');
          const maybeHasLinecap =
            computedStyle['stroke-linecap'] &&
            (computedStyle['stroke-linecap'].type === 'dynamic' ||
              computedStyle['stroke-linecap'].value !== 'butt');
          const maybeHasStrokeAndLinecap = maybeHasStroke && maybeHasLinecap;

          var data = path2js(node);

          // TODO: get rid of functions returns
          if (data.length) {
            convertToRelative(data);

            data = filters(data, newParams, {
              maybeHasStrokeAndLinecap,
              hasMarkerMid,
            });

            if (utilizeAbsolute) {
              data = convertToMixed(data, newParams);
            }

            // @ts-ignore
            js2path(node, data, newParams);
          }
        }
      },
    },
  };
};

/**
 * Convert absolute path data coordinates to relative.
 *
 * @type {(pathData: PathDataItem[]) => PathDataItem[]}
 */
const convertToRelative = (pathData) => {
  let start = [0, 0];
  let cursor = [0, 0];
  let prevCoords = [0, 0];

  for (let i = 0; i < pathData.length; i += 1) {
    const pathItem = pathData[i];
    let { command, args } = pathItem;

    // moveto (x y)
    if (command === 'm') {
      // update start and cursor
      cursor[0] += args[0];
      cursor[1] += args[1];
      start[0] = cursor[0];
      start[1] = cursor[1];
    }
    if (command === 'M') {
      // M → m
      // skip first moveto
      if (i !== 0) {
        command = 'm';
      }
      args[0] -= cursor[0];
      args[1] -= cursor[1];
      // update start and cursor
      cursor[0] += args[0];
      cursor[1] += args[1];
      start[0] = cursor[0];
      start[1] = cursor[1];
    }

    // lineto (x y)
    if (command === 'l') {
      cursor[0] += args[0];
      cursor[1] += args[1];
    }
    if (command === 'L') {
      // L → l
      command = 'l';
      args[0] -= cursor[0];
      args[1] -= cursor[1];
      cursor[0] += args[0];
      cursor[1] += args[1];
    }

    // horizontal lineto (x)
    if (command === 'h') {
      cursor[0] += args[0];
    }
    if (command === 'H') {
      // H → h
      command = 'h';
      args[0] -= cursor[0];
      cursor[0] += args[0];
    }

    // vertical lineto (y)
    if (command === 'v') {
      cursor[1] += args[0];
    }
    if (command === 'V') {
      // V → v
      command = 'v';
      args[0] -= cursor[1];
      cursor[1] += args[0];
    }

    // curveto (x1 y1 x2 y2 x y)
    if (command === 'c') {
      cursor[0] += args[4];
      cursor[1] += args[5];
    }
    if (command === 'C') {
      // C → c
      command = 'c';
      args[0] -= cursor[0];
      args[1] -= cursor[1];
      args[2] -= cursor[0];
      args[3] -= cursor[1];
      args[4] -= cursor[0];
      args[5] -= cursor[1];
      cursor[0] += args[4];
      cursor[1] += args[5];
    }

    // smooth curveto (x2 y2 x y)
    if (command === 's') {
      cursor[0] += args[2];
      cursor[1] += args[3];
    }
    if (command === 'S') {
      // S → s
      command = 's';
      args[0] -= cursor[0];
      args[1] -= cursor[1];
      args[2] -= cursor[0];
      args[3] -= cursor[1];
      cursor[0] += args[2];
      cursor[1] += args[3];
    }

    // quadratic Bézier curveto (x1 y1 x y)
    if (command === 'q') {
      cursor[0] += args[2];
      cursor[1] += args[3];
    }
    if (command === 'Q') {
      // Q → q
      command = 'q';
      args[0] -= cursor[0];
      args[1] -= cursor[1];
      args[2] -= cursor[0];
      args[3] -= cursor[1];
      cursor[0] += args[2];
      cursor[1] += args[3];
    }

    // smooth quadratic Bézier curveto (x y)
    if (command === 't') {
      cursor[0] += args[0];
      cursor[1] += args[1];
    }
    if (command === 'T') {
      // T → t
      command = 't';
      args[0] -= cursor[0];
      args[1] -= cursor[1];
      cursor[0] += args[0];
      cursor[1] += args[1];
    }

    // elliptical arc (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
    if (command === 'a') {
      cursor[0] += args[5];
      cursor[1] += args[6];
    }
    if (command === 'A') {
      // A → a
      command = 'a';
      args[5] -= cursor[0];
      args[6] -= cursor[1];
      cursor[0] += args[5];
      cursor[1] += args[6];
    }

    // closepath
    if (command === 'Z' || command === 'z') {
      // reset cursor
      cursor[0] = start[0];
      cursor[1] = start[1];
    }

    pathItem.command = command;
    pathItem.args = args;
    // store absolute coordinates for later use
    // base should preserve reference from other element
    // @ts-ignore
    pathItem.base = prevCoords;
    // @ts-ignore
    pathItem.coords = [cursor[0], cursor[1]];
    // @ts-ignore
    prevCoords = pathItem.coords;
  }

  return pathData;
};

/**
 * Main filters loop.
 *
 * @type {(
 *   path: PathDataItem[],
 *   params: InternalParams,
 *   aux: { maybeHasStrokeAndLinecap: boolean, hasMarkerMid: boolean }
 * ) => PathDataItem[]}
 */
function filters(path, params, { maybeHasStrokeAndLinecap, hasMarkerMid }) {
  var stringify = data2Path.bind(null, params),
    relSubpoint = [0, 0],
    pathBase = [0, 0],
    prev = {};

  path = path.filter(function (item, index, path) {
    let command = item.command;
    let data = item.args;
    let next = path[index + 1];

    if (command !== 'Z' && command !== 'z') {
      var sdata = data,
        arc;

      if (command === 's') {
        sdata = [0, 0].concat(data);

        // @ts-ignore
        var pdata = prev.args,
          n = pdata.length;

        // (-x, -y) of the prev tangent point relative to the current point
        sdata[0] = pdata[n - 2] - pdata[n - 4];
        sdata[1] = pdata[n - 1] - pdata[n - 3];
      }

      // convert curves to arcs if possible
      if (
        (params.makeArcs,
        // @ts-ignore
        (arc = findArc(prev.coords, item, {
          error,
          arcThreshold,
          arcTolerance,
        })))
      ) {
        var j, nextArc;
        for (
          j = index;
          // @ts-ignore
          path[j++] &&
          // @ts-ignore
          (nextArc = findArc(arc.item.coords, path[j - 1], {
            error,
            arcThreshold,
            arcTolerance,
          })) &&
          nextArc;

        ) {
          // TODO: if (nextArc is full circle) break;
          // TODO: if (nextArc center is outside of tolerance) break;
          // @ts-ignore
          arc.item.coords = nextArc.item.coords;
          // @ts-ignore
          arc.item.args[5] = arc.item.coords[0] - arc.item.base[0];
          // @ts-ignore
          arc.item.args[6] = arc.item.coords[1] - arc.item.base[1];
        }

        // TODO check that stringify is shorter
        command = 'a';
        data = arc.item.args;
        // @ts-ignore
        item.coords = arc.item.coords;
        // filter out consumed next items
        path.splice(index + 1, j);
      }

      // Rounding relative coordinates, taking in account accummulating error
      // to get closer to absolute coordinates. Sum of rounded value remains same:
      // l .25 3 .25 2 .25 3 .25 2 -> l .3 3 .2 2 .3 3 .2 2
      if (precision !== false) {
        if (
          command === 'm' ||
          command === 'l' ||
          command === 't' ||
          command === 'q' ||
          command === 's' ||
          command === 'c'
        ) {
          for (var i = data.length; i--; ) {
            // @ts-ignore
            data[i] += item.base[i % 2] - relSubpoint[i % 2];
          }
        } else if (command == 'h') {
          // @ts-ignore
          data[0] += item.base[0] - relSubpoint[0];
        } else if (command == 'v') {
          // @ts-ignore
          data[0] += item.base[1] - relSubpoint[1];
        } else if (command == 'a') {
          // @ts-ignore
          data[5] += item.base[0] - relSubpoint[0];
          // @ts-ignore
          data[6] += item.base[1] - relSubpoint[1];
        }
        roundData(data);

        if (command == 'h') relSubpoint[0] += data[0];
        else if (command == 'v') relSubpoint[1] += data[0];
        else {
          relSubpoint[0] += data[data.length - 2];
          relSubpoint[1] += data[data.length - 1];
        }
        roundData(relSubpoint);

        if (command === 'M' || command === 'm') {
          pathBase[0] = relSubpoint[0];
          pathBase[1] = relSubpoint[1];
        }
      }

      // convert straight curves into lines segments
      if (params.straightCurves) {
        if (
          (command === 'c' && isCurveStraightLine(data)) ||
          (command === 's' && isCurveStraightLine(sdata))
        ) {
          if (next && next.command == 's') makeLonghand(next, data); // fix up next curve
          command = 'l';
          data = data.slice(-2);
        } else if (command === 'q' && isCurveStraightLine(data)) {
          if (next && next.command == 't') makeLonghand(next, data); // fix up next curve
          command = 'l';
          data = data.slice(-2);
        } else if (
          command === 't' &&
          // @ts-ignore
          prev.command !== 'q' &&
          // @ts-ignore
          prev.command !== 't'
        ) {
          command = 'l';
          data = data.slice(-2);
        } else if (command === 'a' && (data[0] === 0 || data[1] === 0)) {
          command = 'l';
          data = data.slice(-2);
        }
      }

      // horizontal and vertical line shorthands
      // l 50 0 → h 50
      // l 0 50 → v 50
      if (params.lineShorthands && command === 'l') {
        if (data[1] === 0) {
          command = 'h';
          data.pop();
        } else if (data[0] === 0) {
          command = 'v';
          data.shift();
        }
      }

      // collapse repeated commands
      // h 20 h 30 -> h 50
      if (
        params.collapseRepeated &&
        hasMarkerMid === false &&
        (command === 'm' || command === 'h' || command === 'v') &&
        // @ts-ignore
        prev.command &&
        // @ts-ignore
        command == prev.command.toLowerCase() &&
        ((command != 'h' && command != 'v') ||
          // @ts-ignore
          prev.args[0] >= 0 == data[0] >= 0)
      ) {
        // @ts-ignore
        prev.args[0] += data[0];
        if (command != 'h' && command != 'v') {
          // @ts-ignore
          prev.args[1] += data[1];
        }
        // @ts-ignore
        prev.coords = item.coords;
        // @ts-ignore
        path[index] = prev;
        return false;
      }

      // convert curves into smooth shorthands
      // @ts-ignore
      if (params.curveSmoothShorthands && prev.command) {
        // curveto
        if (command === 'c') {
          // c + c → c + s
          if (
            // @ts-ignore
            prev.command === 'c' &&
            // @ts-ignore
            data[0] === -(prev.args[2] - prev.args[4]) &&
            // @ts-ignore
            data[1] === -(prev.args[3] - prev.args[5])
          ) {
            command = 's';
            data = data.slice(2);
          }

          // s + c → s + s
          else if (
            // @ts-ignore
            prev.command === 's' &&
            // @ts-ignore
            data[0] === -(prev.args[0] - prev.args[2]) &&
            // @ts-ignore
            data[1] === -(prev.args[1] - prev.args[3])
          ) {
            command = 's';
            data = data.slice(2);
          }

          // [^cs] + c → [^cs] + s
          else if (
            // @ts-ignore
            prev.command !== 'c' &&
            // @ts-ignore
            prev.command !== 's' &&
            data[0] === 0 &&
            data[1] === 0
          ) {
            command = 's';
            data = data.slice(2);
          }
        }

        // quadratic Bézier curveto
        else if (command === 'q') {
          // q + q → q + t
          if (
            // @ts-ignore
            prev.command === 'q' &&
            // @ts-ignore
            data[0] === prev.args[2] - prev.args[0] &&
            // @ts-ignore
            data[1] === prev.args[3] - prev.args[1]
          ) {
            command = 't';
            data = data.slice(2);
          }

          // t + q → t + t
          else if (
            // @ts-ignore
            prev.command === 't' &&
            // @ts-ignore
            data[2] === prev.args[0] &&
            // @ts-ignore
            data[3] === prev.args[1]
          ) {
            command = 't';
            data = data.slice(2);
          }
        }
      }

      // remove useless non-first path segments
      if (params.removeUseless && !maybeHasStrokeAndLinecap) {
        // l 0,0 / h 0 / v 0 / q 0,0 0,0 / t 0,0 / c 0,0 0,0 0,0 / s 0,0 0,0
        if (
          (command === 'l' ||
            command === 'h' ||
            command === 'v' ||
            command === 'q' ||
            command === 't' ||
            command === 'c' ||
            command === 's') &&
          data.every(function (i) {
            return i === 0;
          })
        ) {
          // @ts-ignore
          path[index] = prev;
          return false;
        }

        // a 25,25 -30 0,1 0,0
        if (command === 'a' && data[5] === 0 && data[6] === 0) {
          // @ts-ignore
          path[index] = prev;
          return false;
        }
      }

      item.command = command;
      item.args = data;

      prev = item;
    } else {
      // z resets coordinates
      relSubpoint[0] = pathBase[0];
      relSubpoint[1] = pathBase[1];
      // @ts-ignore
      if (prev.command === 'Z' || prev.command === 'z') return false;
      prev = item;
    }

    return true;
  });

  return path;
}

/**
 * Writes data in shortest form using absolute or relative coordinates.
 *
 * @type {(path: PathDataItem[], params: InternalParams) => PathDataItem[]}
 */
function convertToMixed(path, params) {
  var prev = path[0];

  path = path.filter(function (item, index) {
    if (index == 0) return true;
    if (item.command === 'Z' || item.command === 'z') {
      prev = item;
      return true;
    }

    var command = item.command,
      data = item.args,
      adata = data.slice();

    if (
      command === 'm' ||
      command === 'l' ||
      command === 't' ||
      command === 'q' ||
      command === 's' ||
      command === 'c'
    ) {
      for (var i = adata.length; i--; ) {
        // @ts-ignore
        adata[i] += item.base[i % 2];
      }
    } else if (command == 'h') {
      // @ts-ignore
      adata[0] += item.base[0];
    } else if (command == 'v') {
      // @ts-ignore
      adata[0] += item.base[1];
    } else if (command == 'a') {
      // @ts-ignore
      adata[5] += item.base[0];
      // @ts-ignore
      adata[6] += item.base[1];
    }

    roundData(adata);

    var absoluteDataStr = cleanupOutData(adata, params),
      relativeDataStr = cleanupOutData(data, params);

    // Convert to absolute coordinates if it's shorter or forceAbsolutePath is true.
    // v-20 -> V0
    // Don't convert if it fits following previous command.
    // l20 30-10-50 instead of l20 30L20 30
    if (
      params.forceAbsolutePath ||
      (absoluteDataStr.length < relativeDataStr.length &&
        !(
          params.negativeExtraSpace &&
          command == prev.command &&
          prev.command.charCodeAt(0) > 96 &&
          absoluteDataStr.length == relativeDataStr.length - 1 &&
          (data[0] < 0 ||
            // @ts-ignore
            (/^0\./.test(data[0]) && prev.args[prev.args.length - 1] % 1))
        ))
    ) {
      // @ts-ignore
      item.command = command.toUpperCase();
      item.args = adata;
    }

    prev = item;

    return true;
  });

  return path;
}

/**
 * Does the same as `Number.prototype.toFixed` but without casting
 * the return value to a string.
 * @type {(num: number, precision: number) => number}
 */
function toFixed(num, precision) {
  const pow = 10 ** precision;
  return Math.round(num * pow) / pow;
}

/**
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 * Smart rounds values like 2.3491 to 2.35 instead of 2.349.
 * Doesn't apply "smartness" if the number precision fits already.
 *
 * @type {(data: number[]) => number[]}
 */
function strongRound(data) {
  const precisionNum = precision || 0;
  for (let i = data.length; i-- > 0; ) {
    const fixed = toFixed(data[i], precisionNum);
    if (fixed !== data[i]) {
      const rounded = toFixed(data[i], precisionNum - 1);
      data[i] =
        toFixed(Math.abs(rounded - data[i]), precisionNum + 1) >= error
          ? fixed
          : rounded;
    }
  }
  return data;
}

/**
 * Simple rounding function if precision is 0.
 *
 * @type {(data: number[]) => number[]}
 */
function round(data) {
  for (var i = data.length; i-- > 0; ) {
    data[i] = Math.round(data[i]);
  }
  return data;
}

/**
 * Checks if a curve is a straight line by measuring distance
 * from middle points to the line formed by end points.
 *
 * @type {(data: number[]) => boolean}
 */

function isCurveStraightLine(data) {
  // Get line equation a·x + b·y + c = 0 coefficients a, b (c = 0) by start and end points.
  var i = data.length - 2,
    a = -data[i + 1], // y1 − y2 (y1 = 0)
    b = data[i], // x2 − x1 (x1 = 0)
    d = 1 / (a * a + b * b); // same part for all points

  if (i <= 1 || !isFinite(d)) return false; // curve that ends at start point isn't the case

  // Distance from point (x0, y0) to the line is sqrt((c − a·x0 − b·y0)² / (a² + b²))
  while ((i -= 2) >= 0) {
    if (Math.sqrt(Math.pow(a * data[i] + b * data[i + 1], 2) * d) > error)
      return false;
  }

  return true;
}

/**
 * Converts next curve from shorthand to full form using the current curve data.
 *
 * @type {(item: PathDataItem, data: number[]) => PathDataItem}
 */

function makeLonghand(item, data) {
  switch (item.command) {
    case 's':
      item.command = 'c';
      break;
    case 't':
      item.command = 'q';
      break;
  }
  item.args.unshift(
    data[data.length - 2] - data[data.length - 4],
    data[data.length - 1] - data[data.length - 3]
  );
  return item;
}

/**
 * Converts given path data to string.
 *
 * @type {(params: InternalParams, pathData: PathDataItem[]) => string}
 */

function data2Path(params, pathData) {
  return pathData.reduce(function (pathString, item) {
    var strData = '';
    if (item.args) {
      strData = cleanupOutData(roundData(item.args.slice()), params);
    }
    return pathString + item.command + strData;
  }, '');
}
