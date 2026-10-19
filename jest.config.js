/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'clapp-ai-workflow-plugins',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.tests.json',
      },
    ],
  },
  // inversify 8 and @orion76 packages ship ESM only; let ts-jest transpile them
  // and their scoped deps.
  transformIgnorePatterns: ['/node_modules/(?!inversify|@inversifyjs|@orion76)'],
  moduleNameMapper: {
    // The plugins of this package import its public API by package name. Under
    // jest the runtime does not read the tsconfig `paths` of the test program,
    // and `exports` points at `dist`, which dev mode never builds, so the name
    // is mapped straight to the barrel source.
    '^@clapp/ai-workflow-plugins$': '<rootDir>/src/public-api.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
