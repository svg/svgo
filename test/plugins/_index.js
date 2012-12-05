'use strict';

var CHAI = require('chai'),
    INHERIT = require('inherit'),
    QFS = require('q-fs'),
    FS = require('fs'),
    PATH = require('path'),
    regFilename = /^(.*)\.(\d+)\.orig\.svg$/;

require('mocha-as-promised')(require('mocha'));
CHAI.use(require('chai-as-promised'));
CHAI.should();

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
            name;

        if (match) {
            name = match[1];
            index = match[2];

            it(name + '.' + index, function() {
                return getResult(name, index).then(function(data) {
                    return data[0].should.be.equal(data[1]);
                });
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
