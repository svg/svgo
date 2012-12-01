'use strict';

var cover = process.argv[3] === 'mocha-istanbul',
    config = require(cover ? '../../lib-cov/svgo/config' : '../../lib/svgo/config');

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

        var result;

        before(function(done) {
            config().then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('result should exists', function() {
            result.should.exist;
        });

        it('result should be an instance of Object', function() {
            result.should.be.an.instanceOf(Object);
        });

        it('result should have property "svg2js" with instance of Object', function() {
            result.should.have.property('svg2js').with.instanceOf(Object);
        });

        it('result should have property "js2svg" with instance of Object', function() {
            result.should.have.property('js2svg').with.instanceOf(Object);
        });

        it('result should have property "plugins" with instance of Array', function() {
            result.should.have.property('plugins').with.instanceOf(Array);
        });

    });

    describe('extend default config with object', function() {

        var result,
            myConfig = {
                plugins: [{
                    name: 'removeDoctype',
                    active: false
                }]
            };

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('result should exists', function() {
            getPlugin('removeDoctype', result).active.should.be.false;
        });

    });

    describe('extend default config with file', function() {

        var myConfig = {
                coa: {
                    config: './test/config/config.yml'
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('result should exists', function() {
            getPlugin('removeDoctype', result).active.should.be.false;
        });

    });

    describe('extend default config with file that does not exist', function() {

        var myConfig = {
                coa: {
                    config: './test/config/unknown.yml'
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('result should exists', function() {
            result.should.exists;
        });

        it('result should be an instance of Object', function() {
            result.should.be.an.instanceOf(Object);
        });

    });

    describe('change plugins states with --disable', function() {

        var myConfig = {
                coa: {
                    disable: ['removeDoctype', 'cleanupAttrs', 'unknownPlugin']
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('removeDoctype plugin should be disabled', function() {
            getPlugin('removeDoctype', result).active.should.be.false;
        });

        it('cleanupAttrs plugin should be disabled', function() {
            getPlugin('cleanupAttrs', result).active.should.be.false;
        });

    });

    describe('change plugins states with --enable', function() {

        var myConfig = {
                coa: {
                    enable: ['removeDoctype']
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('removeDoctype plugin should be disabled', function() {
            getPlugin('removeDoctype', result).active.should.be.true;
        });

    });

    describe('change config.js2svg.pretty with --pretty', function() {

        var myConfig = {
                coa: {
                    pretty: true
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .done();
        });

        it('removeDoctype plugin should be disabled', function() {
            result.js2svg.pretty.should.be.true;
        });

    });

});
