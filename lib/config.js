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
    if (!options) return _readConfig(defaultConfigPath);

    // COA options
    if (options.coa) {

        options = options.coa;

        return _readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                // --pretty
                if (options.pretty) defaultConfig.js2svg.pretty = true;

                // --disable
                if (options.disable) return _extendPluginsFromCOA(defaultConfig, options.disable, false);

                // --enable
                if (options.enable) return _extendPluginsFromCOA(defaultConfig, options.enable, true);

                // --config
                if (options.config) {

                    var localConfigPath = PATH.resolve(process.cwd, options.config);

                    // check for the local config file
                    return QFS.exists(localConfigPath)
                        .then(function(exist) {

                            // if it doesn't exists then return default
                            if (!exist) return defaultConfig;

                            // console.log(exists);

                            // if it exists then return extended default
                            return _readConfig(localConfigPath)
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
        return _readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                return extend(true, defaultConfig, options);

            });

    }

};

/**
 * Read and JSON.parse config file.
 *
 * @param {String} path config path
 * @return {Object} read config deferred promise
 * @private
 */
function _readConfig(path) {

    return QFS.read(path)
        .then(function(data) {
            return JSON.parse(data);
        });

};

/**
 * Extend plugins from COA's --disable and --enable opts.
 *
 * @param {Object} defaultConfig default config object
 * @param {Array} names current plugins array
 * @param {Boolean} active disable or enable plugin?
 * @return {Object} extended config
 * @private
 */
function _extendPluginsFromCOA(defaultConfig, names, active) {

    var plugins = defaultConfig.plugins;

    for (var type in plugins) {
        plugins[type].forEach(function(plugin) {
            names.forEach(function(name) {
                if (plugin.name === name) {
                    plugin.active = active;
                }
            });
        });
    };

    return defaultConfig;

};
