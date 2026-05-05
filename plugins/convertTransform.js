import {
  js2transform,
  matrixToTransform,
  roundTransform,
  transform2js,
  transformsMultiply,
} from './_transforms.js';

/**
 * @typedef ConvertTransformParams
 * @property {boolean=} convertToShorts
 * @property {number=} degPrecision
 * @property {number=} floatPrecision
 * @property {number=} transformPrecision
 * @property {boolean=} matrixToTransform
 * @property {boolean=} shortTranslate
 * @property {boolean=} shortScale
 * @property {boolean=} shortRotate
 * @property {boolean=} removeUseless
 * @property {boolean=} collapseIntoOne
 * @property {boolean=} leadingZero
 * @property {boolean=} negativeExtraSpace
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
 * @typedef TransformItem
 * @property {string} name
 * @property {number[]} data
 */

export const name = 'convertTransform';
export const description =
  'collapses multiple transformations and optimizes it';

/**
 * Convert matrices to the short aliases,
 * convert long translate, scale or rotate transform notations to the shorts ones,
 * convert transforms to the matrices and multiply them all into one,
 * remove useless transforms.
 *
 * @see https://www.w3.org/TR/SVG11/coords.html#TransformMatrixDefined
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin<ConvertTransformParams>}
 */
export const fn = (_root, params) => {
  const {
    convertToShorts = true,
    // degPrecision = 3, // transformPrecision (or matrix precision) - 2 by default
    degPrecision,
    floatPrecision = 3,
    transformPrecision = 5,
    matrixToTransform = true,
    shortTranslate = true,
    shortScale = true,
    shortRotate = true,
    removeUseless = true,
    collapseIntoOne = true,
    leadingZero = true,
    negativeExtraSpace = false,
  } = params;
  const newParams = {
    convertToShorts,
    degPrecision,
    floatPrecision,
    transformPrecision,
    matrixToTransform,
    shortTranslate,
    shortScale,
    shortRotate,
    removeUseless,
    collapseIntoOne,
    leadingZero,
    negativeExtraSpace,
  };
  return {
    element: {
      enter: (node) => {
        if (node.attributes.transform != null) {
          convertTransform(node, 'transform', newParams);
        }

        if (node.attributes.gradientTransform != null) {
          convertTransform(node, 'gradientTransform', newParams);
        }

        if (node.attributes.patternTransform != null) {
          convertTransform(node, 'patternTransform', newParams);
        }
      },
    },
  };
};

/**
 * @param {import('../lib/types.js').XastElement} item
 * @param {string} attrName
 * @param {TransformParams} params
 */
const convertTransform = (item, attrName, params) => {
  let data = transform2js(item.attributes[attrName]);
  params = definePrecision(data, params);

  if (params.collapseIntoOne && data.length > 1) {
    data = [transformsMultiply(data)];
  }

  if (params.convertToShorts) {
    data = convertToShorts(data, params);
  } else {
    data.forEach((item) => roundTransform(item, params));
  }

  if (params.removeUseless) {
    data = removeUseless(data);
  }

  if (data.length) {
    item.attributes[attrName] = js2transform(data, params);
  } else {
    delete item.attributes[attrName];
  }
};

/**
 * Defines precision to work with certain parts.
 *
 * - `transformPrecision` - for scale and four first matrix parameters (needs a better precision due to multiplying).
 * - `floatPrecision` - for translate including two last matrix and rotate parameters.
 * - `degPrecision` - for rotate and skew. By default it's equal to (roughly).
 * - `transformPrecision` - 2 or floatPrecision whichever is lower. Can be set in params.
 *
 * Clone parameters so that it doesn't affect other element transformations.
 *
 * @param {ReadonlyArray<TransformItem>} data
 * @param {TransformParams} param1
 * @returns {TransformParams}
 */
