import { detachNodeFromParent } from '../lib/xast.js';
import { elemsGroups } from './_collections.js';

export const name = 'removeUselessDefs';
export const description = 'removes elements in <defs> without id';

/**
 * Removes content of defs and properties that aren't rendered directly without ids.
 *
 * @author Lev Solntsev
 *
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (
          node.name === 'defs' ||
          (elemsGroups.nonRendering.has(node.name) &&
            node.attributes.id == null)
        ) {
          /** @type {import('../lib/types.js').XastElement[]} */
          const usefulNodes = [];
          collectUsefulNodes(node, usefulNodes);
          if (usefulNodes.length === 0) {
            detachNodeFromParent(node, parentNode);
          }
          node.children = usefulNodes;
        }
      },
    },
  };
};

/**
 * @param {import('../lib/types.js').XastElement} node
 * @param {import('../lib/types.js').XastElement[]} usefulNodes
 */
const collectUsefulNodes = (node, usefulNodes) => {
  for (const child of node.children) {
    if (child.type === 'element') {
      if (child.attributes.id != null || child.name === 'style') {
        usefulNodes.push(child);
      } else {
        collectUsefulNodes(child, usefulNodes);
      }
    }
  }
};
