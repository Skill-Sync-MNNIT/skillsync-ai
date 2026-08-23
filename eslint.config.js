import js from '@eslint/js';
import globals from 'globals';

// Convert globals package format (boolean) to ESLint flat config format (string)
const toReadonly = (obj) =>
  Object.fromEntries(Object.keys(obj).map((k) => [k, 'readonly']));

export default [
  js.configs.recommended,
  {
    ignores: ['node_modules/**', 'frontend/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...toReadonly(globals.node),
        ...toReadonly(globals.jest),
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      semi: ['error', 'always'],
    },
  },
];
