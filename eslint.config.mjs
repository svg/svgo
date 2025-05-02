import js from '@eslint/js';
import globals from 'globals';

/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/** @type {Config[]} */
export default [
  {
    ignores: [
      '.yarn/**',
      '.yarnrc.yml',
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
      ecmaVersion: 'latest',
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
      'one-var': ['error', 'never'],
      curly: 'error',
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
