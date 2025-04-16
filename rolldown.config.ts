import { defineConfig } from 'rolldown';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, './package.json');
const PKG = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const sharedExternals = ['os', 'fs', 'url', 'path'];

export default defineConfig([
  {
    input: './lib/svgo-node.js',
    output: {
      file: './dist/svgo-node.cjs',
      format: 'cjs',
      exports: 'named',
    },
    external: [...sharedExternals, ...Object.keys(PKG.dependencies)],
    onwarn(warning) {
      throw Error(warning.toString());
    },
  },
  {
    input: './lib/svgo.js',
    output: {
      format: 'esm',
      file: './dist/svgo.browser.js',
    },
    external: sharedExternals,
    onwarn(warning) {
      throw Error(warning.toString());
    },
  },
]);
