'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const {
  extendDefaultPlugins,
  optimize: optimizeAgnostic,
  createContentItem,
} = require('./svgo.js');

exports.extendDefaultPlugins = extendDefaultPlugins;
exports.createContentItem = createContentItem;

const importConfig = async (configFile) => {
  const config = require(configFile);
  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    throw Error(`Invalid config file "${configFile}"`);
  }
  return config;
};

const isFile = async (file) => {
  try {
    const stats = await fs.promises.stat(file);
    return stats.isFile();
  } catch {
    return false;
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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const file = path.join(dir, 'svgo.config.js');
    if (await isFile(file)) {
      return await importConfig(file);
    }
    const parent = path.dirname(dir);
    if (dir === parent) {
      return null;
    }
    dir = parent;
  }
};
exports.loadConfig = loadConfig;

const optimize = (input, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object');
  }
  return optimizeAgnostic(input, {
    ...config,
    js2svg: {
      // platform specific default for end of line
      eol: os.EOL === '\r\n' ? 'crlf' : 'lf',
      ...config.js2svg,
    },
  });
};
exports.optimize = optimize;
