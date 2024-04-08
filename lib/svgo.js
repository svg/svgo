import { parseSvg } from './parser.js';
import { stringifySvg } from './stringifier.js';
import { builtin } from './builtin.js';
import { invokePlugins } from './svgo/plugins.js';
import { encodeSVGDatauri } from './svgo/tools.js';

/**
 * @template T {any}
 * @typedef {import('./types.js').PluginConfig<T>} PluginConfig<T>
 * @typedef {import('./types.js').PresetConfig} PresetConfig
 */

const pluginsMap = {};
for (const plugin of builtin) {
  pluginsMap[plugin.name] = plugin;
}

/**
 * @template T {any}
 * @param {string | PresetConfig| PluginConfig<T>} plugin plugin name or plugin config
 * @returns {PresetConfig| PluginConfig<T> | null} plugin config or null if plugin was not found
 */
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

export const optimize = (input, config) => {
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
    if (!Array.isArray(plugins)) {
      throw Error(
        'malformed config, `plugins` property must be an array.\nSee more info here: https://github.com/svg/svgo#configuration',
      );
    }
    const resolvedPlugins = plugins
      .filter((plugin) => plugin != null)
      .map(resolvePluginConfig);

    if (resolvedPlugins.length < plugins.length) {
      console.warn(
        'Warning: plugins list includes null or undefined elements, these will be ignored.',
      );
    }

    const disablePlugins = config.disable;
    if (disablePlugins != null && !Array.isArray(disablePlugins)) {
      throw Error('malformed config, `disable` property must be an array.');
    }

    const enablePlugins = config.enable;
    if (enablePlugins != null && !Array.isArray(enablePlugins)) {
      throw Error('malformed config, `enable` property must be an array.');
    }

    const globalOverrides = {};
    if (config.floatPrecision != null) {
      globalOverrides.floatPrecision = config.floatPrecision;
    }
    const overrides = {};
    if (disablePlugins != null) {
      for (const plugin of disablePlugins) {
        overrides[plugin] = false;
      }
    }
    if (enablePlugins != null) {
      for (const plugin of enablePlugins) {
        overrides[plugin] = true;
      }
    }
    globalOverrides.overrides = overrides;
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
