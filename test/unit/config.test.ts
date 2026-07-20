import { describe, expect, it } from '@jest/globals';
import { parseBooleanEnv, resolveRuntimeConfig } from '../../src/config.js';

describe('runtime configuration', () => {
  it.each([
    ['true', true],
    ['1', true],
    ['yes', true],
    [' TRUE ', true],
    ['YeS', true],
    ['false', false],
    ['0', false],
    ['no', false],
    [' FALSE ', false],
    ['No', false]
  ])('parses boolean value %s as %s', (value, expected) => {
    expect(parseBooleanEnv('TEST_BOOLEAN', value)).toBe(expected);
  });

  it('uses false for missing boolean values', () => {
    expect(parseBooleanEnv('TEST_BOOLEAN', undefined)).toBe(false);
    expect(resolveRuntimeConfig({})).toEqual({
      redactBeforeStore: false,
      remoteHttp: false
    });
  });

  it.each(['', 'on', 'off', 'enabled', 'sometimes'])(
    'rejects unsupported boolean value %s',
    (value) => {
      expect(() => parseBooleanEnv('TEST_BOOLEAN', value)).toThrow(
        'Invalid TEST_BOOLEAN: expected true/false, 1/0, or yes/no'
      );
    }
  );
});
