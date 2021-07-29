'use strict';

const {
  defaultPlugins,
  defaultValidatePlugins,
  resolvePluginConfig,
  resolveValidatePluginConfig,
  extendDefaultPlugins,
} = require('./svgo/config.js');
const { parseSvg } = require('./parser.js');
const { stringifySvg } = require('./stringifier.js');
const { invokePlugins } = require('./svgo/plugins.js');
const JSAPI = require('./svgo/jsAPI.js');
const { encodeSVGDatauri } = require('./svgo/tools.js');
const {
  VALIDATION_ASSET_TYPE,
} = require('../pluginsValidate/validatePluginConfig.js');

exports.extendDefaultPlugins = extendDefaultPlugins;

const optimize = (input, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object');
  }
  const maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let svgjs = null;
  const info = {};
  if (config.path != null) {
    info.path = config.path;
  }
  for (let i = 0; i < maxPassCount; i += 1) {
    info.multipassCount = i;
    // TODO throw this error in v3
    try {
      svgjs = parseSvg(input, config.path);
    } catch (error) {
      return { error: error.toString(), modernError: error };
    }
    if (svgjs.error != null) {
      if (config.path != null) {
        svgjs.path = config.path;
      }
      return svgjs;
    }
    const plugins = config.plugins || defaultPlugins;
    if (Array.isArray(plugins) === false) {
      throw Error(
        "Invalid plugins list. Provided 'plugins' in config should be an array."
      );
    }
    const resolvedPlugins = plugins.map(resolvePluginConfig);
    const globalOverrides = {};
    if (config.floatPrecision != null) {
      globalOverrides.floatPrecision = config.floatPrecision;
    }
    svgjs = invokePlugins(svgjs, info, resolvedPlugins, null, globalOverrides);
    svgjs = stringifySvg(svgjs, config.js2svg);
    if (svgjs.data.length < prevResultSize) {
      input = svgjs.data;
      prevResultSize = svgjs.data.length;
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

const validate = (input, filename, type, config) => {
  if (config === undefined) {
    config = {};
  }
  let validateResult = {};

  if (config.plugins === undefined) {
    let VALIDATION_ASSET_TYPE_CONFIG = VALIDATION_ASSET_TYPE[type];
    config.plugins = VALIDATION_ASSET_TYPE_CONFIG.plugins;
  }

  if (typeof config !== 'object') {
    throw Error('Config should be an object');
  }

  const info = {};
  if (config.path !== undefined) {
    info.path = config.path;
  }

  let dataToValidate;

  if (type === 'ANIMATION') {
    dataToValidate = { data: input };
  } else {
    dataToValidate = svg2js(input);
  }

  dataToValidate.filename = filename;
  dataToValidate.type = type;

  if (dataToValidate.error !== undefined) {
    validateResult.isSVG = false;
    if (config.path !== null) {
      dataToValidate.path = config.path;
    }
    return validateResult;
  }

  const plugins = config.plugins || defaultValidatePlugins;

  if (!Array.isArray(plugins)) {
    throw Error(
      "Invalid plugins list. Provided 'plugins' in config should be an array."
    );
  }

  const resolvedPlugins = plugins.map((plugin) =>
    resolveValidatePluginConfig(plugin, config)
  );

  validateResult = invokePlugins(
    dataToValidate,
    info,
    resolvedPlugins,
    validateResult
  );

  return validateResult;
};
exports.validate = validate;

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
