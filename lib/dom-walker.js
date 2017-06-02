'use strict';		

var walk = require('tree-walk');		

var domWalker = walk(function(node) {		
    return node.content;		
});		

module.exports = domWalker;
