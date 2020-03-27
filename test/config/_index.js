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
                multipass: true,
                plugins: [
                    { removeDoctype: false },
                    { convertColors: { shorthex: false } },
                    { removeRasterImages: { param: true } }
                ]
            }),
            removeDoctype = getPlugin('removeDoctype', config.plugins),
            convertColors = getPlugin('convertColors', config.plugins),
            removeRasterImages = getPlugin('removeRasterImages', config.plugins);

        it('should have "multipass"', function() {
            config.multipass.should.be.true();
        });

        it('removeDoctype plugin should be disabled', function() {
            removeDoctype.active.should.be.false();
        });

        describe('enable plugin with params object', function() {

            it('removeRasterImages plugin should be enabled', function() {
                removeRasterImages.active.should.be.true();
            });

            it('removeRasterImages plugin should have property "params"', function() {
                removeRasterImages.should.have.property('params');
            });

            it('"params" should be an instance of Object', function() {
                removeRasterImages.params.should.be.an.instanceOf(Object);
            });

            it('"params" should have property "param" with value of true', function() {
                removeRasterImages.params.should.have.property('param', true);
            });

        });

        describe('extend plugin params with object', function() {

            it('convertColors plugin should have property "params"', function() {
                convertColors.should.have.property('params');
            });

            it('"params" should be an instance of Object', function() {
                convertColors.params.should.be.an.instanceOf(Object);
            });

            it('"params" should have property "shorthex" with value of false', function() {
                convertColors.params.should.have.property('shorthex', false);
            });

            it('"params" should have property "rgb2hex" with value of true', function() {
                convertColors.params.should.have.property('rgb2hex', true);
            });

        });

    });

    describe('replace default config with custom', function() {

        var config = CONFIG({
                full: true,
                multipass: true,
                floatPrecision: 2,
                plugins: [
                    { cleanupNumericValues: true }
                ]
            }),
            cleanupNumericValues = getPlugin('cleanupNumericValues', config.plugins);

        it('should have "multipass"', function() {
            config.multipass.should.be.true();
        });

        it('config.plugins should have length 1', function() {
            config.plugins.should.have.length(1);
        });

        it('cleanupNumericValues plugin should be enabled', function() {
            cleanupNumericValues.active.should.be.true();
        });

        it('cleanupNumericValues plugin should have floatPrecision set from parameters', function() {
            cleanupNumericValues.params.floatPrecision.should.be.equal(2);
        });

    });


    describe('custom plugins', function() {

        describe('extend config with custom plugin', function() {
            var config = CONFIG({
                    plugins: [
                        {
                            aCustomPlugin: {
                                type: 'perItem',
                                fn: function() { }
                            }
                        }
                    ]
                }),
                customPlugin = getPlugin('aCustomPlugin', config.plugins);

            it('custom plugin should be enabled', function() {
                customPlugin.active.should.be.true();
            });

            it('custom plugin should have been given a name', function() {
                customPlugin.name.should.equal('aCustomPlugin');
            });
        });

        describe('replace default config with custom plugin', function() {

            var config = CONFIG({
                    full: true,
                    plugins: [
                        {
                            aCustomPlugin: {
                                type: 'perItem',
                                fn: function() { }
                            }
                        }
                    ]
                }),
                customPlugin = getPlugin('aCustomPlugin', config.plugins);

            it('config.plugins should have length 1', function() {
                config.plugins.should.have.length(1);
            });

            it('custom plugin should be enabled', function() {
                customPlugin.active.should.be.true();
            });

            it('custom plugin should have been given a name', function() {
                customPlugin.name.should.equal('aCustomPlugin');
            });

        });

    });

});

function getPlugin(name, plugins) {

    var found;

    plugins.some(function(group) {
        return group.some(function(plugin) {
            if (plugin.name === name) {
                found = plugin;
                return true;
            }
        });
    });

    return found;

}
