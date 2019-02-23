const base = require('./jest.base.config');

module.exports = {
  ...base,
  testMatch: [
    '**/?(*.)+(test)\\.js?(x)',
  ],
  testPathIgnorePatterns: [
    ...base.testPathIgnorePatterns,
    '/test/',
  ],
  timers: 'fake',
  collectCoverage: true,
  coverageDirectory: './coverage/jest',
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
};
