import { mapNodesToParents } from '../util/map-nodes-to-parents.js';

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['isTag']} */
const isTag = (node) => {
  return node.type === 'element';
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['existsOne']} */
const existsOne = (test, elems) => {
  return elems.some((elem) => {
    return isTag(elem) && (test(elem) || existsOne(test, getChildren(elem)));
  });
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['getAttributeValue']} */
const getAttributeValue = (elem, name) => {
  return elem.attributes[name];
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['getChildren']} */
const getChildren = (node) => {
  return node.children || [];
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['getName']} */
const getName = (elemAst) => {
  return elemAst.name;
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['getText']} */
const getText = (node) => {
  if (node.children[0].type === 'text' || node.children[0].type === 'cdata') {
    return node.children[0].value;
  }
  return '';
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['hasAttrib']} */
const hasAttrib = (elem, name) => {
  return elem.attributes[name] !== undefined;
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['findAll']} */
const findAll = (test, elems) => {
  const result = [];
  for (const elem of elems) {
    if (isTag(elem)) {
      if (test(elem)) {
        result.push(elem);
      }
      result.push(...findAll(test, getChildren(elem)));
    }
  }
  return result;
};

/** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['findOne']} */
const findOne = (test, elems) => {
  for (const elem of elems) {
    if (isTag(elem)) {
      if (test(elem)) {
        return elem;
      }
      const result = findOne(test, getChildren(elem));
      if (result) {
        return result;
      }
    }
  }
  return null;
};

/**
 * @param {import('../types.js').XastParent} relativeNode
 * @param {Map<import('../types.js').XastNode, import('../types.js').XastParent>=} parents
 * @returns {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']}
 */
export function createAdapter(relativeNode, parents) {
  /** @type {Required<import('css-select').Options<import('../types.js').XastNode & { children?: any }, import('../types.js').XastElement>>['adapter']['getParent']} */
  const getParent = (node) => {
    if (!parents) {
      parents = mapNodesToParents(relativeNode);
    }

    return parents.get(node) || null;
  };

  /**
   * @param {any} elem
   * @returns {any}
   */
  const getSiblings = (elem) => {
    const parent = getParent(elem);
    return parent ? getChildren(parent) : [];
  };

  /**
   * @param {any} nodes
   * @returns {any}
   */
  const removeSubsets = (nodes) => {
    let idx = nodes.length;
    let node;
    let ancestor;
    let replace;
    // Check if each node (or one of its ancestors) is already contained in the
    // array.
    while (--idx > -1) {
      node = ancestor = nodes[idx];
      // Temporarily remove the node under consideration
      nodes[idx] = null;
      replace = true;
      while (ancestor) {
        if (nodes.includes(ancestor)) {
          replace = false;
          nodes.splice(idx, 1);
          break;
        }
        ancestor = getParent(ancestor);
      }
      // If the node has been found to be unique, re-insert it.
      if (replace) {
        nodes[idx] = node;
      }
    }
    return nodes;
  };

  return {
    isTag,
    existsOne,
    getAttributeValue,
    getChildren,
    getName,
    getParent,
    getSiblings,
    getText,
    hasAttrib,
    removeSubsets,
    findAll,
    findOne,
  };
}
