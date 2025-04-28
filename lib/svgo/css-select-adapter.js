/**
 * @typedef {import('../types.js').XastChild} XastChild
 * @typedef {import('../types.js').XastElement} XastElement
 * @typedef {import('../types.js').XastNode} XastNode
 * @typedef {import('../types.js').XastParent} XastParent
 */

/**
 * @param {XastNode} node
 * @returns {boolean}
 */
const isTag = (node) => {
  return node.type === 'element';
};

/**
 * @param {<T>(v: T) => boolean} test
 * @param {XastNode[]} elems
 * @returns {boolean}
 */
const existsOne = (test, elems) => {
  return elems.some((elem) => {
    return isTag(elem) && (test(elem) || existsOne(test, getChildren(elem)));
  });
};

/**
 * @param {XastElement} elem
 * @param {string} name
 * @returns {?string}
 */
const getAttributeValue = (elem, name) => {
  return elem.attributes[name];
};

/**
 * @param {XastNode & { children?: XastChild[] }} node
 * @returns {XastChild[]}
 */
const getChildren = (node) => {
  return node.children || [];
};

/**
 * @param {XastElement} elemAst
 * @returns {string}
 */
const getName = (elemAst) => {
  return elemAst.name;
};

/**
 * @param {XastNode & { parentNode?: XastParent }} node
 * @returns {?XastParent}
 */
const getParent = (node) => {
  return node.parentNode || null;
};

/**
 * @param {XastElement} elem
 * @returns {XastChild[]}
 */
const getSiblings = (elem) => {
  const parent = getParent(elem);
  return parent ? getChildren(parent) : [];
};

/**
 * @param {XastParent} node
 * @returns {string}
 */
const getText = (node) => {
  if (node.children[0].type === 'text' || node.children[0].type === 'cdata') {
    return node.children[0].value;
  }
  return '';
};

/**
 * @param {XastElement} elem
 * @param {string} name
 * @returns {boolean}
 */
const hasAttrib = (elem, name) => {
  return elem.attributes[name] !== undefined;
};

/**
 * @param {Array<?XastNode>} nodes
 * @returns {Array<?XastNode>}
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

/**
 * @param {<T>(v: T) => boolean} test
 * @param {XastNode[]} elems
 * @returns {XastNode[]}
 */
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

/**
 * @param {<T>(v: T) => boolean} test
 * @param {XastNode[]} elems
 * @returns {?XastNode}
 */
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

export default {
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
