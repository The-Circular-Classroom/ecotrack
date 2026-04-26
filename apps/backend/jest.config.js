/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middlewares/**/*.js',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
};

module.exports = config;
