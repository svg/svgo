'use strict';

/**
  * Traverses a svgo AST recursively and invokes passed callback with visited node.
  * The callback function also can retrieve 
  *   the parent node via this.parent.
  *   the root   node via this.root (passed to be recursed against)
  */
module.exports = function(startNode, fn, reverse) {

  function monkeys(node) {

    for(var childNodeIndex in node.content) {
      var childNode = node.content[childNodeIndex];

      // reverse pass
      if (reverse && childNode.content) {
        monkeys(childNode);
      }

      var fnRes = fn.bind({root: startNode, parent: node})(childNode);
      if(fnRes === false) {
        return fnRes;
      }

      // direct pass
      if (!reverse && childNode.content) {
        monkeys(childNode);
      }

    }

  }

  return monkeys(startNode);
};
