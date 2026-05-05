import { cleanupOutData, toFixed } from '../lib/svgo/tools.js';

/**
 * @typedef TransformItem
 * @property {string} name
 * @property {number[]} data
 *
 * @typedef TransformParams
 * @property {boolean} convertToShorts
 * @property {number=} degPrecision
 * @property {number} floatPrecision
 * @property {number} transformPrecision
 * @property {boolean} matrixToTransform
 * @property {boolean} shortTranslate
 * @property {boolean} shortScale
 * @property {boolean} shortRotate
 * @property {boolean} removeUseless
 * @property {boolean} collapseIntoOne
 * @property {boolean} leadingZero
 * @property {boolean} negativeExtraSpace
 *
 */

const transformTypes = new Set([
  'matrix',
  'rotate',
  'scale',
  'skewX',
  'skewY',
  'translate',
]);

const regTransformSplit =
  /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
const regNumericValues = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

/**
 * Convert transform string to JS representation.
 *
 * @param {string} transformString
 * @returns {TransformItem[]} Object representation of transform, or an empty array if it was malformed.
 */
export const transform2js = (transformString) => {
  /** @type {TransformItem[]} */
  const transforms = [];
  /** @type {?TransformItem} */
  let currentTransform = null;

  // split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate', '-45', '']
  for (const item of transformString.split(regTransformSplit)) {
    if (!item) {
      continue;
    }

    if (transformTypes.has(item)) {
      currentTransform = { name: item, data: [] };
      transforms.push(currentTransform);
    } else {
      let num;
      // then split it into [10, 50] and collect as context.data
      while ((num = regNumericValues.exec(item))) {
        num = Number(num);
        if (currentTransform != null) {
          currentTransform.data.push(num);
        }
      }
    }
  }

  return currentTransform == null || currentTransform.data.length == 0
    ? []
    : transforms;
};
/**
 * Multiply transforms into one.
 *
 * @param {ReadonlyArray<TransformItem>} transforms
 * @returns {TransformItem}
 */
export const transformsMultiply = (transforms) => {
  const matrixData = transforms.map((transform) => {
    if (transform.name === 'matrix') {
      return transform.data;
    }
    return transformToMatrix(transform);
  });

  const matrixTransform = {
    name: 'matrix',
    data:
      matrixData.length > 0 ? matrixData.reduce(multiplyTransformMatrices) : [],
  };

  return matrixTransform;
};

/**
 * Math utilities in radians.
 */
const mth = {
  /**
   * @param {number} deg
   * @returns {number}
   */
  rad: (deg) => {
    return (deg * Math.PI) / 180;
  },

  /**
   * @param {number} rad
   * @returns {number}
   */
  deg: (rad) => {
    return (rad * 180) / Math.PI;
  },

  /**
   * @param {number} deg
   * @returns {number}
   */
  cos: (deg) => {
    return Math.cos(mth.rad(deg));
  },

  /**
   * @param {number} val
   * @param {number} floatPrecision
   * @returns {number}
   */
  acos: (val, floatPrecision) => {
    return toFixed(mth.deg(Math.acos(val)), floatPrecision);
  },

  /**
   * @param {number} deg
   * @returns {number}
   */
  sin: (deg) => {
    return Math.sin(mth.rad(deg));
  },

  /**
   * @param {number} val
   * @param {number} floatPrecision
   * @returns {number}
   */
  asin: (val, floatPrecision) => {
    return toFixed(mth.deg(Math.asin(val)), floatPrecision);
  },

  /**
   * @param {number} deg
   * @returns {number}
   */
  tan: (deg) => {
    return Math.tan(mth.rad(deg));
  },

  /**
   * @param {number} val
   * @param {number} floatPrecision
   * @returns {number}
   */
  atan: (val, floatPrecision) => {
    return toFixed(mth.deg(Math.atan(val)), floatPrecision);
  },
};

/**
 * @param {TransformItem} matrix
 * @returns {TransformItem[][]}
 */
const getDecompositions = (matrix) => {
  const decompositions = [];
  const qrab = decomposeQRAB(matrix);
  const qrcd = decomposeQRCD(matrix);

  if (qrab) {
    decompositions.push(qrab);
  }
  if (qrcd) {
    decompositions.push(qrcd);
  }
  return decompositions;
};

