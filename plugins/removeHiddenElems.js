import { elemsGroups } from './_collections.js';
import {
  visit,
  visitSkip,
  querySelector,
  detachNodeFromParent,
} from '../lib/xast.js';
import { collectStylesheet, computeStyle } from '../lib/style.js';
import { parsePathData } from '../lib/path.js';
import { hasScripts, findReferences } from '../lib/svgo/tools.js';

/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 * @typedef {import('../lib/types.js').XastChild} XastChild
 * @typedef {import('../lib/types.js').XastElement} XastElement
 * @typedef {import('../lib/types.js').XastParent} XastParent
 */

const nonRendering = elemsGroups.nonRendering;

export const name = 'removeHiddenElems';
export const description =
  'removes hidden elements (zero sized, with absent attributes)';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  properties: {
    isHidden: {
      title: 'Is Hidden',
      description:
        'Removes elements where [`visibility`](https://developer.mozilla.org/docs/Web/SVG/Attribute/visibility) is `hidden`, unless a child element has `visibility` set to `visible`.',
      type: 'boolean',
      default: true,
    },
    displayNone: {
      title: 'Display None',
      description:
        'Removes elements where [`display`](https://developer.mozilla.org/docs/Web/SVG/Attribute/display) is `none`.',
      type: 'boolean',
      default: true,
    },
    opacity0: {
      title: 'Opacity 0',
      description:
        'Removes element where [`opacity`](https://developer.mozilla.org/docs/Web/SVG/Attribute/opacity) is `0`.',
      type: 'boolean',
      default: true,
    },
    circleR0: {
      title: 'Circle [r=0]',
      description:
        'Removes [`<circle>`](https://developer.mozilla.org/docs/Web/SVG/Element/circle) elements with a [radius](https://developer.mozilla.org/docs/Web/SVG/Attribute/r) of `0`.',
      type: 'boolean',
      default: true,
    },
    ellipseRX0: {
      title: 'Ellipse [rx=0]',
      description:
        'Removes [`<ellipse>`](https://developer.mozilla.org/docs/Web/SVG/Element/ellipse) elements where [`rx`](https://developer.mozilla.org/docs/Web/SVG/Attribute/rx) is `0`.',
      type: 'boolean',
      default: true,
    },
    ellipseRY0: {
      title: 'Ellipse [ry=0]',
      description:
        'Removes [`<ellipse>`](https://developer.mozilla.org/docs/Web/SVG/Element/ellipse) elements where [`ry`](https://developer.mozilla.org/docs/Web/SVG/Attribute/ry) is `0`.',
      type: 'boolean',
      default: true,
    },
    rectWidth0: {
      title: 'Rect [width=0]',
      description:
        'Removes [`<rect>`](https://developer.mozilla.org/docs/Web/SVG/Element/rect) elements where [`width`](https://developer.mozilla.org/docs/Web/SVG/Attribute/width) is `0`.',
      type: 'boolean',
      default: true,
    },
    rectHeight0: {
      title: 'Rect [height=0]',
      description:
        'Removes [`<rect>`](https://developer.mozilla.org/docs/Web/SVG/Element/rect) elements where [`height`](https://developer.mozilla.org/docs/Web/SVG/Attribute/height) is `0`.',
      type: 'boolean',
      default: true,
    },
    patternWidth0: {
      title: 'Pattern [width=0]',
      description:
        'Removes [`<pattern>`](https://developer.mozilla.org/docs/Web/SVG/Element/pattern) elements where [`width`](https://developer.mozilla.org/docs/Web/SVG/Attribute/width) is `0`.',
      type: 'boolean',
      default: true,
    },
    patternHeight0: {
      title: 'Pattern [height=0]',
      description:
        'Removes [`<pattern>`](https://developer.mozilla.org/docs/Web/SVG/Element/pattern) elements where [`height`](https://developer.mozilla.org/docs/Web/SVG/Attribute/width) is `0`.',
      type: 'boolean',
      default: true,
    },
    imageWidth0: {
      title: 'Image [width=0]',
      description:
        'Removes [`<image>`](https://developer.mozilla.org/docs/Web/SVG/Element/image) elements where [`width`](https://developer.mozilla.org/docs/Web/SVG/Attribute/width) is `0`.',
      type: 'boolean',
      default: true,
    },
    imageHeight0: {
      title: 'Image [height=0]',
      description:
        'Removes [`<image>`](https://developer.mozilla.org/docs/Web/SVG/Element/image) elements where [`height`](https://developer.mozilla.org/docs/Web/SVG/Attribute/width) is `0`.',
      type: 'boolean',
      default: true,
    },
    pathEmptyD: {
      title: 'Path Empty d',
      description:
        'Remove [`<path>`](https://developer.mozilla.org/docs/Web/SVG/Element/path) elements where [`d`](https://developer.mozilla.org/docs/Web/SVG/Attribute/d) is not set or empty. Does not apply for single point paths associated with a [`marker`](https://developer.mozilla.org/docs/Web/SVG/Element/marker).',
      type: 'boolean',
      default: true,
    },
    polylineEmptyPoints: {
      title: 'Polyline Empty Points',
      description:
        'Removes [`<polyline>`](https://developer.mozilla.org/docs/Web/SVG/Element/polyline) elements with no [points](https://developer.mozilla.org/docs/Web/SVG/Attribute/points) defined.',
      type: 'boolean',
      default: true,
    },
    polygonEmptyPoints: {
      title: 'Polygon Empty Points',
      description:
        'Removes [`<polygon>`](https://developer.mozilla.org/docs/Web/SVG/Element/polygon) elements with no [points](https://developer.mozilla.org/docs/Web/SVG/Attribute/points) defined.',
      type: 'boolean',
      default: true,
    },
  },
};

