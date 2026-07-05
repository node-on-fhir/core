// jest.a11y.config.cjs
module.exports = {
  passWithNoTests: true,
  testEnvironment: 'jsdom',
  testMatch: ['**/*.a11y.test.jsx'],
  setupFilesAfterEnv: ['<rootDir>/test/a11y/setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  // Meteor virtual imports are not resolvable in jsdom; a11y components must not import them.
  moduleNameMapper: {
    '^meteor/(.*)$': '<rootDir>/test/a11y/meteorStub.js'
  }
};
