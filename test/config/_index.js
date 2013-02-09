'use strict';

var CHAI = require('chai'),
    cover = process.argv[3] === 'mocha-istanbul',
    config = require(cover ? '../../lib-cov/svgo/config' : '../../lib/svgo/config');

require('mocha-as-promised')(require('mocha'));
CHAI.use(require('chai-as-promised'));
CHAI.should();

function getPlugin(name, config) {

    var found;

    config.plugins.forEach(function(group) {
        group.forEach(function(plugin) {
            if (plugin.name === name) {
                found = plugin;
            }
        });
    });

    return found;

}

describe('config', function() {

    describe('default config', function() {

        var defaultConfig = config();

        it('should fulfilled', function() {
            return defaultConfig.should.fulfilled;
        });

        it('should eventually be an instance of Object', function() {
            return defaultConfig.should.eventually.be.an.instanceOf(Object);
        });

        it('should eventually have property "svg2js"', function() {
            return defaultConfig.should.eventually.have.property('svg2js');
        });

        it('should eventually have property "js2svg"', function() {
            return defaultConfig.should.eventually.have.property('js2svg');
        });

        it('should eventually have property "plugins"', function() {
            return defaultConfig.should.eventually.have.property('plugins');
        });

    });

    describe('extend with object', function() {

        var myConfig = {
                plugins: [{
                    name: 'removeDoctype',
                    active: false
                }]
            },
            extendedConfig = config(myConfig);

        it('removeDoctype plugin should be disabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('removeDoctype', data).active.should.be.false;
            });
        });

    });

    describe('extend with file', function() {

        var myConfig = {
                coa: {
                    config: './test/config/config.yml'
                }
            },
            extendedConfig = config(myConfig);

        it('removeDoctype plugin should be disabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('removeDoctype', data).active.should.be.false;
            });
        });

    });

    describe('extend with file that does not exist', function() {

        var myConfig = {
                coa: {
                    config: './test/config/unknown.yml'
                }
            },
            extendedConfig = config(myConfig);

        it('removeDoctype plugin should be enabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('removeDoctype', data).active.should.be.true;
            });
        });

    });

    describe('change plugins states with --disable', function() {

        var myConfig = {
                coa: {
                    disable: ['removeDoctype', 'cleanupAttrs', 'unknownPlugin']
                }
            },
            extendedConfig = config(myConfig);

        it('removeDoctype plugin should be disabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('removeDoctype', data).active.should.be.false;
            });
        });

        it('cleanupAttrs plugin should be disabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('cleanupAttrs', data).active.should.be.false;
            });
        });

    });

    describe('change plugins states with --enable', function() {

        var myConfig = {
                coa: {
                    enable: ['removeDoctype', 'cleanupAttrs', 'unknownPlugin']
                }
            },
            extendedConfig = config(myConfig);

        it('removeDoctype plugin should be disabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('removeDoctype', data).active.should.be.true;
            });
        });

        it('cleanupAttrs plugin should be disabled', function() {
            return extendedConfig.then(function(data) {
                return getPlugin('cleanupAttrs', data).active.should.be.true;
            });
        });

    });

    describe('change config.js2svg.pretty with --pretty', function() {

        var myConfig = {
                coa: {
                    pretty: true
                }
            },
            extendedConfig = config(myConfig);

        it('config.js2svg.pretty should be true', function() {
            return extendedConfig.then(function(data) {
                return data.js2svg.pretty.should.be.true;
            });
        });

    });

});