/**
 * @param {TransformItem} matrix
 * @returns {TransformItem[] | undefined}
 * @see {@link https://frederic-wang.fr/2013/12/01/decomposition-of-2d-transform-matrices/} Where applicable, variables are named in accordance with this document.
 */
const decomposeQRAB = (matrix) => {
  const data = matrix.data;

  const [a, b, c, d, e, f] = data;
  const delta = a * d - b * c;
  if (delta === 0) {
    return;
  }
  const r = Math.hypot(a, b);

  if (r === 0) {
    return;
  }

  const decomposition = [];
  const cosOfRotationAngle = a / r;

  // [..., ..., ..., ..., tx, ty] → translate(tx, ty)
  if (e || f) {
    decomposition.push({
      name: 'translate',
      data: [e, f],
    });
  }

  if (cosOfRotationAngle !== 1) {
    const rotationAngleRads = Math.acos(cosOfRotationAngle);
    decomposition.push({
      name: 'rotate',
      data: [mth.deg(b < 0 ? -rotationAngleRads : rotationAngleRads), 0, 0],
    });
  }

  const sx = r;
  const sy = delta / sx;
  if (sx !== 1 || sy !== 1) {
    decomposition.push({ name: 'scale', data: [sx, sy] });
  }

  const ac_plus_bd = a * c + b * d;
  if (ac_plus_bd) {
    decomposition.push({
      name: 'skewX',
      data: [mth.deg(Math.atan(ac_plus_bd / (a * a + b * b)))],
    });
  }

  return decomposition;
};

/**
 * @param {TransformItem} matrix
 * @returns {TransformItem[] | undefined}
 * @see {@link https://frederic-wang.fr/2013/12/01/decomposition-of-2d-transform-matrices/} Where applicable, variables are named in accordance with this document.
 */
const decomposeQRCD = (matrix) => {
  const data = matrix.data;

  const [a, b, c, d, e, f] = data;
  const delta = a * d - b * c;
  if (delta === 0) {
    return;
  }
  const s = Math.hypot(c, d);
  if (s === 0) {
    return;
  }

  const decomposition = [];

  if (e || f) {
    decomposition.push({
      name: 'translate',
      data: [e, f],
    });
  }

  const rotationAngleRads = Math.PI / 2 - (d < 0 ? -1 : 1) * Math.acos(-c / s);
  decomposition.push({
    name: 'rotate',
    data: [mth.deg(rotationAngleRads), 0, 0],
  });

  const sx = delta / s;
  const sy = s;
  if (sx !== 1 || sy !== 1) {
    decomposition.push({ name: 'scale', data: [sx, sy] });
  }

  const ac_plus_bd = a * c + b * d;
  if (ac_plus_bd) {
    decomposition.push({
      name: 'skewY',
      data: [mth.deg(Math.atan(ac_plus_bd / (c * c + d * d)))],
    });
  }

  return decomposition;
};

/**
 * Convert translate(tx,ty)rotate(a) to rotate(a,cx,cy).
 * @param {number} tx
 * @param {number} ty
 * @param {number} a
 * @returns {TransformItem}
 */
const mergeTranslateAndRotate = (tx, ty, a) => {
  // From https://www.w3.org/TR/SVG11/coords.html#TransformAttribute:
  // We have translate(tx,ty) rotate(a). This is equivalent to [cos(a) sin(a) -sin(a) cos(a) tx ty].
  //
  // rotate(a,cx,cy) is equivalent to translate(cx, cy) rotate(a) translate(-cx, -cy).
  // Multiplying the right side gives the matrix
  //   [cos(a) sin(a) -sin(a) cos(a)
  //   -cx * cos(a) + cy * sin(a) + cx
  //   -cx * sin(a) - cy * cos(a) + cy
  // ]
  //
  // We need cx and cy such that
  //   tx = -cx * cos(a) + cy * sin(a) + cx
  //   ty = -cx * sin(a) - cy * cos(a) + cy
  //
  // Solving these for cx and cy gives
  //   cy = (d * ty + e * tx)/(d^2 + e^2)
  //   cx = (tx - e * cy) / d
  // where d = 1 - cos(a) and e = sin(a)

  const rotationAngleRads = mth.rad(a);
  const d = 1 - Math.cos(rotationAngleRads);
  const e = Math.sin(rotationAngleRads);
  const cy = (d * ty + e * tx) / (d * d + e * e);
  const cx = (tx - e * cy) / d;
  return { name: 'rotate', data: [a, cx, cy] };
};

