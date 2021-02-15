'use strict';

const { expect } = require('chai');

var CONFIG = require('../../lib/svgo/config');

describe('config', function() {

    describe('default config', function() {

        var config = CONFIG();

        it('should be an instance of Object', function() {
            expect(config).to.be.an.instanceOf(Object);
        });

        it('should have property "plugins"', function() {
            expect(config).to.have.property('plugins');
        });

        it('"plugins" should be an instance of Array', function() {
            expect(config.plugins).to.be.an.instanceOf(Array);
        });

    });

    describe('extend config with object', function() {

        var config = CONFIG({
                multipass: true,
                plugins: [
                    { name: 'removeDoctype', active: false },
                    { name: 'convertColors', params: { shorthex: false } },
                    { name: 'removeRasterImages', params: { param: true } }
                ]
            }),
            removeDoctype = getPlugin('removeDoctype', config.plugins),
            convertColors = getPlugin('convertColors', config.plugins),
            removeRasterImages = getPlugin('removeRasterImages', config.plugins);

        it('should have "multipass"', function() {
            expect(config.multipass).to.be.true;
        });

        it('removeDoctype plugin should be disabled', function() {
            expect(removeDoctype.active).to.be.false;
        });

        describe('enable plugin with params object', function() {

            it('removeRasterImages plugin should be enabled', function() {
                expect(removeRasterImages.active).to.be.true;
            });

            it('removeRasterImages plugin should have property "params"', function() {
                expect(removeRasterImages).to.have.property('params');
            });

            it('"params" should be an instance of Object', function() {
                expect(removeRasterImages.params).to.be.an.instanceOf(Object);
            });

            it('"params" should have property "param" with value of true', function() {
                expect(removeRasterImages.params).to.have.property('param', true);
            });

        });

        describe('extend plugin params with object', function() {

            it('convertColors plugin should have property "params"', function() {
                expect(convertColors).to.have.property('params');
            });

            it('"params" should be an instance of Object', function() {
                expect(convertColors.params).to.be.an.instanceOf(Object);
            });

            it('"params" should have property "shorthex" with value of false', function() {
                expect(convertColors.params).to.have.property('shorthex', false);
            });

            it('"params" should have property "rgb2hex" with value of true', function() {
                expect(convertColors.params).to.have.property('rgb2hex', true);
            });

        });

    });

    describe('replace default config with custom', function() {

        var config = CONFIG({
                multipass: true,
                floatPrecision: 2,
                plugins: [
                    { name: 'cleanupNumericValues' }
                ]
            }),
            cleanupNumericValues = getPlugin('cleanupNumericValues', config.plugins);

        it('should have "multipass"', function() {
            expect(config.multipass).to.be.true;
        });

        it('config.plugins should have length 1', function() {
            expect(config.plugins).to.have.length(1);
        });

        it('cleanupNumericValues plugin should be enabled', function() {
            expect(cleanupNumericValues.active).to.be.true;
        });

        it('cleanupNumericValues plugin should have floatPrecision set from parameters', function() {
            expect(cleanupNumericValues.params.floatPrecision).to.be.equal(2);
        });

    });


    describe('custom plugins', function() {

        describe('extend config with custom plugin', function() {
            var config = CONFIG({
                    plugins: [
                        {
                            name: 'aCustomPlugin',
                            type: 'perItem',
                            fn: function() { }
                        }
                    ]
                }),
                customPlugin = getPlugin('aCustomPlugin', config.plugins);

            it('custom plugin should be enabled', function() {
                expect(customPlugin.active).to.be.true;
            });

            it('custom plugin should have been given a name', function() {
                expect(customPlugin.name).to.equal('aCustomPlugin');
            });
        });

        describe('replace default config with custom plugin', function() {

            var config = CONFIG({
                    plugins: [
                        {
                            name: 'aCustomPlugin',
                            type: 'perItem',
                            fn: function() { }
                        }
                    ]
                }),
                customPlugin = getPlugin('aCustomPlugin', config.plugins);

            it('config.plugins should have length 1', function() {
                expect(config.plugins).to.have.length(1);
            });

            it('custom plugin should be enabled', function() {
                expect(customPlugin.active).to.be.true;
            });

            it('custom plugin should have been given a name', function() {
                expect(customPlugin.name).to.equal('aCustomPlugin');
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
