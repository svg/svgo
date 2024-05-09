import js from '@eslint/js';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // global ignores
  {
    ignores: [
      '.yarn/**',
      'node_modules/**',
      'dist/**',
      'test/regression-fixtures/**',
      'test/regression-diffs/**',
      'test/cli/output/**',
      'coverage/**',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      strict: 'error',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.jest,
      },
    },
  },
];
