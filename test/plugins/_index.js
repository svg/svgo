var QFS = require('q-fs'),
    FS = require('fs'),
    PATH = require('path'),
    CONFIG = require('../../lib/config'),
    SVGO = require('../../lib/svgo'),
    regFilename = /^(.*)\.(\d+)\.orig\.svg$/;

describe('plugins tests', function() {

    FS.readdirSync(__dirname).forEach(function(file) {

        var match = file.match(regFilename),
            index,
            name,
            result;

        if (match) {
            name = match[1];
            index = match[2];

            before(function(done) {
                getResult(name, index).then(function(data) {
                    result = data;

                    done();
                })
                .end();
            });

            it(name + '.' + index, function() {
                result[0].should.be.equal(result[1]);
            });
        }

    });

});

function getResult(name, index) {
    return prepareConfig(name)
        .then(function(config) {
            return readFile(name + '.' + index + '.orig.svg')
                .then(function(input) {
                    return new SVGO(config).optimize(input.toString());
                });
        })
        .then(function(min) {
            return readFile(name + '.' + index +'.should.svg')
                .then(function(output) {
                    return [min.data, output.toString()];
                });
        });
}

function prepareConfig(name) {

    return CONFIG()
        .then(function(config) {
            for (var type in config.plugins) {
                config.plugins[type].forEach(function(plugin) {
                    if (plugin.name !== name) {
                        plugin.active = false;
                    }
                });
            }

            config.js2svg.pretty = true;

            return config;
        });

}

function readFile(path) {
    return QFS.read(PATH.resolve(__dirname, path));
}
