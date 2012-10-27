var config = require('../../lib/config');

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
            .end();
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
            .end();
        });

        it('result should exists', function() {
            getPlugin('removeDoctype', result).active.should.be.false;
        });

    });

    describe('extend default config with file', function() {

        var myConfig = {
                coa: {
                    config: './test/config/config.json'
                }
            },
            result;

        before(function(done) {
            config(myConfig).then(function(data) {
                result = data;
                done();
            })
            .end();
        });

        it('result should exists', function() {
            getPlugin('removeDoctype', result).active.should.be.false;
        });

    });

});
