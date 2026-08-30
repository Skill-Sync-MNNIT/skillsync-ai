import js from '@eslint/js';
import globals from 'globals';

const toReadonly = (obj) => Object.fromEntries(Object.keys(obj).map((k) => [k, 'readonly']));

export default [
  {
    ignores: ['node_modules/**', 'frontend/**', 'dist/**'],
  },
  js.configs.recommended,
  {
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
