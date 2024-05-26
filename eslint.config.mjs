import js from '@eslint/js';
import globals from 'globals';

/**
 * @typedef {import('eslint').Linter.FlatConfig} FlatConfig
 */

/** @type {FlatConfig[]} */
export default [
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
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
