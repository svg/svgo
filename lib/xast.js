import { is, selectAll, selectOne } from 'css-select';
import { createAdapter } from './svgo/css-select-adapter.js';

/**
 * @param {import('./types.js').XastParent} relativeNode
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {import('css-select').Options<import('./types.js').XastNode & { children?: any }, import('./types.js').XastElement>}
 */
function createCssSelectOptions(relativeNode, parents) {
  return {
    xmlMode: true,
    adapter: createAdapter(relativeNode, parents),
  };
}

/**
 * @param {import('./types.js').XastParent} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {import('./types.js').XastChild[]} All matching elements.
 */
export const querySelectorAll = (node, selector, parents) => {
  return selectAll(selector, node, createCssSelectOptions(node, parents));
};

/**
 * @param {import('./types.js').XastParent} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {?import('./types.js').XastChild} First match, or null if there was no match.
 */
export const querySelector = (node, selector, parents) => {
  return selectOne(selector, node, createCssSelectOptions(node, parents));
};

/**
 * @param {import('./types.js').XastElement} node
 * @param {string} selector
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {boolean}
 */
export const matches = (node, selector, parents) => {
  return is(node, selector, createCssSelectOptions(node, parents));
};

/**
 * @param {import('./types.js').XastChild} node
 * @param {import('./types.js').XastParent} parentNode
 */
export const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
