import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

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
        // see https://github.com/csstree/csstree/pull/152
        if (importee === 'css-tree') {
          return this.resolve('css-tree/dist/csstree.min.js', importer);
        }
      },
    },
    nodeResolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    json(),
    // Whitespaces and comments removal makes the browser bundle lighter
    // while retaining the ability to debug errors
    terser({
      compress: false,
      mangle: false,
      format: { comments: false },
    }),
  ],
};