/**
 * @param {TransformItem} t
 * @returns {Boolean}
 */
const isIdentityTransform = (t) => {
  switch (t.name) {
    case 'rotate':
    case 'skewX':
    case 'skewY':
      return t.data[0] === 0;
    case 'scale':
      return t.data[0] === 1 && t.data[1] === 1;
    case 'translate':
      return t.data[0] === 0 && t.data[1] === 0;
  }
  return false;
};

/**
 * Optimize matrix of simple transforms.
 * @param {ReadonlyArray<TransformItem>} roundedTransforms
 * @param {ReadonlyArray<TransformItem>} rawTransforms
 * @returns {TransformItem[]}
 */
const optimize = (roundedTransforms, rawTransforms) => {
  const optimizedTransforms = [];

  for (let index = 0; index < roundedTransforms.length; index++) {
    const roundedTransform = roundedTransforms[index];

    // Don't include any identity transforms.
    if (isIdentityTransform(roundedTransform)) {
      continue;
    }
    const data = roundedTransform.data;
    switch (roundedTransform.name) {
      case 'rotate':
        switch (data[0]) {
          case 180:
          case -180:
            {
              // If the next element is a scale, invert it, and don't add the rotate to the optimized array.
              const next = roundedTransforms[index + 1];
              if (next && next.name === 'scale') {
                optimizedTransforms.push(
                  createScaleTransform(next.data.map((v) => -v)),
                );
                index++;
              } else {
                // Otherwise replace the rotate with a scale(-1).
                optimizedTransforms.push({
                  name: 'scale',
                  data: [-1],
                });
              }
            }
            continue;
        }
        optimizedTransforms.push({
          name: 'rotate',
          data: data.slice(0, data[1] || data[2] ? 3 : 1),
        });
        break;

      case 'scale':
        optimizedTransforms.push(createScaleTransform(data));
        break;

      case 'skewX':
      case 'skewY':
        optimizedTransforms.push({
          name: roundedTransform.name,
          data: [data[0]],
        });
        break;

      case 'translate':
        {
          // If the next item is a rotate(a,0,0), merge the translate and rotate.
          // If the rotation angle is +/-180, assume it will be optimized out, and don't do the merge.
          const next = roundedTransforms[index + 1];
          if (
            next &&
            next.name === 'rotate' &&
            next.data[0] !== 180 &&
            next.data[0] !== -180 &&
            next.data[0] !== 0 &&
            next.data[1] === 0 &&
            next.data[2] === 0
          ) {
            // Use the un-rounded data to do the merge.
            const data = rawTransforms[index].data;
            optimizedTransforms.push(
              mergeTranslateAndRotate(
                data[0],
                data[1],
                rawTransforms[index + 1].data[0],
              ),
            );
            // Skip over the rotate.
            index++;
            continue;
          }
        }
        optimizedTransforms.push({
          name: 'translate',
          data: data.slice(0, data[1] ? 2 : 1),
        });
        break;
    }
  }

  // If everything was optimized out, return identity transform scale(1).
  return optimizedTransforms.length
    ? optimizedTransforms
    : [{ name: 'scale', data: [1] }];
};

/**
 * @param {ReadonlyArray<number>} data
 * @returns {TransformItem}
 */
const createScaleTransform = (data) => {
  const scaleData = data.slice(0, data[0] === data[1] ? 1 : 2);
  return {
    name: 'scale',
    data: scaleData,
  };
};

/**
 * Decompose matrix into simple transforms and optimize.
 * @param {TransformItem} origMatrix
 * @param {TransformParams} params
 * @returns {TransformItem[]}
 */
