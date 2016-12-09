'use strict';

var cssSelect      = require('css-select'),
    SvgoCssAdapter = require('./svgo-css-adapter');

var cssSelectOpts  = {xmlMode: true};

/**
  * Returns array of csso AST nodes that match a passed css selector 
  * against a passed node (usually the root node).
  */
module.exports     = function(selector, rootNode) {
  if(!cssSelectOpts.adapter) {
    cssSelectOpts.adapter = new SvgoCssAdapter(rootNode);
  }

  return cssSelect(selector, rootNode, cssSelectOpts);
};
