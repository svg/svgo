'use strict';

const pluginsMap = require('../../plugins/plugins.js');

const pluginsOrder = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeXMLNS',
  'removeEditorsNSData',
  'cleanupAttrs',
  'mergeStyles',
  'inlineStyles',
  'minifyStyles',
  'convertStyleToAttrs', // inactive
  'cleanupIDs',
  'prefixIds', // inactive
  'removeRasterImages', // inactive
  'removeUselessDefs',
  'cleanupNumericValues',
  'cleanupListOfValues', // inactive
  'convertColors',
  'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs',
  'removeUselessStrokeAndFill',
  'removeViewBox',
  'cleanupEnableBackground',
  'removeHiddenElems',
  'removeEmptyText',
  'convertShapeToPath',
  'convertEllipseToCircle',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'convertPathData',
  'convertTransform',
  'removeEmptyAttrs',
  'removeEmptyContainers',
  'mergePaths',
  'removeUnusedNS',
  'sortAttrs', // inactive
  'sortDefsChildren',
  'removeTitle',
  'removeDesc',
  'removeDimensions', // inactive
  'removeAttrs', // inactive
  'removeAttributesBySelector', // inactive
  'removeElementsByAttr', // inactive
  'addClassesToSVGElement', // inactive
  'removeStyleElement', // inactive
  'removeScriptElement', // inactive
  'addAttributesToSVGElement', // inactive
  'removeOffCanvasPaths', // inactive
  'reusePaths', // inactive
];
const defaultPlugins = pluginsOrder.filter((name) => pluginsMap[name].active);
exports.defaultPlugins = defaultPlugins;

const extendDefaultPlugins = (plugins) => {
  const extendedPlugins = pluginsOrder.map((name) => ({
    name,
    active: pluginsMap[name].active,
  }));
  for (const plugin of plugins) {
    const resolvedPlugin = resolvePluginConfig(plugin);
    const index = pluginsOrder.indexOf(resolvedPlugin.name);
    if (index === -1) {
      extendedPlugins.push(plugin);
    } else {
      extendedPlugins[index] = plugin;
    }
  }
  return extendedPlugins;
};
exports.extendDefaultPlugins = extendDefaultPlugins;

const resolvePluginConfig = (plugin) => {
  let configParams = {};
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const pluginConfig = pluginsMap[plugin];
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
      const pluginConfig = pluginsMap[plugin.name];
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
exports.resolvePluginConfig = resolvePluginConfig;
