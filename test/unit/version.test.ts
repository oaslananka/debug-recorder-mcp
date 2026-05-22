import { createRequire } from 'node:module';
import { describe, expect, it } from '@jest/globals';
import { getVersion, NAME, VERSION } from '../../src/version.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { name: string; version: string };

describe('version module', () => {
  it('matches package.json version', () => {
    expect(VERSION).toBe(pkg.version);
    expect(getVersion()).toBe(pkg.version);
  });

  it('matches package.json name', () => {
    expect(NAME).toBe(pkg.name);
  });
});
