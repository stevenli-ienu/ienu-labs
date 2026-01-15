const baseConfig = require('../../eslint.config.mjs');

module.exports = [
  ...baseConfig,
  {
    files: [
      'libs/refactoring-pocs/**/*.ts',
      'libs/refactoring-pocs/**/*.tsx',
      'libs/refactoring-pocs/**/*.js',
      'libs/refactoring-pocs/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['libs/refactoring-pocs/**/*.ts', 'libs/refactoring-pocs/**/*.tsx'],
    rules: {},
  },
  {
    files: ['libs/refactoring-pocs/**/*.js', 'libs/refactoring-pocs/**/*.jsx'],
    rules: {},
  },
];
