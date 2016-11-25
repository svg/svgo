'use strict';

var recurseAst = require('./recurse-ast');

module.exports = function(rootNode, childNode) {

  if(rootNode == childNode) {
    return null; // root node has no parent
  }

  var foundParentNode = null;
  var _findParentNode = function(childNodeCompare) {
    if(childNode == childNodeCompare) {
      foundParentNode = this.parent;
      return false; // abort recursion
    }
  };
  recurseAst.bind({parent:null})(rootNode, _findParentNode);
  return foundParentNode;
};
