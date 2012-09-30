var QFS = require('q-fs'),
    PATH = require('path'),
    extend = require('./tools').extend;

/**
 * Read and/or extend default config file.
 *
 * @module config
 *
 * @param {Object} [options] options
 * @return {Object} config deferred promise
 */
module.exports = function(options) {

    var defaultConfigPath = PATH.resolve(__dirname, '../.svgo');

    // if there are no any options then return default config
    if (!options) return readConfig(defaultConfigPath);

    // COA options
    if (options.coa) {

        options = options.coa;

        return readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                // --pretty
                if (options.pretty) defaultConfig.js2svg.pretty = true;

                // --disable
                if (options.disable) return changePluginsState(options.disable, false, defaultConfig);

                // --enable
                if (options.enable) return changePluginsState(options.enable, true, defaultConfig);

                // --config
                if (options.config) {

                    var localConfigPath = PATH.resolve(process.cwd, options.config);

                    // check for the local config file
                    return QFS.exists(localConfigPath)
                        .then(function(exist) {

                            // if it doesn't exists then return default
                            if (!exist) return defaultConfig;

                            // if it exists then return extended default
                            return readConfig(localConfigPath)
                                .then(function(localConfig) {
                                    return extend(true, defaultConfig, localConfig);
                                });

                        });
                }

                return defaultConfig;

            });

    // inline {} options
    } else {

        // return extended default
        return readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                return extend(true, defaultConfig, options);

            });

    }

};

/**
 * Read and JSON.parse config file by path.
 *
 * @param {String} path config path
 * @return {Object} read config deferred promise
 * @private
 */
var readConfig = exports.readConfig = function(path) {

    return QFS.read(path)
        .then(function(data) {
            return JSON.parse(data);
        });

};

/**
 * Change plugins state by names array.
 *
 * @param {Array} names plugins names
 * @param {Boolean} state active state
 * @param {Object} config original config
 * @return {Object} changed config
 */
var changePluginsState = exports.changePluginsState = function(names, state, config) {

    getPluginsByNames(names, config).forEach(function(plugin) {
        plugin.active = state;
    });

    return config;

};

/**
 * Get plugins by names array.
 *
 * @param {Array} names plugins names
 * @param {Object} config config
 * @return {Array} plugins array
 */
var getPluginsByNames = exports.getPluginsByNames = function(names, config) {

    var plugins = [];

    for (var type in config.plugins) {
        config.plugins[type].forEach(function(plugin) {
            if (names.indexOf(plugin.name) > -1) plugins.push(plugin);
        });
    }

    return plugins;

};
