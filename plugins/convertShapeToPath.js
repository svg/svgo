import { stringifyPathData } from '../lib/path.js';
import { detachNodeFromParent } from '../lib/xast.js';
import { visit } from '../lib/util/visit.js';
import { elemsGroups } from './_collections.js';

/**
 * @typedef ConvertShapeToPathParams
 * @property {boolean=} convertArcs
 * @property {number=} floatPrecision
 */

export const name = 'convertShapeToPath';
export const description = 'converts basic shapes to more compact path form';

const regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

/**
 * Attributes that are lost when a shape is converted to a path. Animations
 * that change them no longer work after the conversion, so shapes using them
 * must be preserved.
 *
 * @type {Readonly<Record<string, Set<string>>>}
 */
const shapeOnlyAttributes = {
  circle: new Set(['cx', 'cy', 'r']),
  ellipse: new Set(['cx', 'cy', 'rx', 'ry']),
  line: new Set(['x1', 'y1', 'x2', 'y2']),
  polygon: new Set(['points']),
  polyline: new Set(['points']),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'ry']),
};

/**
 * Converts basic shape to more compact path. It also allows further
 * optimizations like combining paths with similar attributes.
 *
 * @see https://www.w3.org/TR/SVG11/shapes.html
 *
 * @author Lev Solntsev
 *
 * @type {import('../lib/types.js').Plugin<ConvertShapeToPathParams>}
 * @since 0.4.3
 */
