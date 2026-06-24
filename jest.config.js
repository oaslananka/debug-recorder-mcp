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
  collectCoverageFrom: ['src/**/*.ts', '!src/version.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/server-http.ts': {
      branches: 65,
      functions: 65,
      lines: 70,
      statements: 70
    },
    './src/tools/common.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/tools/recording-tools.ts': {
      functions: 100,
      lines: 90,
      statements: 90
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
        outputDirectory:
          process.env.JEST_JUNIT_OUTPUT_DIR ?? 'test-results/unit',
        outputName: process.env.JEST_JUNIT_OUTPUT_NAME ?? 'junit.xml'
      }
    ]
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
