import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

const script = join(process.cwd(), 'scripts', 'run-snyk.mjs');

function environmentWithoutSnykToken(): Record<string, string | undefined> {
  const env = { ...process.env };
  delete env.SNYK_TOKEN;
  delete env.SYNK_PAT_TOKEN;
  return env;
}

describe('Snyk local runner', () => {
  it('skips tokenless optional scans without blocking commits', () => {
    const result = spawnSync(process.execPath, [script, '--dry-run'], {
      encoding: 'utf8',
      env: environmentWithoutSnykToken()
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('skipping the local scan');
    expect(result.stderr).toBe('');
  });

  it('fails clearly when an authenticated scan is required', () => {
    const result = spawnSync(
      process.execPath,
      [script, '--required', '--dry-run'],
      {
        encoding: 'utf8',
        env: environmentWithoutSnykToken()
      }
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Snyk token is required');
    expect(result.stdout).toBe('');
  });

  it('validates the pinned CLI setup without revealing the token', () => {
    const token = 'unit-test-secret-value';
    const result = spawnSync(process.execPath, [script, '--dry-run'], {
      encoding: 'utf8',
      env: {
        ...environmentWithoutSnykToken(),
        SNYK_TOKEN: token
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'Snyk 1.1306.1 scan configuration is ready'
    );
    expect(`${result.stdout}${result.stderr}`).not.toContain(token);
  });

  it('does not pass the complete parent environment to Snyk', () => {
    const source = readFileSync(script, 'utf8');
    expect(source).not.toContain('...process.env');
  });
});
