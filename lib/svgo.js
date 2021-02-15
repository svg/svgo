'use strict';

/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see https://github.com/svg/svgo
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.githubusercontent.com/svg/svgo/master/LICENSE
 */

const { resolvePluginConfig } = require('./svgo/config.js');
const SVG2JS = require('./svgo/svg2js.js');
const PLUGINS = require('./svgo/plugins.js');
const JSAPI = require('./svgo/jsAPI.js');
const { encodeSVGDatauri } = require('./svgo/tools.js');
const JS2SVG = require('./svgo/js2svg.js');

var SVGO = function(config = {}) {
  this.config = config;
};

SVGO.prototype.optimize = function(svgstr, info = {}) {
  const config = this.config;
  if (typeof config !== 'object') {
    throw Error('Config should be an object')
  }
  const maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let svgjs = null;
  for (let i = 0; i < maxPassCount; i += 1) {
    svgjs = SVG2JS(svgstr);
    if (svgjs.error == null && config.plugins) {
      if (Array.isArray(config.plugins) === false) {
        throw Error('Invalid plugins list. Provided \'plugins\' in config should be an array.');
      }
      const plugins = config.plugins.map(plugin => resolvePluginConfig(plugin, config))
      svgjs = PLUGINS(svgjs, info, plugins);
    }
    svgjs = JS2SVG(svgjs, config.js2svg);
    if (svgjs.error) {
      throw Error(svgjs.error);
    }
    info.multipassCount = i;
    if (svgjs.data.length < prevResultSize) {
      prevResultSize = svgjs.data.length
    } else {
      if (config.datauri) {
        svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
      }
      if (info && info.path) {
        svgjs.path = info.path;
      }
      return svgjs;
    }
  }
  return svgjs;
};

/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which is passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
SVGO.prototype.createContentItem = function(data) {
    return new JSAPI(data);
};

module.exports = SVGO;
// Offer ES module interop compatibility.
module.exports.default = SVGO;
