'use strict';

/**
 * @typedef {import('css-tree').CssNodePlain} CsstreeNode
 * @typedef {import('./types').XastNode} XastNode
 * @typedef {import('./types').XastChild} XastChild
 * @typedef {import('./types').XastParent} XastParent
 * @typedef {import('./types').XastRoot} XastRoot
 * @typedef {import('./types').XastElement} XastElement
 * @typedef {import('./types').Visitor} Visitor
 */

const csstree = require('css-tree');

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
 * @type {(
 *   startNode: XastParent,
 *   descendants: Array<XastElement>,
 *   parents: WeakMap<XastElement, XastParent>
 * ) => void}
 */
const collectDescendantElements = (startNode, descendants, parents) => {
  for (const childNode of startNode.children) {
    if (childNode.type === 'element') {
      parents.set(childNode, startNode);
      descendants.push(childNode);
      collectDescendantElements(childNode, descendants, parents);
    }
  }
};

/**
 * @type {(
 *   startNodes: Array<XastElement>,
 *   children: Array<XastElement>,
 *   parents: WeakMap<XastElement, XastParent>
 * ) => void}
 */
const collectChildrenElements = (startNodes, children, parents) => {
  for (const startNode of startNodes) {
    for (const child of startNode.children) {
      if (child.type === 'element') {
        parents.set(child, startNode);
        children.push(child);
      }
    }
  }
};

/**
 * @type {(
 *   startNodes: Array<XastElement>,
 *   siblings: Array<XastElement>,
 *   parents: WeakMap<XastElement, XastParent>
 * ) => void}
 */
const collectAdjacentSiblings = (startNodes, siblings, parents) => {
  for (const startNode of startNodes) {
    const parentNode = parents.get(startNode);
    if (parentNode != null) {
      const allSiblings = parentNode.children;
      const index = allSiblings.indexOf(startNode);
      const adjacentSiblings = allSiblings.slice(index + 1, index + 2);
      for (const adjacentSibling of adjacentSiblings) {
        if (adjacentSibling.type === 'element') {
          parents.set(adjacentSibling, parentNode);
          siblings.push(adjacentSibling);
        }
      }
    }
  }
};

/**
 * @type {(
 *   startNodes: Array<XastElement>,
 *   siblings: Array<XastElement>,
 *   parents: WeakMap<XastElement, XastParent>
 * ) => void}
 */
const collectGeneralSiblings = (startNodes, siblings, parents) => {
  for (const startNode of startNodes) {
    const parentNode = parents.get(startNode);
    if (parentNode != null) {
      const allSiblings = parentNode.children;
      const index = allSiblings.indexOf(startNode);
      const generalSiblings = allSiblings.slice(index + 1);
      for (const generalSibling of generalSiblings) {
        if (generalSibling.type === 'element') {
          parents.set(generalSibling, parentNode);
          siblings.push(generalSibling);
        }
      }
    }
  }
};

/**
 * @type {(csstreeNodes: Array<CsstreeNode>, xastNode:XastParent) => Array<XastElement>}
 */
const combination = (csstreeNodes, xastNode) => {
  /**
   * @type {Array<XastElement>}
   */
  let candidateNodes = [];
  /**
   * @type {WeakMap<XastElement, XastParent>}
   */
  let candidateParents = new WeakMap();
  collectDescendantElements(xastNode, candidateNodes, candidateParents);
  /**
   * @type {Array<XastElement>}
   */
  let lastMatchedNodes = [];
  for (const csstreeChild of csstreeNodes) {
    if (csstreeChild.type === 'WhiteSpace') {
      for (const node of lastMatchedNodes) {
        candidateNodes = [];
        collectDescendantElements(node, candidateNodes, candidateParents);
      }
    } else if (csstreeChild.type === 'Combinator') {
      candidateNodes = [];
      if (csstreeChild.name === '>') {
        collectChildrenElements(
          lastMatchedNodes,
          candidateNodes,
          candidateParents
        );
      } else if (csstreeChild.name === '+') {
        collectAdjacentSiblings(
          lastMatchedNodes,
          candidateNodes,
          candidateParents
        );
      } else if (csstreeChild.name === '~') {
        collectGeneralSiblings(
          lastMatchedNodes,
          candidateNodes,
          candidateParents
        );
      } else {
        throw Error(`Unknown combinator ${csstreeChild.name}`);
      }
    } else {
      // actionn
      lastMatchedNodes = [];
      for (const candidateNode of candidateNodes) {
        if (elementMatches(csstreeChild, candidateNode)) {
          lastMatchedNodes.push(candidateNode);
        }
      }
    }
  }
  return lastMatchedNodes;
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
    return combination(csstreeNode.children, xastNode);
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
};

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

/**
 * @type {(selector: string, node: XastElement, root: XastRoot) => boolean}
 */
const matches = (selector, node, root) => {
  const match = selectAll(selector, root);
  return match.includes(node);
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
