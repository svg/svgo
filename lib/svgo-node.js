import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import * as svgo from './svgo.js';
import url from 'url';

/**
 * @param {string} configFile
 * @returns {Promise<import('./types.js').Config>}
 */
const importConfig = async (configFile) => {
  const resolvedPath = path.resolve(configFile);
  const imported = await import(url.pathToFileURL(resolvedPath).toString());
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
    const stats = await fs.stat(file);
    return stats.isFile();
  } catch {
    return false;
  }
};

export * from './svgo.js';

/**
 * If you write a tool on top of svgo you might need a way to load svgo config.
 * You can also specify relative or absolute path and customize current working
 * directory.
 *
 * @type {<T extends string | null>(configFile?: T, cwd?: string) => Promise<T extends string ? import('./svgo.js').Config : import('./svgo.js').Config | null>}
 */
export const loadConfig = async (configFile, cwd = process.cwd()) => {
  if (configFile != null) {
    if (path.isAbsolute(configFile)) {
      return importConfig(configFile);
    } else {
      return importConfig(path.join(cwd, configFile));
    }
  }
  let dir = cwd;

  while (true) {
    const js = path.join(dir, 'svgo.config.js');
    if (await isFile(js)) {
      return importConfig(js);
    }
    const mjs = path.join(dir, 'svgo.config.mjs');
    if (await isFile(mjs)) {
      return importConfig(mjs);
    }
    const cjs = path.join(dir, 'svgo.config.cjs');
    if (await isFile(cjs)) {
      return importConfig(cjs);
    }
    const parent = path.dirname(dir);
    if (dir === parent) {
      // @ts-expect-error https://github.com/microsoft/TypeScript/issues/33912
      return null;
    }
    dir = parent;
  }
};

/**
 * The core of SVGO.
 *
 * @param {string} input
 * @param {import('./svgo.js').Config=} config
 * @returns {import('./svgo.js').Output}
 */
export const optimize = (input, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object');
  }
  return svgo.optimize(input, {
    ...config,
    js2svg: {
      // platform specific default for end of line
      eol: os.EOL === '\r\n' ? 'crlf' : 'lf',
      ...config.js2svg,
    },
  });
};
