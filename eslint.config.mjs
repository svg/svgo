import js from '@eslint/js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
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
];
