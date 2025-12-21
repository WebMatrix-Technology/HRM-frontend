const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({});

module.exports = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  }),
];
