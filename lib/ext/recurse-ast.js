'use strict';

module.exports = function(startNode, fn, reverse) {

  function monkeys(node) {

    for(var childNodeIndex in node.content) {
      var childNode = node.content[childNodeIndex];

      // reverse pass
      if (reverse && childNode.content) {
        monkeys(childNode);
      }

      var fnRes = fn.bind({parent: node})(childNode);
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
