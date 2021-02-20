import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: './lib/svgo.js',
  output: {
    file: './dist/svgo.browser.js',
    format: 'esm',
  },
  onwarn(warning) {
    throw Error(warning.toString());
  },
  plugins: [
    {
      resolveId(importee, importer) {
        if (['os', 'stream', 'string_decoder'].includes(importee)) {
          return importee;
        }
        // see https://github.com/csstree/csstree/pull/152
        if (importee === 'css-tree') {
          return this.resolve('css-tree/dist/csstree.min.js', importer);
        }
      },
      load(id) {
        if (id === 'os') {
          return `export var EOL = '\\n'`;
        }
        if (id === 'stream') {
          return `export function Stream(){}`;
        }
        if (id === 'string_decoder') {
          return `export default null`;
        }
      },
    },
    nodeResolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    json(),
  ],
};
