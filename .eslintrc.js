module.exports = {
  extends: 'airbnb-base',
  plugins: [
    'jest',
  ],
  env: {
    jest: true,
  },
  rules: {
    'arrow-parens': ['error', 'always'],

    // Jest
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'warn',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'warn',
  },
};
