'use strict';

const { selectAll, selectOne, is } = require('css-select');
const xastAdaptor = require('./svgo/css-select-adapter.js');

const cssSelectOptions = {
  xmlMode: true,
  adapter: xastAdaptor,
};

const querySelectorAll = (node, selector) => {
  return selectAll(selector, node, cssSelectOptions);
};
exports.querySelectorAll = querySelectorAll;

const querySelector = (node, selector) => {
  return selectOne(selector, node, cssSelectOptions);
};
exports.querySelector = querySelector;

const matches = (node, selector) => {
  return is(node, selector, cssSelectOptions);
};
exports.matches = matches;

const closestByName = (node, name) => {
  let currentNode = node;
  while (currentNode) {
    if (currentNode.type === 'element' && currentNode.name === name) {
      return currentNode;
    }
    currentNode = currentNode.parentNode;
  }
  return null;
};
exports.closestByName = closestByName;

const traverseBreak = Symbol();
exports.traverseBreak = traverseBreak;

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
