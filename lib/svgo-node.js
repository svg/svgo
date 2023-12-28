import os from 'os';
import fs from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';
import { optimize as optimizeAgnostic } from './svgo.js';

/**
 * @typedef {import('./svgo.js').Config} Config
 */

/**
 * @param {string} configFile
 * @returns Config
 */
const importConfig = async (configFile) => {
  // dynamic import expects file url instead of path and may fail
  // when windows path is provided
  const imported = await import(pathToFileURL(configFile).toString());
  const config = imported.default;

  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    throw Error(`Invalid config file "${configFile}"`);
  }
  return config;
};

/**
 * @param {string} file
 * @returns Promise<boolean>
 */
const isFile = async (file) => {
  try {
    const stats = await fs.promises.stat(file);
    return stats.isFile();
  } catch {
    return false;
  }
};

/**
 * @param {string | null | undefined} configFile
 * @param {string} [cwd]
 * @returns Promis<Config>
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
  // eslint-disable-next-line no-constant-condition
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
 * @param {Config} [config]
 * @returns Output
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
