// @ts-check
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
// Import base config from monorepo root
import baseConfig from '../../eslint.config.js';

/**
 * ESLint configuration for @friends/frontend
 * Extends base config with React-specific rules
 */
export default [
  ...baseConfig,
  {
    ignores: ['*.config.js', '*.config.ts'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Every HTTP call goes through apiRequest, which owns the JWT refresh, the
    // { data } unwrapping and the ApiError contract. src/api/client.ts is the
    // one place allowed to touch fetch directly.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/api/client.ts', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use apiRequest from @/api/client instead of calling fetch directly.',
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
