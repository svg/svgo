'use strict';

var FS = require('fs');
var yaml = require('js-yaml');

var EXTEND = require('whet.extend');

/**
 * Read and/or extend/replace default config file,
 * prepare and optimize plugins array.
 *
 * @param {Object} [config] input config
 * @return {Object} output config
 */
module.exports = function(config) {

    var defaults;

    if (config && config.full) {

        defaults = config;

        if (defaults.plugins) {
            defaults.plugins = preparePluginsArray(defaults.plugins);
            defaults.plugins = optimizePluginsArray(defaults.plugins);
        }

    } else {

        defaults = EXTEND({}, yaml.safeLoad(FS.readFileSync(__dirname + '/../../.svgo.yml', 'utf8')));

        defaults.plugins = preparePluginsArray(defaults.plugins);

        if (config) {
            defaults = extendConfig(defaults, config);
        }

        defaults.plugins = optimizePluginsArray(defaults.plugins);

    }

    return defaults;

};

/**
 * Require() all plugins in array.
 *
 * @param {Array} plugins input plugins array
 * @return {Array} input plugins array of arrays
 */
function preparePluginsArray(plugins) {

    var plugin,
        key;

    return plugins.map(function(item) {

        // {}
        if (typeof item === 'object') {

            key = Object.keys(item)[0];
            plugin = EXTEND({}, require('../../plugins/' + key));

            // name: {}
            if (typeof item[key] === 'object') {
                plugin.params = EXTEND({}, plugin.params || {}, item[key]);
                plugin.active = true;

            // name: false
            } else if (item[key] === false) {
               plugin.active = false;

            // name: true
            } else if (item[key] === true) {
               plugin.active = true;
            }

            plugin.name = key;

        // name
        } else {

            plugin = EXTEND({}, require('../../plugins/' + item));
            plugin.name = item;

        }

        return plugin;

    });

}

/**
 * Extend plugins with the custom config object.
 *
 * @param {Array} plugins input plugins
 * @param {Object} config config
 * @return {Array} output plugins
 */
function extendConfig(defaults, config) {

    var key;

    // plugins
    if (config.plugins) {

        config.plugins.forEach(function(item) {

            // {}
            if (typeof item === 'object') {

                key = Object.keys(item)[0];

                defaults.plugins.forEach(function(plugin) {

                    if (plugin.name === key) {
                        // name: {}
                        if (typeof item[key] === 'object') {
                            plugin.params = EXTEND({}, plugin.params || {}, item[key]);
                            plugin.active = true;

                        // name: false
                        } else if (item[key] === false) {
                           plugin.active = false;

                        // name: true
                        } else if (item[key] === true) {
                           plugin.active = true;
                        }
                    }

                });

            }

        });

    }

    // svg2js
    if (config.svg2js) {
        defaults.svg2js = config.svg2js;
    }

    // js2svg
    if (config.js2svg) {
        defaults.js2svg = config.js2svg;
    }

    return defaults;

}

/**
 * Try to group sequential elements of plugins array.
 *
 * @param {Object} plugins input plugins
 * @return {Array} output plugins
 */
function optimizePluginsArray(plugins) {

    var prev;

    plugins = plugins.map(function(item) {
        return [item];
    });

    plugins = plugins.filter(function(item) {

        if (prev && item[0].type === prev[0].type) {
            prev.push(item[0]);
            return false;
        }

        prev = item;

        return true;

    });

    return plugins;

}
