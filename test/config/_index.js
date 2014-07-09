'use strict';

var CONFIG = require(process.env.COVERAGE ?
                     '../../lib-cov/svgo/config' :
                     '../../lib/svgo/config');

describe('config', function() {

    describe('default config', function() {

        var config = CONFIG();

        it('should be an instance of Object', function() {
            config.should.be.an.instanceOf(Object);
        });

        it('should have property "plugins"', function() {
            config.should.have.property('plugins');
        });

        it('"plugins" should be an instance of Array', function() {
            config.plugins.should.be.an.instanceOf(Array);
        });

    });

    describe('extend config with object', function() {

        var config = CONFIG({
                plugins: [
                    { removeDoctype: false },
                    { convertColors: { shorthex: false } },
                    { removeRasterImages: { param: true } }
                ]
            }),
            removeDoctype = getPlugin('removeDoctype', config.plugins),
            convertColors = getPlugin('convertColors', config.plugins),
            removeRasterImages = getPlugin('removeRasterImages', config.plugins),
            prefixIDs = getPlugin('prefixIDs', config.plugins);

        it('removeDoctype plugin should be disabled', function() {
            return removeDoctype.active.should.be.false;
        });

        describe('enable plugin with params object', function() {

            it('removeRasterImages plugin should be enabled', function() {
                return removeRasterImages.active.should.be.true;
            });

            it('removeRasterImages plugin should have property "params"', function() {
                return removeRasterImages.should.have.property('params');
            });

            it('"params" should be an instance of Object', function() {
                return removeRasterImages.params.should.be.an.instanceOf(Object);
            });

            it('"params" should have property "param" with value of true', function() {
                return removeRasterImages.params.should.have.property('param', true);
            });

        });

        describe('extend plugin params with object', function() {

            it('convertColors plugin should have property "params"', function() {
                return convertColors.should.have.property('params');
            });

            it('"params" should be an instance of Object', function() {
                return convertColors.params.should.be.an.instanceOf(Object);
            });

            it('"params" should have property "shorthex" with value of false', function() {
                return convertColors.params.should.have.property('shorthex', false);
            });

            it('"params" should have property "rgb2hex" with value of true', function() {
                return convertColors.params.should.have.property('rgb2hex', true);
            });

        });

    });

    describe('replace default config with custom', function() {

        var config = CONFIG({
                full: true,
                plugins: [
                    { removeDoctype: true }
                ]
            }),
            removeDoctype = getPlugin('removeDoctype', config.plugins);

        it('config.plugins should have length 1', function() {
            return config.plugins.should.have.length(1);
        });

        it('removeDoctype plugin should be enabled', function() {
            return removeDoctype.active.should.be.true;
        });

    });

});

function getPlugin(name, plugins) {

    var found;

    plugins.forEach(function(group) {
        group.forEach(function(plugin) {
            if (plugin.name === name) {
                found = plugin;
            }
        });
    });

    return found;

}
