import { spawnSync } from 'node:child_process';
import { describe, expect, it } from '@jest/globals';

describe('security tooling source policy', () => {
  it('does not track intentionally vulnerable Semgrep fixtures as TypeScript source', () => {
    const result = spawnSync('git', ['ls-files', 'test/semgrep/*.ts'], {
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });
});
