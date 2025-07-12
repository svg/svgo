import { visit } from '../util/visit.js';

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {import('../types.js').XastNode} ast Input AST.
 * @param {any} info Extra information.
 * @param {ReadonlyArray<any>} plugins Plugins property from config.
 * @param {any} overrides
 * @param {any} globalOverrides
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
 * @template {string} T
 * @param {{ name: T, plugins: ReadonlyArray<import('../types.js').BuiltinPlugin<string, any>> }} arg0
 * @returns {import('../types.js').BuiltinPluginOrPreset<T, any>}
 */
export const createPreset = ({ name, plugins }) => {
  return {
    name,
    isPreset: true,
    plugins: Object.freeze(plugins),
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
