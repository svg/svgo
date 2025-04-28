import os from 'os';
import fs from 'fs';
import path from 'path';
import {
  VERSION,
  optimize as optimizeAgnostic,
  builtinPlugins,
  querySelector,
  querySelectorAll,
  _collections,
} from './svgo.js';

/**
 * @typedef {import('./svgo.js').Config} Config
 * @typedef {import('./svgo.js').Output} Output
 */

/**
 * @param {string} configFile
 * @returns {Promise<Config>}
 */
const importConfig = async (configFile) => {
  const imported = await import(path.resolve(configFile));
  const config = imported.default;

  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    throw Error(`Invalid config file "${configFile}"`);
  }
  return config;
};

/**
 * @param {string} file
 * @returns {Promise<boolean>}
 */
const isFile = async (file) => {
  try {
    const stats = await fs.promises.stat(file);
    return stats.isFile();
  } catch {
    return false;
  }
};

export {
  VERSION,
  builtinPlugins,
  querySelector,
  querySelectorAll,
  _collections,
};

/**
 * @param {string} configFile
 * @param {string} cwd
 * @returns {Promise<?Config>}
 */
export const loadConfig = async (configFile, cwd = process.cwd()) => {
  if (configFile != null) {
    if (path.isAbsolute(configFile)) {
      return await importConfig(configFile);
    } else {
      return await importConfig(path.join(cwd, configFile));
    }
  }
  let dir = cwd;

  while (true) {
    const js = path.join(dir, 'svgo.config.js');
    if (await isFile(js)) {
      return await importConfig(js);
    }
    const mjs = path.join(dir, 'svgo.config.mjs');
    if (await isFile(mjs)) {
      return await importConfig(mjs);
    }
    const cjs = path.join(dir, 'svgo.config.cjs');
    if (await isFile(cjs)) {
      return await importConfig(cjs);
    }
    const parent = path.dirname(dir);
    if (dir === parent) {
      return null;
    }
    dir = parent;
  }
};

/**
 * @param {string} input
 * @param {Config} config
 * @returns {Output}
 */
export const optimize = (input, config) => {
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

export default {
  VERSION,
  builtinPlugins,
  loadConfig,
  optimize,
  querySelector,
  querySelectorAll,
  _collections,
};
