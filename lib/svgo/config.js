'use strict';

const pluginsMap = require('../../plugins/plugins.js');

/**
 * Read and/or extend/replace default config file,
 * prepare and optimize plugins array.
 *
 * @param {Object} [config] input config
 * @return {Object} output config
 */
module.exports = function(config) {

    var defaults;
    config = typeof config == 'object' && config || {};

    if (config.plugins && !Array.isArray(config.plugins)) {
        return { error: 'Error: Invalid plugins list. Provided \'plugins\' in config should be an array.' };
    }

    defaults = config;

    if (Array.isArray(defaults.plugins)) {
        defaults.plugins = preparePluginsArray(config, defaults.plugins);
    }

    if ('floatPrecision' in config && Array.isArray(defaults.plugins)) {
        defaults.plugins.forEach(function(plugin) {
            if (plugin.params && ('floatPrecision' in plugin.params)) {
                // Don't touch default plugin params
                plugin.params = Object.assign({}, plugin.params, { floatPrecision: config.floatPrecision });
            }
        });
    }

    if ('datauri' in config) {
        defaults.datauri = config.datauri;
    }

    if (Array.isArray(defaults.plugins)) {
        defaults.plugins = optimizePluginsArray(defaults.plugins);
    } else {
      defaults.plugins = [];
    }

    return defaults;

};

/**
 * Require() all plugins in array.
 *
 * @param {Object} config
 * @param {Array} plugins input plugins array
 * @return {Array} input plugins array of arrays
 */
function preparePluginsArray(config, plugins) {

    var plugin,
        key;

    return plugins.map(function(item) {

        // {}
        if (typeof item === 'object') {

            key = Object.keys(item)[0];

            // custom
            if (typeof item[key] === 'object' && item[key].fn && typeof item[key].fn === 'function') {
                plugin = setupCustomPlugin(key, item[key]);

            } else {

                plugin = setPluginActiveState(
                    { ...pluginsMap[key] },
                    item,
                    key
                );
                plugin.name = key;
            }

        // name
        } else {

            plugin = { ...pluginsMap[item] };
            plugin.name = item;
            if (typeof plugin.params === 'object') {
                plugin.params = Object.assign({}, plugin.params);
            }

        }

        return plugin;

    });

}

/**
 * Setup and enable a custom plugin
 *
 * @param {String} plugin name
 * @param {Object} custom plugin
 * @return {Array} enabled plugin
 */
function setupCustomPlugin(name, plugin) {
    plugin.active = true;
    plugin.params = Object.assign({}, plugin.params || {});
    plugin.name = name;

    return plugin;
}

/**
 * Try to group sequential elements of plugins array.
 *
 * @param {Object} plugins input plugins
 * @return {Array} output plugins
 */
function optimizePluginsArray(plugins) {

    var prev;

    return plugins.reduce(function(plugins, item) {
        if (prev && item.type == prev[0].type) {
            prev.push(item);
        } else {
            plugins.push(prev = [item]);
        }
        return plugins;
    }, []);

}

/**
 * Sets plugin to active or inactive state.
 *
 * @param {Object} plugin
 * @param {Object} item
 * @param {Object} key
 * @return {Object} plugin
 */
function setPluginActiveState(plugin, item, key) {
    // name: {}
    if (typeof item[key] === 'object') {
        plugin.params = Object.assign({}, plugin.params || {}, item[key]);
        plugin.active = true;

    // name: false
    } else if (item[key] === false) {
        plugin.active = false;

    // name: true
    } else if (item[key] === true) {
        plugin.active = true;
    }

    return plugin;
}
