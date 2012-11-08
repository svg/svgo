var QFS = require('q-fs'),
    PATH = require('path'),
    YAML = require('yamljs'),
    extend = require('./tools').extend;

/**
 * Read and/or extend default config file,
 * prepare and optimize plugins array.
 *
 * @module config
 *
 * @param {Object} [params] config object to extend or coa params
 *
 * @return {Object} config deferred promise
 */
module.exports = function(params) {

    return _getConfig(params).then(function(config) {

        config.plugins = preparePluginsArray(config.plugins);
        config.plugins = optimizePluginsArray(config.plugins);

        return config;

    });

};

/**
 * Get default or extended config.
 *
 * @param {Object} [params] config object to extend or coa params
 *
 * @return {Object} default or extended config
 *
 * @private
 */
function _getConfig(params) {

    var defaultConfigPath = PATH.resolve(__dirname, '../config.yml');

    // if there are no any params then return default config
    if (!params) return readConfig(defaultConfigPath);

    // COA params
    if (params.coa) {

        params = params.coa;

        return readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                // --pretty
                if (params.pretty) defaultConfig.js2svg.pretty = true;

                // --disable
                if (params.disable) return changePluginsState(params.disable, false, defaultConfig);

                // --enable
                if (params.enable) return changePluginsState(params.enable, true, defaultConfig);

                // --config
                if (params.config) {

                    var localConfigPath = PATH.resolve(process.cwd, params.config);

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

    // inline {} params
    } else {

        // return extended default
        return readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                if (params) {
                    return extend(true, defaultConfig, params);
                }

                return defaultConfig;

            });

    }

}

/**
 * Read and YAML.parse config file by path.
 *
 * @param {String} path config path
 *
 * @return {Object} read config deferred promise
 */
function readConfig(path) {

    return QFS.read(path)
        .then(function(data) {
            return YAML.parse(data.toString());
        });

}

/**
 * Require() all plugins in array and convert it to array of arrays.
 *
 * @param {Array} plugins input plugins array
 *
 * @return {Array} input plugins array of arrays
 */
function preparePluginsArray(plugins) {

    return plugins.map(function(plugin) {
        plugin.fn = require('../plugins/' + plugin.name)[plugin.name];

        return [plugin];
    });

}

/**
 * Try to group sequential elements of plugins array.
 *
 * @param {Object} plugins input plugins array
 *
 * @return {Array} output plugins array
 */
function optimizePluginsArray(plugins) {

    var prev;

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

/**
 * Change plugins state by names array.
 *
 * @param {Array} names plugins names
 * @param {Boolean} state active state
 * @param {Object} config original config
 *
 * @return {Object} changed config
 */
function changePluginsState(names, state, config) {

    config.plugins.forEach(function(plugin) {
        if (names.indexOf(plugin.name) > -1) {
            plugin.active = state;
        }
    });

    return config;

}
