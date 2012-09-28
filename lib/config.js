var QFS = require('q-fs'),
    PATH = require('path'),
    extend = require('./tools').extend;

module.exports = function(options) {

    var defaultConfigPath = PATH.resolve(__dirname, '../.svgo');

    // if there are no any options then return default config
    if (!options) return readConfig(defaultConfigPath);

    // COA options
    if (options.coa) {

        options = options.coa;

        return readConfig(defaultConfigPath)
            .then(function(defaultConfig) {

                // --disable
                if (options.disable) return pluginsFromCOA(defaultConfig, options.disable, false);

                // --enable
                if (options.enable) return pluginsFromCOA(defaultConfig, options.enable, true);

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

function readConfig(path) {

    return QFS.read(path)
        .then(function(data) {
            return JSON.parse(data);
        });

};

function pluginsFromCOA(defaultConfig, names, active) {

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
