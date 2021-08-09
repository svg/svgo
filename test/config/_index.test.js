'use strict';

const path = require('path');
const { loadConfig } = require('../../lib/svgo-node.js');
const {
  resolvePluginConfig,
  extendDefaultPlugins,
} = require('../../lib/svgo/config.js');

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

      it('"params" should have property "rgb2hex" with value of true', function () {
        expect(convertColors.params).toHaveProperty('rgb2hex', true);
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
    const customPlugin = getPlugin('customPlugin', plugins);

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

  describe('allows to extend default plugins list', () => {
    const extendedPlugins = extendDefaultPlugins([
      {
        name: 'customPlugin',
        fn: () => {},
      },
      {
        name: 'removeAttrs',
        params: { atts: ['aria-label'] },
      },
      {
        name: 'cleanupIDs',
        params: { remove: false },
      },
    ]);
    const removeAttrsIndex = extendedPlugins.findIndex(
      (item) => item.name === 'removeAttrs'
    );
    const cleanupIDsIndex = extendedPlugins.findIndex(
      (item) => item.name === 'cleanupIDs'
    );
    it('should preserve internal plugins order', () => {
      expect(removeAttrsIndex).toEqual(41);
      expect(cleanupIDsIndex).toEqual(11);
    });
    it('should activate inactive by default plugins', () => {
      const removeAttrsPlugin = resolvePluginConfig(
        extendedPlugins[removeAttrsIndex]
      );
      const cleanupIDsPlugin = resolvePluginConfig(
        extendedPlugins[cleanupIDsIndex]
      );
      expect(removeAttrsPlugin.active).toEqual(true);
      expect(cleanupIDsPlugin.active).toEqual(true);
    });
    it('should leave not extended inactive plugins to be inactive', () => {
      const inactivePlugin = resolvePluginConfig(
        extendedPlugins.find((item) => item.name === 'addClassesToSVGElement')
      );
      expect(inactivePlugin.active).toEqual(false);
    });
    it('should put custom plugins in the end', () => {
      expect(extendedPlugins[extendedPlugins.length - 1].name).toEqual(
        'customPlugin'
      );
    });
  });

  describe('config', () => {
    it('is loaded by absolute path', async () => {
      const config = await loadConfig(
        path.join(process.cwd(), './test/config/fixtures/one/two/config.js')
      );
      expect(config).toEqual({ plugins: [] });
    });
    it('is loaded by relative path to cwd', async () => {
      const config = await loadConfig(
        'one/two/config.js',
        path.join(process.cwd(), './test/config/fixtures')
      );
      expect(config).toEqual({ plugins: [] });
    });
    it('is searched in cwd and up', async () => {
      const config = await loadConfig(
        null,
        path.join(process.cwd(), './test/config/fixtures/one/two')
      );
      expect(config).toEqual({ plugins: [] });
    });
    it('gives null when config is not found', async () => {
      const config = await loadConfig(
        null,
        path.join(process.cwd(), './test/config')
      );
      expect(config).toEqual(null);
    });
    it('is failed when specified config does not exist', async () => {
      try {
        await loadConfig('{}');
        expect.fail('Config is loaded successfully');
      } catch (error) {
        expect(error.message).toMatch(/Cannot find module/);
      }
    });
    it('is failed to load when module exports not an object', async () => {
      try {
        await loadConfig(
          path.join(process.cwd(), './test/config/fixtures/invalid-null.js')
        );
        expect.fail('Config is loaded successfully');
      } catch (error) {
        expect(error.message).toMatch(/Invalid config file/);
      }
      try {
        await loadConfig(
          path.join(process.cwd(), './test/config/fixtures/invalid-array.js')
        );
        expect.fail('Config is loaded successfully');
      } catch (error) {
        expect(error.message).toMatch(/Invalid config file/);
      }
      try {
        await loadConfig(
          path.join(process.cwd(), './test/config/fixtures/invalid-string.js')
        );
        expect.fail('Config is loaded successfully');
      } catch (error) {
        expect(error.message).toMatch(/Invalid config file/);
      }
    });
    it('handles config errors properly', async () => {
      try {
        await loadConfig(
          null,
          path.join(process.cwd(), './test/config/fixtures/invalid/config')
        );
        expect.fail('Config is loaded successfully');
      } catch (error) {
        expect(error.message).toMatch(/plugins is not defined/);
      }
    });
    it('handles MODULE_NOT_FOUND properly', async () => {
      try {
        await loadConfig(
          path.join(process.cwd(), './test/config/fixtures/module-not-found.js')
        );
        expect.fail('Config is loaded successfully');
      } catch (error) {
        expect(error.message).toMatch(/Cannot find module 'unknown-module'/);
      }
    });
  });
});

function getPlugin(name, plugins) {
  return plugins.find((plugin) => plugin.name === name);
}