const definePrecision = (data, { ...newParams }) => {
  const matrixData = [];
  for (const item of data) {
    if (item.name == 'matrix') {
      matrixData.push(...item.data.slice(0, 4));
    }
  }
  let numberOfDigits = newParams.transformPrecision;
  // Limit transform precision with matrix one. Calculating with larger precision doesn't add any value.
  if (matrixData.length) {
    newParams.transformPrecision = Math.min(
      newParams.transformPrecision,
      Math.max.apply(Math, matrixData.map(floatDigits)) ||
        newParams.transformPrecision,
    );
    numberOfDigits = Math.max.apply(
      Math,
      matrixData.map(
        (n) => n.toString().replace(/\D+/g, '').length, // Number of digits in a number. 123.45 → 5
      ),
    );
  }
  // No sense in angle precision more than number of significant digits in matrix.
  if (newParams.degPrecision == null) {
    newParams.degPrecision = Math.max(
      0,
      Math.min(newParams.floatPrecision, numberOfDigits - 2),
    );
  }
  return newParams;
};

/**
 * Returns number of digits after the point.
 *
 * @example 0.125 → 3
 * @param {number} n
 * @returns {number}
 */
const floatDigits = (n) => {
  const str = n.toString();
  return str.slice(str.indexOf('.')).length - 1;
};

/**
 * Convert transforms to the shorthand alternatives.
 *
 * @param {TransformItem[]} transforms
 * @param {TransformParams} params
 * @returns {TransformItem[]}
 */
const convertToShorts = (transforms, params) => {
  for (let i = 0; i < transforms.length; i++) {
    let transform = transforms[i];

    // convert matrix to the short aliases
    if (params.matrixToTransform && transform.name === 'matrix') {
      const decomposed = matrixToTransform(transform, params);
      if (
        js2transform(decomposed, params).length <=
        js2transform([transform], params).length
      ) {
        transforms.splice(i, 1, ...decomposed);
      }
      transform = transforms[i];
    }

    // fixed-point numbers
    // 12.754997 → 12.755
    roundTransform(transform, params);

    // convert long translate transform notation to the shorts one
    // translate(10 0) → translate(10)
    if (
      params.shortTranslate &&
      transform.name === 'translate' &&
      transform.data.length === 2 &&
      !transform.data[1]
    ) {
      transform.data.pop();
    }

    // convert long scale transform notation to the shorts one
    // scale(2 2) → scale(2)
    if (
      params.shortScale &&
      transform.name === 'scale' &&
      transform.data.length === 2 &&
      transform.data[0] === transform.data[1]
    ) {
      transform.data.pop();
    }

    // convert long rotate transform notation to the short one
    // translate(cx cy) rotate(a) translate(-cx -cy) → rotate(a cx cy)
    if (
      params.shortRotate &&
      transforms[i - 2]?.name === 'translate' &&
      transforms[i - 1].name === 'rotate' &&
      transforms[i].name === 'translate' &&
      transforms[i - 2].data[0] === -transforms[i].data[0] &&
      transforms[i - 2].data[1] === -transforms[i].data[1]
    ) {
      transforms.splice(i - 2, 3, {
        name: 'rotate',
        data: [
          transforms[i - 1].data[0],
          transforms[i - 2].data[0],
          transforms[i - 2].data[1],
        ],
      });

      // splice compensation
      i -= 2;
    }
  }

  return transforms;
};

/**
 * Remove useless transforms.
 *
 * @param {ReadonlyArray<TransformItem>} transforms
 * @returns {TransformItem[]}
 */
const removeUseless = (transforms) => {
  return transforms.filter((transform) => {
    // translate(0), rotate(0[, cx, cy]), skewX(0), skewY(0)
    if (
      (['translate', 'rotate', 'skewX', 'skewY'].indexOf(transform.name) > -1 &&
        (transform.data.length == 1 || transform.name == 'rotate') &&
        !transform.data[0]) ||
      // translate(0, 0)
      (transform.name == 'translate' &&
        !transform.data[0] &&
        !transform.data[1]) ||
      // scale(1)
      (transform.name == 'scale' &&
        transform.data[0] == 1 &&
        (transform.data.length < 2 || transform.data[1] == 1)) ||
      // matrix(1 0 0 1 0 0)
      (transform.name == 'matrix' &&
        transform.data[0] == 1 &&
        transform.data[3] == 1 &&
        !(
          transform.data[1] ||
          transform.data[2] ||
          transform.data[4] ||
          transform.data[5]
        ))
    ) {
      return false;
    }

    return true;
  });
};
