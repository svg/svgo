var should = require('should'),
    config = require('../lib/config');

describe('config', function() {

    describe('default config', function() {

        var result;

        before(function(done) {
            config().then(function(data) {
                result = data;
                done();
            });
        });

        it('result should exists', function() {
            result.should.exist;
        });

        it('result should be an instance of Object', function() {
            result.should.be.an.instanceOf(Object);
        });

        it('result should have property "saxXMLParser" with instance of Object', function() {
            result.should.have.property('saxXMLParser').with.instanceOf(Object);
        });

        it('result should have property "plugins" with instance of Object', function() {
            result.should.have.property('plugins').with.instanceOf(Object);
        });

        it('plugins should have property "directPass" with instance of Array', function() {
            result.plugins.should.have.property('directPass').with.instanceOf(Array);
        });

        it('directPass should include "removeDoctype" plugin with default params', function() {
            result.plugins.directPass.should.includeEql({
                name: 'removeDoctype',
                active: true
            });
        });

    });

    describe('extending default config with object', function() {

        var myConfig = {
                config: {
                    plugins: {
                        directPass: [
                            { name: 'removeDoctype', active: false },
                            { name: 'myTestPlugin', active: true }
                        ]
                    }
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            });
        });

        it('directPass should include extended "removeDoctype" plugin', function() {
            result.plugins.directPass.should.includeEql({
                name: 'removeDoctype',
                active: false
            });
        });

        it('directPass should include new "myTestPlugin" plugin', function() {
            result.plugins.directPass.should.includeEql({
                name: 'myTestPlugin',
                active: true
            });
        });

    });

    describe('extending default config with file', function() {

        var myConfig = {
                config: './test/config.cfg'
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            });
        });

        it('directPass should include extended "removeDoctype" plugin', function() {
            result.plugins.directPass.should.includeEql({
                name: 'removeDoctype',
                active: false
            });
        });

        it('directPass should include new "myTestPlugin" plugin', function() {
            result.plugins.directPass.should.includeEql({
                name: 'myTestPlugin',
                active: true
            });
        });

    });

});
