'use strict';

const fs = require('fs');
const path = require('path');
const {
  extendDefaultPlugins,
  optimize,
  createContentItem,
} = require('./svgo.js');

const importConfig = async configFile => {
  try {
    const config = require(configFile);
    if (config == null || typeof config !== 'object' || Array.isArray(config)) {
      throw Error(`Invalid config file "${configFile}"`);
    }
    return config;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return null;
    }
    throw error;
  }
};

const loadConfig = async (configFile, cwd = process.cwd()) => {
  if (configFile != null) {
    if (path.isAbsolute(configFile)) {
      return await importConfig(configFile);
    } else {
      return await importConfig(path.join(cwd, configFile));
    }
  }
  let dir = cwd;
  while (true) {
    try {
      const file = path.join(dir, "svgo.config.js");
      const stats = await fs.promises.stat(file);
      if (stats.isFile()) {
        return await importConfig(file);
      }
    } catch {}
    const parent = path.dirname(dir);
    if (dir === parent) {
      return null;
    }
    dir = parent;
  }
};

exports.loadConfig = loadConfig;
exports.extendDefaultPlugins = extendDefaultPlugins;
exports.optimize = optimize;
exports.createContentItem = createContentItem;
