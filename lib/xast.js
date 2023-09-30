'use strict';

/**
 * @typedef {import('xast').ElementContent} ElementContent
 * @typedef {import('xast').Node} Node
 * @typedef {import('xast').Parents} Parents
 * @typedef {import('xast').Root} Root
 * @typedef {import('xast').RootContent} RootContent
 * @typedef {import('./types').Visitor} Visitor
 */

const { selectAll, selectOne, is } = require('css-select');
const xastAdaptor = require('./svgo/css-select-adapter.js');

const cssSelectOptions = {
  xmlMode: true,
  adapter: xastAdaptor,
};

/**
 * @type {(node: Node, selector: string) => Array<ElementContent>}
 */
const querySelectorAll = (node, selector) => {
  return selectAll(selector, node, cssSelectOptions);
};
exports.querySelectorAll = querySelectorAll;

/**
 * @type {(node: Node, selector: string) => null | ElementContent}
 */
const querySelector = (node, selector) => {
  return selectOne(selector, node, cssSelectOptions);
};
exports.querySelector = querySelector;

/**
 * @type {(node: ElementContent, selector: string) => boolean}
 */
const matches = (node, selector) => {
  return is(node, selector, cssSelectOptions);
};
exports.matches = matches;

const visitSkip = Symbol();
exports.visitSkip = visitSkip;

/**
 * @param {Root|RootContent} node
 * @param {Visitor} visitor
 * @param {Parents} [parentNode]
 */
const visit = (node, visitor, parentNode) => {
  const callbacks = visitor[node.type];
  if (callbacks && callbacks.enter) {
    // @ts-ignore hard to infer
    const symbol = callbacks.enter(node, parentNode);
    if (symbol === visitSkip) {
      return;
    }
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not loose cursor when children is spliced
    for (const child of node.children) {
      visit(child, visitor, node);
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element' && parentNode != null) {
    if (parentNode.children.includes(node)) {
      for (const child of node.children) {
        visit(child, visitor, node);
      }
    }
  }
  if (callbacks && callbacks.exit) {
    // @ts-ignore hard to infer
    callbacks.exit(node, parentNode);
  }
};
exports.visit = visit;

/**
 * @type {(node: ElementContent|RootContent, parentNode: Parents) => void}
 */
const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
exports.detachNodeFromParent = detachNodeFromParent;
