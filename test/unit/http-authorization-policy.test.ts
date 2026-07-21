import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

const ADR = 'docs/adr/0006-public-http-oauth-resource-server-profile.md';
const PROFILE = 'docs/public-http-authorization.md';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('public HTTP authorization decision', () => {
  it('records the architecture decision and deployment boundaries', () => {
    expect(existsSync(ADR)).toBe(true);
    expect(existsSync(PROFILE)).toBe(true);

    const adr = read(ADR);
    const profile = read(PROFILE);
    const readme = read('README.md');
    const operations = read('docs/operations.md');
    const recipes = read('docs/client-recipes.md');

    for (const required of [
      'Accepted, 2026-07-21',
      'external authorization server',
      'companion MCP-aware authorization gateway',
      'public multi-user deployment is unsupported'
    ]) {
      expect(adr).toContain(required);
    }

    expect(adr).toMatch(/MUST NOT\s+accept token passthrough/);

    for (const deployment of [
      'Loopback',
      'Trusted private network',
      'Authenticating reverse proxy',
      'Public internet'
    ]) {
      expect(profile).toContain(deployment);
    }

    expect(readme).toContain('private/shared-secret mode');
    expect(readme).toContain('Public multi-user HTTP is not supported');
    expect(operations).toContain('private/shared-secret mode');
    expect(operations).toContain('Do not expose the built-in token mode');
    expect(recipes).toContain('non-loopback private deployment');
    expect(recipes).toContain('must not be exposed as a public');
  });

  it('defines the MCP OAuth resource-server profile', () => {
    const profile = read(PROFILE);

    for (const required of [
      '/.well-known/oauth-protected-resource/mcp',
      'resource_metadata=',
      'RFC 9728',
      'RFC 8414',
      'OpenID Connect Discovery 1.0',
      'RFC 8707',
      'debug-recorder.read',
      'debug-recorder.write',
      'debug-recorder.export',
      'debug-recorder.admin',
      '`iss`',
      '`aud`',
      '`exp`',
      '`nbf`',
      '15 minutes',
      'refresh-token rotation',
      'HTTPS'
    ]) {
      expect(profile).toContain(required);
    }
  });

  it('defines production controls and a mainstream client compatibility plan', () => {
    const profile = read(PROFILE);

    for (const required of [
      'Rate limiting',
      'Request correlation',
      'Proxy trust',
      'Audit events',
      '@modelcontextprotocol/inspector@0.21.2',
      'HTTP 401',
      'PKCE',
      'invalid audience',
      'insufficient scope',
      'must not contain access tokens'
    ]) {
      expect(profile).toContain(required);
    }
  });
});
