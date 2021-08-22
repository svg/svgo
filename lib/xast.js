'use strict';

/**
 * @typedef {import('css-tree').CssNodePlain} CsstreeNode
 * @typedef {import('./types').XastNode} XastNode
 * @typedef {import('./types').XastChild} XastChild
 * @typedef {import('./types').XastParent} XastParent
 * @typedef {import('./types').XastElement} XastElement
 * @typedef {import('./types').Visitor} Visitor
 */

const csstree = require('css-tree');
const { is } = require('css-select');
const xastAdaptor = require('./svgo/css-select-adapter.js');

/**
 * @type {(string: string) => string}
 */
const trimQuotes = (string) => {
  if (
    (string.startsWith('"') && string.endsWith('"')) ||
    (string.startsWith("'") && string.endsWith("'"))
  ) {
    return string.slice(1, -1);
  }
  return string;
};

/**
 * @type {(csstreeNode: CsstreeNode, xastElement: XastElement) => boolean}
 */
const elementMatches = (csstreeNode, xastElement) => {
  if (csstreeNode.type === 'TypeSelector') {
    return csstreeNode.name === xastElement.name;
  }
  if (csstreeNode.type === 'IdSelector') {
    return csstreeNode.name === xastElement.attributes.id;
  }
  if (csstreeNode.type === 'ClassSelector') {
    return (
      xastElement.attributes.class != null &&
      xastElement.attributes.class.split(' ').includes(csstreeNode.name)
    );
  }
  if (csstreeNode.type === 'AttributeSelector') {
    if (csstreeNode.matcher === '=') {
      const name = csstreeNode.name.name;
      let value;
      if (
        csstreeNode.value != null &&
        csstreeNode.value.type === 'Identifier'
      ) {
        value = csstreeNode.value.name;
      }
      if (csstreeNode.value != null && csstreeNode.value.type === 'String') {
        value = trimQuotes(csstreeNode.value.value);
      }
      return xastElement.attributes[name] === value;
    }
    throw Error(`Unknown csstree attribute matcher "${csstreeNode.matcher}"`);
  }
  throw Error(
    `Unknown csstree node type "${csstreeNode.type}" found when matching element`
  );
};

/**
 * @type {(csstreeNode: CsstreeNode, xastNode: XastNode) => Array<XastElement>}
 */
const descendantElement = (csstreeNode, xastNode) => {
  const result = [];
  if (xastNode.type === 'root') {
    for (const xastChild of xastNode.children) {
      result.push(...descendantElement(csstreeNode, xastChild));
    }
  }
  if (xastNode.type === 'element') {
    if (elementMatches(csstreeNode, xastNode)) {
      result.push(xastNode);
    }
    for (const xastChild of xastNode.children) {
      result.push(...descendantElement(csstreeNode, xastChild));
    }
  }
  return result;
};

/**
 * @type {(csstreeNode: CsstreeNode, xastNode:XastParent) => Array<XastElement>}
 */
const any = (csstreeNode, xastNode) => {
  if (csstreeNode.type === 'SelectorList') {
    const result = [];
    for (const csstreeChild of csstreeNode.children) {
      result.push(...any(csstreeChild, xastNode));
    }
    return result;
  }
  if (csstreeNode.type === 'Selector') {
    return descendantElement(csstreeNode.children[0], xastNode);
  }
  throw Error(`Unknown type ${csstreeNode.type}`);
};

/**
 * @type {(selector: string, node: XastParent) => null | XastElement}
 */
const select = (selector, node) => {
  const parsedSelector = csstree.toPlainObject(
    csstree.parse(selector, { context: 'selectorList' })
  );
  const match = any(parsedSelector, node);
  return match.length === 0 ? null : match[0];
  // const match = any(parse(selector), node, { one: true, any });
  // return match.length === 0 ? null : match[0];
};

/**
 * @type {(selector: string, node: XastParent) => Array<XastElement>}
 */
const selectAll = (selector, node) => {
  const parsedSelector = csstree.toPlainObject(
    csstree.parse(selector, { context: 'selectorList' })
  );
  const match = any(parsedSelector, node);
  return match;
  // const match = any(parse(selector), node, { any });
  // return match;
};

///

/**
 * @type {(node: XastParent, selector: string) => Array<XastElement>}
 */
const querySelectorAll = (node, selector) => {
  return selectAll(selector, node);
};
exports.querySelectorAll = querySelectorAll;

/**
 * @type {(node: XastParent, selector: string) => null | XastElement}
 */
const querySelector = (node, selector) => {
  return select(selector, node);
};
exports.querySelector = querySelector;

const cssSelectOptions = {
  xmlMode: true,
  adapter: xastAdaptor,
};

/**
 * @type {(node: XastElement, selector: string) => boolean}
 */
const matches = (node, selector) => {
  return is(node, selector, cssSelectOptions);
};
exports.matches = matches;

/**
 * @type {(node: XastChild, name: string) => null | XastChild}
 */
const closestByName = (node, name) => {
  let currentNode = node;
  while (currentNode) {
    if (currentNode.type === 'element' && currentNode.name === name) {
      return currentNode;
    }
    // @ts-ignore parentNode is hidden from public usage
    currentNode = currentNode.parentNode;
  }
  return null;
};
exports.closestByName = closestByName;

const traverseBreak = Symbol();
exports.traverseBreak = traverseBreak;

/**
 * @type {(node: any, fn: any) => any}
 */
const traverse = (node, fn) => {
  if (fn(node) === traverseBreak) {
    return traverseBreak;
  }
  if (node.type === 'root' || node.type === 'element') {
    for (const child of node.children) {
      if (traverse(child, fn) === traverseBreak) {
        return traverseBreak;
      }
    }
  }
};
exports.traverse = traverse;

/**
 * @type {(node: XastNode, visitor: Visitor, parentNode?: any) => void}
 */
const visit = (node, visitor, parentNode) => {
  const callbacks = visitor[node.type];
  if (callbacks && callbacks.enter) {
    // @ts-ignore hard to infer
    callbacks.enter(node, parentNode);
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not loose cursor when children is spliced
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
  if (callbacks && callbacks.exit) {
    // @ts-ignore hard to infer
    callbacks.exit(node, parentNode);
  }
};
exports.visit = visit;

/**
 * @type {(node: XastChild, parentNode: XastParent) => void}
 */
const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
exports.detachNodeFromParent = detachNodeFromParent;
