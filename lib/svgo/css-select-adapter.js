/**
 * @typedef {Required<import('css-select').Options<XastNode & { children?: any }, XastElement>>['adapter']} Adapter
 * @typedef {import('../types.js').XastChild} XastChild
 * @typedef {import('../types.js').XastElement} XastElement
 * @typedef {import('../types.js').XastNode} XastNode
 * @typedef {import('../types.js').XastParent} XastParent
 */

/** @type {Adapter['isTag']} */
const isTag = (node) => {
  return node.type === 'element';
};

/** @type {Adapter['existsOne']} */
const existsOne = (test, elems) => {
  return elems.some((elem) => {
    return isTag(elem) && (test(elem) || existsOne(test, getChildren(elem)));
  });
};

/** @type {Adapter['getAttributeValue']} */
const getAttributeValue = (elem, name) => {
  return elem.attributes[name];
};

/** @type {Adapter['getChildren']} */
const getChildren = (node) => {
  return node.children || [];
};

/** @type {Adapter['getName']} */
const getName = (elemAst) => {
  return elemAst.name;
};

/** @type {Adapter['getText']} */
const getText = (node) => {
  if (node.children[0].type === 'text' || node.children[0].type === 'cdata') {
    return node.children[0].value;
  }
  return '';
};

/** @type {Adapter['hasAttrib']} */
const hasAttrib = (elem, name) => {
  return elem.attributes[name] !== undefined;
};

/** @type {Adapter['findAll']} */
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

/** @type {Adapter['findOne']} */
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
 * @param {Map<XastNode, XastParent>} parents
 * @returns {Adapter}
 */
export function createAdapter(parents) {
  /** @type {Adapter['getParent']} */
  const getParent = (node) => {
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
