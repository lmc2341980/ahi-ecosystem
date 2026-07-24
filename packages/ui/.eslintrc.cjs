/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  env: { node: true, browser: true, es2022: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: ['dist', '.turbo', 'node_modules'],
};
