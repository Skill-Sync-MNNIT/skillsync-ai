import js from '@eslint/js';
import globals from 'globals';

const toReadonly = (obj) => Object.fromEntries(Object.keys(obj).map((k) => [k, 'readonly']));

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...toReadonly(globals.node),
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...toReadonly(globals.jest),
      },
    },
  },
];
