import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'node:fs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

/**
 * @typedef {import('@rollup/plugin-terser').Options} Options
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, './package.json');
const PKG = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

/** @type {Options} */
const terserOptions = {
  compress: {
    defaults: false,
    arrows: true,
    computed_props: true,
    conditionals: true,
    dead_code: true,
    drop_debugger: true,
    evaluate: true,
  },
  mangle: false,
  format: {
    comments: false,
    keep_numbers: true,
    semicolons: false,
    shebang: false,
  },
};

export default [
  {
    input: './lib/svgo.js',
    output: {
      file: './dist/svgo-node.cjs',
      format: 'cjs',
    },
    external: Object.keys(PKG.dependencies),
    onwarn(warning) {
      throw Error(warning.toString());
    },
    plugins: [terser(terserOptions)],
  },
  {
    input: './lib/svgo.js',
    output: {
      file: './dist/svgo.browser.js',
      format: 'esm',
    },
    onwarn(warning) {
      throw Error(warning.toString());
    },
    plugins: [
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      terser(terserOptions),
    ],
  },
];
