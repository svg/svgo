import { visit } from '../xast.js';

/**
 * @typedef {import('../types.js').XastRoot} XastRoot
 * @typedef {import('../types.js').PluginInfo} PluginInfo
 *
 * @typedef {{
 *   name: string;
 *   params?: Record<string, any>;
 *   fn: (ast: XastRoot, params: any, info: PluginInfo) => void;
 * }} ResolvedPlugin
 */

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {import('../types.js').XastRoot} ast input ast
 * @param {import('../types.js').PluginInfo} info extra information
 * @param {ResolvedPlugin[]} plugins plugins object from config
 * @param {Record<string, any | false>} overrides
 * @param {any} globalOverrides
 * @return {void}
 */
export const invokePlugins = (
  ast,
  info,
  plugins,
  overrides,
  globalOverrides,
) => {
  for (const plugin of plugins) {
    const override = overrides?.[plugin.name];
    if (override === false) {
      continue;
    }
    const params = { ...plugin.params, ...globalOverrides, ...override };

    const visitor = plugin.fn(ast, params, info);
    if (visitor != null) {
      visit(ast, visitor);
    }
  }
};

/**
 * @param {{ name: string; plugins: ResolvedPlugin[]; }} presetConfig
 * @returns {ResolvedPlugin}
 */
export const createPreset = ({ name, plugins }) => {
  return {
    name,
    fn: (ast, params, info) => {
      const { floatPrecision, overrides } = params;
      const globalOverrides = {};
      if (floatPrecision != null) {
        globalOverrides.floatPrecision = floatPrecision;
      }
      if (overrides) {
        const pluginNames = plugins.map(({ name }) => name);
        for (const pluginName of Object.keys(overrides)) {
          if (!pluginNames.includes(pluginName)) {
            console.warn(
              `You are trying to configure ${pluginName} which is not part of ${name}.\n` +
                `Try to put it before or after, for example\n\n` +
                `plugins: [\n` +
                `  {\n` +
                `    name: '${name}',\n` +
                `  },\n` +
                `  '${pluginName}'\n` +
                `]\n`,
            );
          }
        }
      }
      invokePlugins(ast, info, plugins, overrides, globalOverrides);
    },
  };
};
