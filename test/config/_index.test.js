'use strict';

const { resolvePluginConfig } = require('../../lib/svgo/config.js');

describe('config', function () {
  describe('extend config with object', function () {
    var plugins = [
      { name: 'removeDoctype', active: false },
      { name: 'convertColors', params: { shorthex: false } },
      { name: 'removeRasterImages', params: { param: true } },
    ].map((plugin) => resolvePluginConfig(plugin));
    const removeDoctype = getPlugin('removeDoctype', plugins);
    const convertColors = getPlugin('convertColors', plugins);
    const removeRasterImages = getPlugin('removeRasterImages', plugins);

    it('removeDoctype plugin should be disabled', function () {
      expect(removeDoctype.active).toEqual(false);
    });

    describe('enable plugin with params object', function () {
      it('removeRasterImages plugin should be enabled', function () {
        expect(removeRasterImages.active).toEqual(true);
      });

      it('removeRasterImages plugin should have property "params"', function () {
        expect(removeRasterImages).toHaveProperty('params');
      });

      it('"params" should be an instance of Object', function () {
        expect(removeRasterImages.params).toBeInstanceOf(Object);
      });

      it('"params" should have property "param" with value of true', function () {
        expect(removeRasterImages.params).toHaveProperty('param', true);
      });
    });

    describe('extend plugin params with object', function () {
      it('convertColors plugin should have property "params"', function () {
        expect(convertColors).toHaveProperty('params');
      });

      it('"params" should be an instance of Object', function () {
        expect(convertColors.params).toBeInstanceOf(Object);
      });

      it('"params" should have property "shorthex" with value of false', function () {
        expect(convertColors.params).toHaveProperty('shorthex', false);
      });
    });
  });

  describe('replace default config with custom', function () {
    const config = {
      multipass: true,
      plugins: [
        'convertPathData',
        { name: 'cleanupNumericValues' },
        { name: 'customPlugin', fn: () => {} },
      ],
    };
    const plugins = config.plugins.map((plugin) => resolvePluginConfig(plugin));
    const cleanupNumericValues = getPlugin('cleanupNumericValues', plugins);
    const convertPathData = getPlugin('convertPathData', plugins);

    it('should have "multipass"', function () {
      expect(config.multipass).toEqual(true);
    });

    it('config.plugins should have length 3', function () {
      expect(plugins).toHaveLength(3);
    });

    it('specified plugins should be enabled', function () {
      expect(cleanupNumericValues.active).toEqual(true);
      expect(convertPathData.active).toEqual(true);
    });
  });

  describe('custom plugins', function () {
    describe('extend config with custom plugin', function () {
      const plugins = [
        {
          name: 'aCustomPlugin',
          type: 'perItem',
          fn: function () {},
        },
      ].map((plugin) => resolvePluginConfig(plugin));
      const customPlugin = getPlugin('aCustomPlugin', plugins);

      it('custom plugin should be enabled', function () {
        expect(customPlugin.active).toEqual(true);
      });

      it('custom plugin should have been given a name', function () {
        expect(customPlugin.name).toEqual('aCustomPlugin');
      });
    });

    describe('replace default config with custom plugin', function () {
      const plugins = [
        {
          name: 'aCustomPlugin',
          type: 'perItem',
          fn: function () {},
        },
      ].map((plugin) => resolvePluginConfig(plugin));
      const customPlugin = getPlugin('aCustomPlugin', plugins);

      it('config.plugins should have length 1', function () {
        expect(plugins).toHaveLength(1);
      });

      it('custom plugin should be enabled', function () {
        expect(customPlugin.active).toEqual(true);
      });

      it('custom plugin should have been given a name', function () {
        expect(customPlugin.name).toEqual('aCustomPlugin');
      });
    });
  });
});

function getPlugin(name, plugins) {
  return plugins.find((plugin) => plugin.name === name);
}
