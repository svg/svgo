'use strict';

var cssSelect      = require('css-select'),
    SvgoCssAdapter = require('./svgo-css-adapter');

var cssSelectOpts = {xmlMode: true};

module.exports    = function(selector, rootNode) {
  if(!cssSelectOpts.adapter) {
    cssSelectOpts.adapter = new SvgoCssAdapter(rootNode);
  }

  return cssSelect(selector, rootNode, cssSelectOpts);
};
