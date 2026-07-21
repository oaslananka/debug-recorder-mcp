import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const tsFiles = ['src/**/*.ts', 'test/**/*.ts'];
const jsFiles = ['*.js', '*.mjs', 'scripts/**/*.mjs'];

export default [
  {
    ignores: ['coverage/**', 'dist/**', 'docs/api/**', 'node_modules/**']
  },
  js.configs.recommended,
  {
    files: jsFiles,
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-type-checked'].rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  }
];