/**
 * Remove hidden elements with disabled rendering:
 * - display="none"
 * - opacity="0"
 * - circle with zero radius
 * - ellipse with zero x-axis or y-axis radius
 * - rectangle with zero width or height
 * - pattern with zero width or height
 * - image with zero width or height
 * - path with empty data
 * - polyline with empty points
 * - polygon with empty points
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types.js').Plugin<'removeHiddenElems'>}
 */
export const fn = (root, params) => {
  const {
    isHidden = true,
    displayNone = true,
    opacity0 = true,
    circleR0 = true,
    ellipseRX0 = true,
    ellipseRY0 = true,
    rectWidth0 = true,
    rectHeight0 = true,
    patternWidth0 = true,
    patternHeight0 = true,
    imageWidth0 = true,
    imageHeight0 = true,
    pathEmptyD = true,
    polylineEmptyPoints = true,
    polygonEmptyPoints = true,
  } = params;
  const stylesheet = collectStylesheet(root);

  /**
   * Skip non-rendered nodes initially, and only detach if they have no ID, or
   * their ID is not referenced by another node.
   *
   * @type {Map<XastElement, XastParent>}
   */
  const nonRenderedNodes = new Map();

  /**
   * IDs for removed hidden definitions.
   *
   * @type {Set<string>}
   */
  const removedDefIds = new Set();

  /**
   * @type {Map<XastElement, XastParent>}
   */
  const allDefs = new Map();

  /** @type {Set<string>} */
  const allReferences = new Set();

  /**
   * @type {Map<string, Array<{ node: XastElement, parentNode: XastParent }>>}
   */
  const referencesById = new Map();

  /**
   * If styles are present, we can't be sure if a definition is unused or not
   */
  let deoptimized = false;

  /**
   * Nodes can't be removed if they or any of their children have an id attribute that is referenced.
   * @param {XastElement} node
   * @returns boolean
   */
  function canRemoveNonRenderingNode(node) {
    if (allReferences.has(node.attributes.id)) {
      return false;
    }
    for (const child of node.children) {
      if (child.type === 'element' && !canRemoveNonRenderingNode(child)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {XastChild} node
   * @param {XastParent} parentNode
   */
  function removeElement(node, parentNode) {
    if (
      node.type === 'element' &&
      node.attributes.id != null &&
      parentNode.type === 'element' &&
      parentNode.name === 'defs'
    ) {
      removedDefIds.add(node.attributes.id);
    }

    detachNodeFromParent(node, parentNode);
  }

  visit(root, {
    element: {
      enter: (node, parentNode) => {
        // transparent non-rendering elements still apply where referenced
        if (nonRendering.has(node.name)) {
          nonRenderedNodes.set(node, parentNode);
          return visitSkip;
        }
        const computedStyle = computeStyle(stylesheet, node);
        // opacity="0"
        //
        // https://www.w3.org/TR/SVG11/masking.html#ObjectAndGroupOpacityProperties
        if (
          opacity0 &&
          computedStyle.opacity &&
          computedStyle.opacity.type === 'static' &&
          computedStyle.opacity.value === '0'
        ) {
          removeElement(node, parentNode);
        }
      },
    },
  });

  return {
    element: {
      enter: (node, parentNode) => {
        if (
          (node.name === 'style' && node.children.length !== 0) ||
          hasScripts(node)
        ) {
          deoptimized = true;
          return;
        }

        if (node.name === 'defs') {
          allDefs.set(node, parentNode);
        }

        if (node.name === 'use') {
          for (const attr of Object.keys(node.attributes)) {
            if (attr !== 'href' && !attr.endsWith(':href')) continue;
            const value = node.attributes[attr];
            const id = value.slice(1);

            let refs = referencesById.get(id);
            if (!refs) {
              refs = [];
              referencesById.set(id, refs);
            }
            refs.push({ node, parentNode });
          }
        }

        // Removes hidden elements
        // https://www.w3schools.com/cssref/pr_class_visibility.asp
        const computedStyle = computeStyle(stylesheet, node);
        if (
          isHidden &&
          computedStyle.visibility &&
          computedStyle.visibility.type === 'static' &&
          computedStyle.visibility.value === 'hidden' &&
          // keep if any descendant enables visibility
          querySelector(node, '[visibility=visible]') == null
        ) {
          removeElement(node, parentNode);
          return;
        }

        // display="none"
        //
        // https://www.w3.org/TR/SVG11/painting.html#DisplayProperty
        // "A value of display: none indicates that the given element
        // and its children shall not be rendered directly"
        if (
          displayNone &&
          computedStyle.display &&
          computedStyle.display.type === 'static' &&
          computedStyle.display.value === 'none' &&
          // markers with display: none still rendered
          node.name !== 'marker'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Circles with zero radius
        //
        // https://www.w3.org/TR/SVG11/shapes.html#CircleElementRAttribute
        // "A value of zero disables rendering of the element"
        //
        // <circle r="0">
        if (
          circleR0 &&
          node.name === 'circle' &&
          node.children.length === 0 &&
          node.attributes.r === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Ellipse with zero x-axis radius
        //
        // https://www.w3.org/TR/SVG11/shapes.html#EllipseElementRXAttribute
        // "A value of zero disables rendering of the element"
        //
        // <ellipse rx="0">
        if (
          ellipseRX0 &&
          node.name === 'ellipse' &&
          node.children.length === 0 &&
          node.attributes.rx === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Ellipse with zero y-axis radius
        //
        // https://www.w3.org/TR/SVG11/shapes.html#EllipseElementRYAttribute
        // "A value of zero disables rendering of the element"
        //
        // <ellipse ry="0">
        if (
          ellipseRY0 &&
          node.name === 'ellipse' &&
          node.children.length === 0 &&
          node.attributes.ry === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Rectangle with zero width
        //
        // https://www.w3.org/TR/SVG11/shapes.html#RectElementWidthAttribute
        // "A value of zero disables rendering of the element"
        //
        // <rect width="0">
        if (
          rectWidth0 &&
          node.name === 'rect' &&
          node.children.length === 0 &&
          node.attributes.width === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Rectangle with zero height
        //
        // https://www.w3.org/TR/SVG11/shapes.html#RectElementHeightAttribute
        // "A value of zero disables rendering of the element"
        //
        // <rect height="0">
        if (
          rectHeight0 &&
          rectWidth0 &&
          node.name === 'rect' &&
          node.children.length === 0 &&
          node.attributes.height === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Pattern with zero width
        //
        // https://www.w3.org/TR/SVG11/pservers.html#PatternElementWidthAttribute
        // "A value of zero disables rendering of the element (i.e., no paint is applied)"
        //
        // <pattern width="0">
        if (
          patternWidth0 &&
          node.name === 'pattern' &&
          node.attributes.width === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Pattern with zero height
        //
        // https://www.w3.org/TR/SVG11/pservers.html#PatternElementHeightAttribute
        // "A value of zero disables rendering of the element (i.e., no paint is applied)"
        //
        // <pattern height="0">
        if (
          patternHeight0 &&
          node.name === 'pattern' &&
          node.attributes.height === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Image with zero width
        //
        // https://www.w3.org/TR/SVG11/struct.html#ImageElementWidthAttribute
        // "A value of zero disables rendering of the element"
        //
        // <image width="0">
        if (
          imageWidth0 &&
          node.name === 'image' &&
          node.attributes.width === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Image with zero height
        //
        // https://www.w3.org/TR/SVG11/struct.html#ImageElementHeightAttribute
        // "A value of zero disables rendering of the element"
        //
        // <image height="0">
        if (
          imageHeight0 &&
          node.name === 'image' &&
          node.attributes.height === '0'
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Path with empty data
        //
        // https://www.w3.org/TR/SVG11/paths.html#DAttribute
        //
        // <path d=""/>
        if (pathEmptyD && node.name === 'path') {
          if (node.attributes.d == null) {
            removeElement(node, parentNode);
            return;
          }
          const pathData = parsePathData(node.attributes.d);
          if (pathData.length === 0) {
            removeElement(node, parentNode);
            return;
          }
          // keep single point paths for markers
          if (
            pathData.length === 1 &&
            computedStyle['marker-start'] == null &&
            computedStyle['marker-end'] == null
          ) {
            removeElement(node, parentNode);
            return;
          }
        }

        // Polyline with empty points
        //
        // https://www.w3.org/TR/SVG11/shapes.html#PolylineElementPointsAttribute
        //
        // <polyline points="">
        if (
          polylineEmptyPoints &&
          node.name === 'polyline' &&
          node.attributes.points == null
        ) {
          removeElement(node, parentNode);
          return;
        }

        // Polygon with empty points
        //
        // https://www.w3.org/TR/SVG11/shapes.html#PolygonElementPointsAttribute
        //
        // <polygon points="">
        if (
          polygonEmptyPoints &&
          node.name === 'polygon' &&
          node.attributes.points == null
        ) {
          removeElement(node, parentNode);
          return;
        }

        for (const [name, value] of Object.entries(node.attributes)) {
          const ids = findReferences(name, value);

          for (const id of ids) {
            allReferences.add(id);
          }
        }
      },
    },
    root: {
      exit: () => {
        for (const id of removedDefIds) {
          const refs = referencesById.get(id);
          if (refs) {
            for (const { node, parentNode } of refs) {
              detachNodeFromParent(node, parentNode);
            }
          }
        }

        if (!deoptimized) {
          for (const [
            nonRenderedNode,
            nonRenderedParent,
          ] of nonRenderedNodes.entries()) {
            if (canRemoveNonRenderingNode(nonRenderedNode)) {
              detachNodeFromParent(nonRenderedNode, nonRenderedParent);
            }
          }
        }

        for (const [node, parentNode] of allDefs.entries()) {
          if (node.children.length === 0) {
            detachNodeFromParent(node, parentNode);
          }
        }
      },
    },
  };
};
