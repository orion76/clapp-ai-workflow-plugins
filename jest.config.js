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
    // Tests compile the sources directly: map the workspace packages to `src` so a
    // jest run does not depend on prebuilt `packages/*/dist` bundles.
    '^@clapp/common$': '<rootDir>/../common/src/index.ts',
    '^@clapp/core$': '<rootDir>/../core/src/index.ts',
    '^@clapp/utils$': '<rootDir>/../utils/src/index.ts',
    // `@orion76/*` sources live outside the workspace (sibling repository), and their
    // `exports` point to unbuilt `lib/`/`dist`, so they are mapped to `src` through the
    // root `node_modules` links. The path must stay inside the workspace: @nx/jest turns
    // every moduleNameMapper value into a task input, and a `../..` fileset fails native
    // hashing before jest starts. Through `node_modules` the plugin sees an external
    // dependency instead.
    '^@orion76/node-plugin$': '<rootDir>/../../node_modules/@orion76/node-plugin/src/public-api.ts',
    '^@orion76/plugin$': '<rootDir>/../../node_modules/@orion76/plugin/src/public-api.ts',
    '^@orion76/logger$': '<rootDir>/../../node_modules/@orion76/logger/src/public-api.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
