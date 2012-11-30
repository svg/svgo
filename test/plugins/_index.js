'use strict';

var INHERIT = require('inherit'),
    QFS = require('q-fs'),
    FS = require('fs'),
    PATH = require('path'),
    regFilename = /^(.*)\.(\d+)\.orig\.svg$/;

var MySVGO = INHERIT(require('../../lib/svgo'), {

        enableOnlyOne: function(name) {

            this.config = this.config.then(function(config) {

                config.plugins.forEach(function(group) {
                    group.forEach(function(plugin) {
                        plugin.active = plugin.name === name;
                    });

                });

                return config;

            });

        }

    }),
    mySVGO = new MySVGO({
        js2svg: {
            pretty: true
        }
    });

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
                .done();
            });

            it(name + '.' + index, function() {
                result[0].should.be.equal(result[1]);
            });
        }

    });

});

function getResult(name, index) {
    return readFile(name + '.' + index + '.orig.svg')
        .then(function(input) {
            mySVGO.enableOnlyOne(name);

            return mySVGO.fromString(input.toString());
        })
        .then(function(min) {
            return readFile(name + '.' + index +'.should.svg')
                .then(function(output) {
                    return [min.data, output.toString()];
                });
        });
}

function readFile(path) {
    return QFS.read(PATH.resolve(__dirname, path));
}
