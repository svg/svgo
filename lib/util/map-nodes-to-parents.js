import { visit } from './visit.js';

/**
 * Maps all nodes to their parent node recursively.
 *
 * @param {import('../types.js').XastParent} node
 * @returns {Map<import('../types.js').XastNode, import('../types.js').XastParent>}
 */
export function mapNodesToParents(node) {
  /** @type {Map<import('../types.js').XastNode, import('../types.js').XastParent>} */
  const parents = new Map();

  for (const child of node.children) {
    parents.set(child, node);
    visit(
      child,
      {
        element: {
          enter: (child, parent) => {
            parents.set(child, parent);
          },
        },
      },
      node,
    );
  }

  return parents;
}