export const fn = (root, params) => {
  const { convertArcs = false, floatPrecision: precision } = params;

  // collect the attributes that animations change on each element
  /** @type {Map<import('../lib/types.js').XastElement, Set<string>>} */
  const animatedAttrs = new Map();
  /** @type {Map<string, import('../lib/types.js').XastElement>} */
  const elementsById = new Map();
  /** @type {[import('../lib/types.js').XastElement, import('../lib/types.js').XastParent][]} */
  const animations = [];
  visit(root, {
    element: {
      enter: (node, parentNode) => {
        if (node.attributes.id != null) {
          elementsById.set(node.attributes.id, node);
        }
        if (elemsGroups.animation.has(node.name)) {
          animations.push([node, parentNode]);
        }
      },
    },
  });
  for (const [node, parentNode] of animations) {
    const attributeName = node.attributes.attributeName;
    if (attributeName == null) {
      continue;
    }
    const href = node.attributes.href ?? node.attributes['xlink:href'];
    // animation elements target their parent element unless an href points
    // to another element in the same document
    const target = href == null ? parentNode : elementsById.get(href.slice(1));
    if (target == null || target.type !== 'element') {
      continue;
    }
    let attrs = animatedAttrs.get(target);
    if (attrs == null) {
      attrs = new Set();
      animatedAttrs.set(target, attrs);
    }
    attrs.add(attributeName);
  }

  return {
    element: {
      enter: (node, parentNode) => {
        // skip shapes with animations of the attributes that a path does not
        // have, so the animations keep working
        const shapeAttrs = shapeOnlyAttributes[node.name];
        if (shapeAttrs != null) {
          const animated = animatedAttrs.get(node);
          if (animated != null) {
            for (const attributeName of animated) {
              if (shapeAttrs.has(attributeName)) {
                return;
              }
            }
          }
        }

        // convert rect to path
        if (
          node.name === 'rect' &&
          node.attributes.width != null &&
          node.attributes.height != null &&
          node.attributes.rx == null &&
          node.attributes.ry == null
        ) {
          const x = Number(node.attributes.x || '0');
          const y = Number(node.attributes.y || '0');
          const width = Number(node.attributes.width);
          const height = Number(node.attributes.height);
          // Values like '100%' compute to NaN, thus running after
          // cleanupNumericValues when 'px' units has already been removed.
          // TODO: Calculate sizes from % and non-px units if possible.
          if (Number.isNaN(x - y + width - height)) {
            return;
          }
          /** @type {import('../lib/types.js').PathDataItem[]} */
          const pathData = [
            { command: 'M', args: [x, y] },
            { command: 'H', args: [x + width] },
            { command: 'V', args: [y + height] },
            { command: 'H', args: [x] },
            { command: 'z', args: [] },
          ];
          node.name = 'path';
          node.attributes.d = stringifyPathData({ pathData, precision });
          delete node.attributes.x;
          delete node.attributes.y;
          delete node.attributes.width;
          delete node.attributes.height;
        }

        // convert line to path
        if (node.name === 'line') {
          const x1 = Number(node.attributes.x1 || '0');
          const y1 = Number(node.attributes.y1 || '0');
          const x2 = Number(node.attributes.x2 || '0');
          const y2 = Number(node.attributes.y2 || '0');
          if (Number.isNaN(x1 - y1 + x2 - y2)) {
            return;
          }
          /** @type {import('../lib/types.js').PathDataItem[]} */
          const pathData = [
            { command: 'M', args: [x1, y1] },
            { command: 'L', args: [x2, y2] },
          ];
          node.name = 'path';
          node.attributes.d = stringifyPathData({ pathData, precision });
          delete node.attributes.x1;
          delete node.attributes.y1;
          delete node.attributes.x2;
          delete node.attributes.y2;
        }

        // convert polyline and polygon to path
        if (
          (node.name === 'polyline' || node.name === 'polygon') &&
          node.attributes.points != null
        ) {
          const coords = (node.attributes.points.match(regNumber) || []).map(
            Number,
          );
          if (coords.length < 4) {
            detachNodeFromParent(node, parentNode);
            return;
          }
          /** @type {import('../lib/types.js').PathDataItem[]} */
          const pathData = [];
          for (let i = 0; i < coords.length; i += 2) {
            pathData.push({
              command: i === 0 ? 'M' : 'L',
              args: coords.slice(i, i + 2),
            });
          }
          if (node.name === 'polygon') {
            pathData.push({ command: 'z', args: [] });
          }
          node.name = 'path';
          node.attributes.d = stringifyPathData({ pathData, precision });
          delete node.attributes.points;
        }

        //  optionally convert circle
        if (node.name === 'circle' && convertArcs) {
          const cx = Number(node.attributes.cx || '0');
          const cy = Number(node.attributes.cy || '0');
          const r = Number(node.attributes.r || '0');
          if (Number.isNaN(cx - cy + r)) {
            return;
          }
          /** @type {import('../lib/types.js').PathDataItem[]} */
          const pathData = [
            { command: 'M', args: [cx, cy - r] },
            { command: 'A', args: [r, r, 0, 1, 0, cx, cy + r] },
            { command: 'A', args: [r, r, 0, 1, 0, cx, cy - r] },
            { command: 'z', args: [] },
          ];
          node.name = 'path';
          node.attributes.d = stringifyPathData({ pathData, precision });
          delete node.attributes.cx;
          delete node.attributes.cy;
          delete node.attributes.r;
        }

        // optionally convert ellipse
        if (node.name === 'ellipse' && convertArcs) {
          const ecx = Number(node.attributes.cx || '0');
          const ecy = Number(node.attributes.cy || '0');
          const rx = Number(node.attributes.rx || '0');
          const ry = Number(node.attributes.ry || '0');
          if (Number.isNaN(ecx - ecy + rx - ry)) {
            return;
          }
          /** @type {import('../lib/types.js').PathDataItem[]} */
          const pathData = [
            { command: 'M', args: [ecx, ecy - ry] },
            { command: 'A', args: [rx, ry, 0, 1, 0, ecx, ecy + ry] },
            { command: 'A', args: [rx, ry, 0, 1, 0, ecx, ecy - ry] },
            { command: 'z', args: [] },
          ];
          node.name = 'path';
          node.attributes.d = stringifyPathData({ pathData, precision });
          delete node.attributes.cx;
          delete node.attributes.cy;
          delete node.attributes.rx;
          delete node.attributes.ry;
        }
      },
    },
  };
};
