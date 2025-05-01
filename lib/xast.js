import { selectAll, selectOne, is } from 'css-select';
import { createAdapter } from './svgo/css-select-adapter.js';

/**
 * @typedef {import('css-select').Options<XastNode & { children?: any }, XastElement>} Options
 * @typedef {import('./types.js').XastElement} XastElement
 * @typedef {import('./types.js').XastNode} XastNode
 * @typedef {import('./types.js').XastChild} XastChild
 * @typedef {import('./types.js').XastParent} XastParent
 * @typedef {import('./types.js').Visitor} Visitor
 */

/**
 * @param {Map<XastNode, XastParent>} parents
 * @returns {Options}
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
 * @param {XastParent} node
 * @returns {Map<XastNode, XastParent>}
 */
export function mapNodesToParents(node) {
  /** @type {Map<XastNode, XastParent>} */
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
 * @param {XastParent} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @param {Map<XastNode, XastParent>=} parents
 * @returns {XastChild[]} All matching elements.
 */
export const querySelectorAll = (
  node,
  selector,
  parents = mapNodesToParents(node),
) => {
  return selectAll(selector, node, createCssSelectOptions(parents));
};

/**
 * @param {XastParent} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @param {Map<XastNode, XastParent>=} parents
 * @returns {?XastChild} First match, or null if there was no match.
 */
export const querySelector = (
  node,
  selector,
  parents = mapNodesToParents(node),
) => {
  return selectOne(selector, node, createCssSelectOptions(parents));
};

/**
 * @param {XastElement} node
 * @param {string} selector
 * @param {Map<XastNode, XastParent>=} parents
 * @returns {boolean}
 */
export const matches = (node, selector, parents = mapNodesToParents(node)) => {
  return is(node, selector, createCssSelectOptions(parents));
};

export const visitSkip = Symbol();

/**
 * @param {XastNode} node
 * @param {Visitor} visitor
 * @param {any=} parentNode
 */
export const visit = (node, visitor, parentNode = undefined) => {
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
 * @param {XastChild} node
 * @param {XastParent} parentNode
 */
export const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
