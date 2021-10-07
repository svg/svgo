'use strict';

const { parseSvg } = require('./parser.js');
const { stringifySvg } = require('./stringifier.js');
const { builtin } = require('./builtin.js');
const { invokePlugins } = require('./svgo/plugins.js');
const { invokeValidatePlugins } = require('./svgo/pluginValidate.js');
const { encodeSVGDatauri } = require('./svgo/tools.js');
const {
  VALIDATION_ASSET_TYPE,
} = require('../pluginsValidate/validatePluginConfig.js');

const pluginsMap = {};
for (const plugin of builtin) {
  pluginsMap[plugin.name] = plugin;
}

const { builtinValidate } = require('./builtinValidate.js');

const validatePluginsMap = {};
for (const plugin of builtinValidate) {
  validatePluginsMap[plugin.name] = plugin;
}

const resolvePluginConfig = (plugin) => {
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const builtinPlugin = pluginsMap[plugin];
    if (builtinPlugin == null) {
      throw Error(`Unknown builtin plugin "${plugin}" specified.`);
    }
    return {
      name: plugin,
      params: {},
      fn: builtinPlugin.fn,
    };
  }
  if (typeof plugin === 'object' && plugin != null) {
    if (plugin.name == null) {
      throw Error(`Plugin name should be specified`);
    }
    // use custom plugin implementation
    let fn = plugin.fn;
    if (fn == null) {
      // resolve builtin plugin implementation
      const builtinPlugin = pluginsMap[plugin.name];
      if (builtinPlugin == null) {
        throw Error(`Unknown builtin plugin "${plugin.name}" specified.`);
      }
      fn = builtinPlugin.fn;
    }
    return {
      name: plugin.name,
      params: plugin.params,
      fn,
    };
  }
  return null;
};

const resolveValidatePluginConfig = (plugin, config) => {
  let configParams = {};
  if ('floatPrecision' in config) {
    configParams.floatPrecision = config.floatPrecision;
  }
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const pluginConfig = validatePluginsMap[plugin];
    if (pluginConfig == null) {
      throw Error(`Unknown builtin plugin "${plugin}" specified.`);
    }
    return {
      ...pluginConfig,
      name: plugin,
      active: true,
      params: { ...pluginConfig.params, ...configParams },
    };
  }
  if (typeof plugin === 'object' && plugin != null) {
    if (plugin.name == null) {
      throw Error(`Plugin name should be specified`);
    }
    if (plugin.fn) {
      // resolve custom plugin with implementation
      return {
        active: true,
        ...plugin,
        params: { ...configParams, ...plugin.params },
      };
    } else {
      // resolve builtin plugin specified as object without implementation
      const pluginConfig = validatePluginsMap[plugin.name];
      if (pluginConfig == null) {
        throw Error(`Unknown builtin plugin "${plugin.name}" specified.`);
      }
      return {
        ...pluginConfig,
        active: true,
        ...plugin,
        params: { ...pluginConfig.params, ...configParams, ...plugin.params },
      };
    }
  }
  return null;
};

const optimize = (input, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object');
  }
  const maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let output = '';
  const info = {};
  if (config.path != null) {
    info.path = config.path;
  }
  for (let i = 0; i < maxPassCount; i += 1) {
    info.multipassCount = i;
    const ast = parseSvg(input, config.path);
    const plugins = config.plugins || ['preset-default'];
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
    invokePlugins(ast, info, resolvedPlugins, null, globalOverrides);
    output = stringifySvg(ast, config.js2svg);
    if (output.length < prevResultSize) {
      input = output;
      prevResultSize = output.length;
    } else {
      break;
    }
  }
  if (config.datauri) {
    output = encodeSVGDatauri(output, config.datauri);
  }
  return {
    data: output,
  };
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

  try {
    if (type === 'ANIMATION') {
      dataToValidate = { data: input };
    } else {
      dataToValidate = parseSvg(input);
    }
  } catch (error) {
    validateResult.isCorrectSvg = false;

    // TODO: Why do we need it?
    if (config.path !== null) {
      dataToValidate = {};
      dataToValidate.path = config.path;
    }
    return validateResult;
  }

  const plugins = config.plugins || ['preset-validate-default'];

  if (!Array.isArray(plugins)) {
    throw Error(
      "Invalid plugins list. Provided 'plugins' in config should be an array."
    );
  }

  const resolvedPlugins = plugins.map((plugin) =>
    resolveValidatePluginConfig(plugin, config)
  );

  validateResult = invokeValidatePlugins(
    dataToValidate,
    info,
    resolvedPlugins,
    null,
    null,
    validateResult
  );

  return validateResult;
};
exports.validate = validate;
