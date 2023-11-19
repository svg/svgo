'use strict';

/**
 * @typedef {import('../lib/types').XastElement} XastElement
 */

const { detachNodeFromParent, visitSkip } = require('../lib/xast.js');

exports.name = 'collapseText';
exports.description = 'merges tspan into text parent if possible';

/**
 * @type {Map<XastElement, XastElement>}
 */
let tspansToCollapse;
let deoptimized = false;

/**
 * If <text> has a single child of type <tspan>, remove the <tspan> element and make it's children
 * children of <text>.
 *
 * @author John Kenny
 *
 * @type {import('./plugins-types').Plugin<'collapseText'>}
 */

exports.fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        // Don't collapse if styles are present.
        if (node.name === 'style' && node.children.length !== 0) {
          deoptimized = true;
        }
        if (deoptimized) {
          return visitSkip;
        }

        // Merge only if <text> contains a single child, of type <tspan>.
        if (
          node.name !== 'tspan' ||
          parentNode.type !== 'element' ||
          parentNode.name !== 'text' ||
          parentNode.children.length !== 1
        ) {
          return;
        }

        // If either the <text> or <tspan> has a style attribute, don't collapse.
        if (node.attributes['style'] || parentNode.attributes['style']) {
          return;
        }

        tspansToCollapse.set(node, parentNode);
      },
    },

    root: {
      enter: () => {
        deoptimized = false;
        tspansToCollapse = new Map();
      },
      exit: () => {
        if (deoptimized) {
          return;
        }
        for (const [node, parentNode] of tspansToCollapse) {
          // Move <tspan> children to parent.
          detachNodeFromParent(node, parentNode);
          parentNode.children = node.children;

          // Overwrite <text> attributes with <tspan> attributes.
          for (const [name, value] of Object.entries(node.attributes)) {
            parentNode.attributes[name] = value;
          }
        }
      },
    },
  };
};
