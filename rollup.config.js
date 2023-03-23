import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
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
    nodeResolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    // Whitespaces and comments removal makes the browser bundle lighter
    // while retaining the ability to debug errors
    terser({
      compress: false,
      mangle: false,
      format: { comments: false },
    }),
  ],
};
