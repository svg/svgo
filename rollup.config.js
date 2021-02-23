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
        if (importee === 'os') {
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
      },
    },
    nodeResolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    json(),
  ],
};
