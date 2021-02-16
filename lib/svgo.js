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

const {
  defaultPlugins,
  resolvePluginConfig,
  extendDefaultPlugins
} = require('./svgo/config.js');
const svg2js = require('./svgo/svg2js.js');
const js2svg = require('./svgo/js2svg.js');
const invokePlugins = require('./svgo/plugins.js');
const JSAPI = require('./svgo/jsAPI.js');
const { encodeSVGDatauri } = require('./svgo/tools.js');

exports.extendDefaultPlugins = extendDefaultPlugins;

const optimize = (svgstr, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object')
  }
  const maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let svgjs = null;
  const info = {}
  if (config.path != null) {
    info.path = config.path;
  }
  for (let i = 0; i < maxPassCount; i += 1) {
    svgjs = svg2js(svgstr);
    if (svgjs.error == null) {
      const plugins = config.plugins || defaultPlugins;
      if (Array.isArray(plugins) === false) {
        throw Error('Invalid plugins list. Provided \'plugins\' in config should be an array.');
      }
      const resolvedPlugins = plugins.map(plugin => resolvePluginConfig(plugin, config))
      svgjs = invokePlugins(svgjs, info, resolvedPlugins);
    }
    svgjs = js2svg(svgjs, config.js2svg);
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
      if (config.path != null) {
        svgjs.path = config.path;
      }
      return svgjs;
    }
  }
  return svgjs;
};
exports.optimize = optimize;

/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which is passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
const createContentItem = (data) => {
  return new JSAPI(data);
};
exports.createContentItem = createContentItem;