export const matrixToTransform = (origMatrix, params) => {
  const decomposed = getDecompositions(origMatrix);

  let shortest;
  let shortestLen = Number.MAX_VALUE;

  for (const decomposition of decomposed) {
    // Make a copy of the decomposed matrix, and round all data. We need to keep the original decomposition,
    // at full precision, to perform some optimizations.
    const roundedTransforms = decomposition.map((transformItem) => {
      const transformCopy = {
        name: transformItem.name,
        data: [...transformItem.data],
      };
      return roundTransform(transformCopy, params);
    });

    const optimized = optimize(roundedTransforms, decomposition);
    const len = js2transform(optimized, params).length;
    if (len < shortestLen) {
      shortest = optimized;
      shortestLen = len;
    }
  }

  return shortest ?? [origMatrix];
};

/**
 * Convert transform to the matrix data.
 *
 * @param {TransformItem} transform
 * @returns {number[]}
 */
const transformToMatrix = (transform) => {
  if (transform.name === 'matrix') {
    return transform.data;
  }
  switch (transform.name) {
    case 'translate':
      // [1, 0, 0, 1, tx, ty]
      return [1, 0, 0, 1, transform.data[0], transform.data[1] || 0];
    case 'scale':
      // [sx, 0, 0, sy, 0, 0]
      return [
        transform.data[0],
        0,
        0,
        transform.data[1] ?? transform.data[0],
        0,
        0,
      ];
    case 'rotate':
      // [cos(a), sin(a), -sin(a), cos(a), x, y]
      var cos = mth.cos(transform.data[0]);
      var sin = mth.sin(transform.data[0]);
      var cx = transform.data[1] || 0;
      var cy = transform.data[2] || 0;
      return [
        cos,
        sin,
        -sin,
        cos,
        (1 - cos) * cx + sin * cy,
        (1 - cos) * cy - sin * cx,
      ];
    case 'skewX':
      // [1, 0, tan(a), 1, 0, 0]
      return [1, 0, mth.tan(transform.data[0]), 1, 0, 0];
    case 'skewY':
      // [1, tan(a), 0, 1, 0, 0]
      return [1, mth.tan(transform.data[0]), 0, 1, 0, 0];
    default:
      throw Error(`Unknown transform ${transform.name}`);
  }
};

/**
 * Applies transformation to an arc. To do so, we represent ellipse as a matrix,
 * multiply it by the transformation matrix and use a singular value
 * decomposition to represent in a form rotate(θ)·scale(a b)·rotate(φ). This
 * gives us new ellipse params a, b and θ. SVD is being done with the formulae
 * provided by Wolfram|Alpha (svd {{m0, m2}, {m1, m3}})
 *
 * @param {[number, number]} cursor
 * @param {number[]} arc
 * @param {ReadonlyArray<number>} transform
 * @returns {number[]}
 */
