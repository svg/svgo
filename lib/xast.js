import { is, selectAll, selectOne } from 'css-select';
import { createAdapter } from './svgo/css-select-adapter.js';

/**
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>} parents
 * @returns {import('css-select').Options<import('./types.js').XastNode & { children?: any }, import('./types.js').XastElement>}
 */
function createCssSelectOptions(parents) {
  return {
    xmlMode: true,
    adapter: createAdapter(parents),
  };
}

/**
 * Maps all nodes to their parent node recursively.
 *
 * @param {import('./types.js').XastParent} node
 * @returns {Map<import('./types.js').XastNode, import('./types.js').XastParent>}
 */
export function mapNodesToParents(node) {
  /** @type {Map<import('./types.js').XastNode, import('./types.js').XastParent>} */
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

/**
 * @param {import('./types.js').XastParent} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {import('./types.js').XastChild[]} All matching elements.
 */
export const querySelectorAll = (
  node,
  selector,
  parents = mapNodesToParents(node),
) => {
  return selectAll(selector, node, createCssSelectOptions(parents));
};

/**
 * @param {import('./types.js').XastParent} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {?import('./types.js').XastChild} First match, or null if there was no match.
 */
export const querySelector = (
  node,
  selector,
  parents = mapNodesToParents(node),
) => {
  return selectOne(selector, node, createCssSelectOptions(parents));
};

/**
 * @param {import('./types.js').XastElement} node
 * @param {string} selector
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {boolean}
 */
export const matches = (node, selector, parents = mapNodesToParents(node)) => {
  return is(node, selector, createCssSelectOptions(parents));
};

export const visitSkip = Symbol();

/**
 * @param {import('./types.js').XastNode} node
 * @param {import('./types.js').Visitor} visitor
 * @param {any=} parentNode
 */
export const visit = (node, visitor, parentNode) => {
  const callbacks = visitor[node.type];
  if (callbacks?.enter) {
    // @ts-expect-error hard to infer
    const symbol = callbacks.enter(node, parentNode);
    if (symbol === visitSkip) {
      return;
    }
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not lose cursor when children is spliced
    for (const child of node.children) {
      visit(child, visitor, node);
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element') {
    if (parentNode.children.includes(node)) {
      for (const child of node.children) {
        visit(child, visitor, node);
      }
    }
  }
  if (callbacks?.exit) {
    // @ts-expect-error hard to infer
    callbacks.exit(node, parentNode);
  }
};

/**
 * @param {import('./types.js').XastChild} node
 * @param {import('./types.js').XastParent} parentNode
 */
export const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
