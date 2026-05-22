/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json'
      }
    ]
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/version.ts', '!src/server-http.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './src/store.ts': {
      lines: 85
    },
    './src/search.ts': {
      lines: 80
    },
    './src/db.ts': {
      lines: 80
    }
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: process.env.JEST_JUNIT_OUTPUT_DIR ?? 'test-results/unit',
        outputName: process.env.JEST_JUNIT_OUTPUT_NAME ?? 'junit.xml'
      }
    ]
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
