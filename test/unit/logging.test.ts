import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { log, redact, redactSecrets } from '../../src/logging.js';

const originalLogLevel = process.env.LOG_LEVEL;

afterEach(() => {
  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = originalLogLevel;
  }
});

describe('logging redaction', () => {
  it('redacts password fields in objects', () => {
    const result = redactSecrets({ password: 'hunter2' }) as Record<
      string,
      unknown
    >;
    expect(result.password).toBe('[REDACTED]');
  });

  it('redacts token fields in nested objects', () => {
    const result = redactSecrets({
      user: {
        name: 'Alice',
        token: 'secret-token'
      }
    }) as { user: { name: string; token: string } };

    expect(result.user.name).toBe('Alice');
    expect(result.user.token).toBe('[REDACTED]');
  });

  it('redacts API key values in plain strings', () => {
    const result = redact('api_key=secret123') as string;

    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('secret123');
  });

  it('redacts bearer tokens', () => {
    const result = redact(
      'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    ) as string;
    expect(result).toContain('Bearer [REDACTED]');
  });

  it('redacts long base64-like tokens and sk-style keys', () => {
    const base64LikeToken = `${'Q'.repeat(36)}${'0M'.repeat(6)}=`;
    const secretKey = `sk-${'1234567890abcdef'.repeat(2)}`;
    const result = redact(`token=${base64LikeToken} ${secretKey}`) as string;

    expect(result).not.toContain(base64LikeToken);
    expect(result).not.toContain(secretKey);
    expect(result).toContain('[REDACTED]');
  });

  it('redacts common GitHub, npm, and Slack token shapes', () => {
    const githubToken = `ghp_${'1234567890abcdef'.repeat(2)}`;
    const npmToken = `npm_${'1234567890abcdef'.repeat(2)}`;
    const slackToken = `xoxb-${'123456789012'}-${'123456789012'}-${'abcdefghijklmnop'}`;
    const result = redact(`${githubToken} ${npmToken} ${slackToken}`) as string;

    expect(result).not.toContain(githubToken);
    expect(result).not.toContain(npmToken);
    expect(result).not.toContain(slackToken);
    expect(result.match(/\[REDACTED\]/g)).toHaveLength(3);
  });

  it('handles arrays recursively', () => {
    const result = redactSecrets([{ token: 'x' }, { name: 'ok' }]) as Array<
      Record<string, unknown>
    >;

    expect(result[0]?.token).toBe('[REDACTED]');
    expect(result[1]?.name).toBe('ok');
  });

  it('leaves safe primitive values untouched', () => {
    expect(redact('hello world')).toBe('hello world');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });

  it('honors LOG_LEVEL when writing logs', () => {
    const writeSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    process.env.LOG_LEVEL = 'warn';

    log('info', 'this should be suppressed');
    log('error', 'this should be emitted');

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(String(writeSpy.mock.calls[0]?.[0] ?? '')).toContain(
      'this should be emitted'
    );
  });
});
