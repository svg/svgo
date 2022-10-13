// vim: tabstop=2 softtabstop=2 shiftwidth=2 expandtab

export const name  'simplifyPaths';
export const type = 'visitor';
export const active = true;
export const description = 'Simplify (approximate) paths using Paper.js';

// simplifyThreshold: the allowed maximum error when fitting the curves through
// the segment points
// Set it to null to disable simplification
// http://paperjs.org/reference/path/#simplify
export const params = {
  floatPrecision: 2,
  path: {
    simplifyThreshold: 2.5,
  },
  polyline: {
    transform: true, // Whether to convert <polyline> into <path>
    simplifyThreshold: 2.5,
  },
};

const svgToString = (floatPrecision, path) => {
  return path.exportSVG({ precision: floatPrecision }).attributes.d.value;
};

const simplify = (threshold, floatPrecision, path) => {
  const original = svgToString(floatPrecision, path);

  if (threshold === null) {
    return original;
  }

  path.simplify(threshold);

  const simplified = svgToString(floatPrecision, path);

  return simplified.length < original.length ? simplified : original;
};

/**
 * Simplify paths using Paper.js
 * Convert <polyline> to <path> and simplify that too
 *
 * @see http://paperjs.org/reference/path/#simplify
 *
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Marcel Robitaille
 */
export const fn = (_root, params) => {
  let paper;
  try {
    paper = require('paper');
  } catch {
    console.error(
      'The `simplifyPaths` plugin requires `paper` to be installed.'
    );
    return false;
  }

  paper.setup();

  const polylineParams = {
    ...exports.params.polyline,
    ...params.polyline,
  };
  const pathParams = {
    ...exports.params.path,
    ...params.path,
  };
  const floatPrecision = params.floatPrecision ?? exports.params.floatPrecision;

  return {
    element: {
      enter: (node) => {
        if (node.name === 'polyline' && polylineParams.transform) {
          const points = node.attributes.points
            .trim()
            .split(' ')
            .map((p) => p.split(',').map((x) => parseFloat(x)))
            .map(([x, y]) => new paper.Point(x, y));
          const path = new paper.Path(points);

          // Convert the polyline to a path
          node.name = 'path';
          delete node.attributes['points'];

          node.attributes.d = simplify(
            polylineParams.simplifyThreshold,
            floatPrecision,
            path
          );
        } else if (node.name === 'path') {
          const path = new paper.Path(node.attributes.d);
          node.attributes.d = simplify(
            pathParams.simplifyThreshold,
            floatPrecision,
            path
          );
        }
      },
    },
  };
};
