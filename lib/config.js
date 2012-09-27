var QFS = require('q-fs'),
    PATH = require('path'),
    extend = require('./tools').extend;

module.exports = function(options) {

    var defaultConfigPath = PATH.resolve(__dirname, '../.svgo');

    if (!options || !options.config) return readConfig(defaultConfigPath);

    return readConfig(defaultConfigPath)
        .then(function(defaultConfig) {

            if (typeof options.config === 'string') {

                var localConfigPath = PATH.resolve(process.cwd, options.config);

                return QFS.exists(localConfigPath)
                    .then(function(exists) {

                        if (!exists) return defaultConfig;

                        return readConfig(localConfigPath)
                            .then(function(localConfig) {
                                return extend(true, defaultConfig, localConfig);
                            });

                    });

            }  else if (Object.prototype.toString.call(options.config) === '[object Object]') {

                return extend(true, defaultConfig, options.config);

            } else {

                // TODO: ...
                throw new Error('...');

            }

        });

};

function readConfig(path) {

    return QFS.read(path)
        .then(function(data) {
            return JSON.parse(data);
        });

};
