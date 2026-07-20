import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

const script = join(process.cwd(), 'scripts', 'check-sonar-quality-gate.mjs');

describe('SonarQube Cloud quality-gate checker', () => {
  it('accepts a passing quality-gate response', () => {
    const result = spawnSync(
      process.execPath,
      [
        script,
        '--input',
        join(process.cwd(), 'test', 'fixtures', 'sonar-quality-gate-ok.json')
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('quality gate: OK');
    expect(result.stderr).toBe('');
  });

  it('reports failed quality-gate conditions without credentials', () => {
    const result = spawnSync(
      process.execPath,
      [
        script,
        '--input',
        join(process.cwd(), 'test', 'fixtures', 'sonar-quality-gate-error.json')
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('quality gate: ERROR');
    expect(result.stderr).toContain('new_security_rating');
    expect(result.stderr).toContain('actual=3');
  });
});
