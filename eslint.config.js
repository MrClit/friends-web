// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Base ESLint configuration for the Friends monorepo
 * Shared by all workspaces (frontend, backend)
 * Includes eslint-config-prettier to disable conflicting rules
 */
export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/build/**', '**/.vite/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Common rules for all workspaces
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
