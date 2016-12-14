'use strict';

var cssSelect      = require('css-select'),
    SvgoCssAdapter = require('./svgo-css-adapter');

var cssSelectOpts  = {xmlMode: true, adapter: SvgoCssAdapter};

/**
  * Returns array of csso AST nodes that match a passed css selector 
  * against a passed node (usually the root node).
  */
module.exports     = function(selector, rootNode) {
  return cssSelect(selector, rootNode, cssSelectOpts);
};
