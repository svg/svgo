import { selectAll, selectOne, is } from 'css-select';
import adapter from './svgo/css-select-adapter.js';

/**
 * @typedef {import('css-select').Options<XastNode & { children?: any }, XastElement & { parentNode?: any }>} Options
 * @typedef {import('./types.js').XastElement} XastElement
 * @typedef {import('./types.js').XastNode} XastNode
 * @typedef {import('./types.js').XastChild} XastChild
 * @typedef {import('./types.js').XastParent} XastParent
 * @typedef {import('./types.js').Visitor} Visitor
 */

/** @type {Options} */
const cssSelectOptions = {
  xmlMode: true,
  adapter,
};

/**
 * @param {XastNode} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @returns {XastChild[]} All matching elements.
 */
export const querySelectorAll = (node, selector) => {
  return selectAll(selector, node, cssSelectOptions);
};

/**
 * @param {XastNode} node Element to query the children of.
 * @param {string} selector CSS selector string.
 * @returns {?XastChild} First match, or null if there was no match.
 */
export const querySelector = (node, selector) => {
  return selectOne(selector, node, cssSelectOptions);
};

/**
 * @param {XastElement} node
 * @param {string} selector
 * @returns {boolean}
 */
export const matches = (node, selector) => {
  return is(node, selector, cssSelectOptions);
};

export const visitSkip = Symbol();

/**
 * @param {XastNode} node
 * @param {Visitor} visitor
 * @param {?any} parentNode
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
