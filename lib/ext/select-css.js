'use strict';

var cssSelect     = require('css-select'),
    domutilsSvgo  = require('./domutils-svgo'),
	addParentRefs = require('./add-parent-refs');

var cssSelectOpts = {xmlMode: true, adapter: domutilsSvgo};

module.exports    = function(selector, data) {

  // TODO: Add this functionality to svgo API
  data = addParentRefs(data);

  return cssSelect(selector, data, cssSelectOpts);
};
