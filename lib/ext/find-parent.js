'use strict';

var recurseAst = require('./recurse-ast');

/**
  * Returns parent node of a given node.
  * Returns null if node has no parent (root node).
  */
module.exports = function(startNode, childNode) {

  if(startNode == childNode) {
    return null; // root node has no parent
  }

  var foundParentNode = null;
  var _findParentNode = function(childNodeCompare) {
    if(childNode == childNodeCompare) {
      foundParentNode = this.parent;
      return false; // abort recursion
    }
  };
  recurseAst.bind({parent:null})(startNode, _findParentNode);
  return foundParentNode;
};
