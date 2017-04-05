'use strict';

var walk = require('tree-walk');

var domWalker = walk(function(el) {
    return el.content;
});

module.exports = domWalker;
