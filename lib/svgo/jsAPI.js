'use strict';

var JSAPI = function (data, parentNode) {
  Object.assign(this, data);
  if (this.type === 'element') {
    Object.defineProperty(this, 'parentNode', {
      writable: true,
      value: parentNode,
    });
  }
};
module.exports = JSAPI;
