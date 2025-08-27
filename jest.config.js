module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};