export const transformArc = (cursor, arc, transform) => {
  const x = arc[5] - cursor[0];
  const y = arc[6] - cursor[1];
  let a = arc[0];
  let b = arc[1];
  const rot = (arc[2] * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  // skip if radius is 0
  if (a > 0 && b > 0) {
    let h =
      Math.pow(x * cos + y * sin, 2) / (4 * a * a) +
      Math.pow(y * cos - x * sin, 2) / (4 * b * b);
    if (h > 1) {
      h = Math.sqrt(h);
      a *= h;
      b *= h;
    }
  }
  const ellipse = [a * cos, a * sin, -b * sin, b * cos, 0, 0];
  const m = multiplyTransformMatrices(transform, ellipse);
  // Decompose the new ellipse matrix
  const lastCol = m[2] * m[2] + m[3] * m[3];
  const squareSum = m[0] * m[0] + m[1] * m[1] + lastCol;
  const root =
    Math.hypot(m[0] - m[3], m[1] + m[2]) * Math.hypot(m[0] + m[3], m[1] - m[2]);

  if (!root) {
    // circle
    arc[0] = arc[1] = Math.sqrt(squareSum / 2);
    arc[2] = 0;
  } else {
    const majorAxisSqr = (squareSum + root) / 2;
    const minorAxisSqr = (squareSum - root) / 2;
    const major = Math.abs(majorAxisSqr - lastCol) > 1e-6;
    const sub = (major ? majorAxisSqr : minorAxisSqr) - lastCol;
    const rowsSum = m[0] * m[2] + m[1] * m[3];
    const term1 = m[0] * sub + m[2] * rowsSum;
    const term2 = m[1] * sub + m[3] * rowsSum;
    arc[0] = Math.sqrt(majorAxisSqr);
    arc[1] = Math.sqrt(minorAxisSqr);
    arc[2] =
      (((major ? term2 < 0 : term1 > 0) ? -1 : 1) *
        Math.acos((major ? term1 : term2) / Math.hypot(term1, term2)) *
        180) /
      Math.PI;
  }

  if (transform[0] < 0 !== transform[3] < 0) {
    // Flip the sweep flag if coordinates are being flipped horizontally XOR vertically
    arc[4] = 1 - arc[4];
  }

  return arc;
};

/**
 * Multiply transformation matrices.
 *
 * @param {ReadonlyArray<number>} a
 * @param {ReadonlyArray<number>} b
 * @returns {number[]}
 */
const multiplyTransformMatrices = (a, b) => {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
};

/**
 * @param {TransformItem} transform
 * @param {TransformParams} params
 * @returns {TransformItem}
 */
export const roundTransform = (transform, params) => {
  switch (transform.name) {
    case 'translate':
      transform.data = floatRound(transform.data, params);
      break;
    case 'rotate':
      transform.data = [
        ...degRound(transform.data.slice(0, 1), params),
        ...floatRound(transform.data.slice(1), params),
      ];
      break;
    case 'skewX':
    case 'skewY':
      transform.data = degRound(transform.data, params);
      break;
    case 'scale':
      transform.data = transformRound(transform.data, params);
      break;
    case 'matrix':
      transform.data = [
        ...transformRound(transform.data.slice(0, 4), params),
        ...floatRound(transform.data.slice(4), params),
      ];
      break;
  }
  return transform;
};

/**
 * @param {number[]} data
 * @param {TransformParams} params
 * @returns {number[]}
 */
const degRound = (data, params) => {
  if (
    params.degPrecision != null &&
    params.degPrecision >= 1 &&
    params.floatPrecision < 20
  ) {
    return smartRound(params.degPrecision, data);
  } else {
    return round(data);
  }
};

/**
 * @param {number[]} data
 * @param {TransformParams} params
 * @returns {number[]}
 */
const floatRound = (data, params) => {
  if (params.floatPrecision >= 1 && params.floatPrecision < 20) {
    return smartRound(params.floatPrecision, data);
  } else {
    return round(data);
  }
};

/**
 * @param {number[]} data
 * @param {TransformParams} params
 * @returns {number[]}
 */
const transformRound = (data, params) => {
  if (params.transformPrecision >= 1 && params.floatPrecision < 20) {
    return smartRound(params.transformPrecision, data);
  } else {
    return round(data);
  }
};

/**
 * Rounds numbers in array.
 *
 * @param {ReadonlyArray<number>} data
 * @returns {number[]}
 */
const round = (data) => {
  return data.map(Math.round);
};

/**
 * Decrease accuracy of floating-point numbers in transforms keeping a specified
 * number of decimals. Smart rounds values like 2.349 to 2.35.
 *
 * @param {number} precision
 * @param {number[]} data
 * @returns {number[]}
 */
const smartRound = (precision, data) => {
  for (
    let i = data.length,
      tolerance = +Math.pow(0.1, precision).toFixed(precision);
    i--;

  ) {
    if (toFixed(data[i], precision) !== data[i]) {
      const rounded = +data[i].toFixed(precision - 1);
      data[i] =
        +Math.abs(rounded - data[i]).toFixed(precision + 1) >= tolerance
          ? +data[i].toFixed(precision)
          : rounded;
    }
  }

  return data;
};

/**
 * Convert transforms JS representation to string.
 *
 * @param {ReadonlyArray<TransformItem>} transformJS
 * @param {TransformParams} params
 * @returns {string}
 */
export const js2transform = (transformJS, params) => {
  const transformString = transformJS
    .map((transform) => {
      roundTransform(transform, params);
      return `${transform.name}(${cleanupOutData(transform.data, params)})`;
    })
    .join('');

  return transformString;
};
