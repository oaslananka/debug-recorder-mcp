import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

const retiredPaths = [
  '.github/workflows/snyk.yml',
  'scripts/run-snyk.mjs',
  'test/unit/snyk-script.test.ts'
];

const activePolicyFiles = [
  '.pre-commit-config.yaml',
  'CONTRIBUTING.md',
  'package.json',
  'renovate.json',
  'docs/repository-governance.md',
  'docs/security.md',
  'docs/security-tooling.md'
];

describe('retired Snyk integration policy', () => {
  it.each(retiredPaths)('does not track %s', (path) => {
    expect(existsSync(path)).toBe(false);
  });

  it.each(activePolicyFiles)('keeps %s free of Snyk configuration', (path) => {
    const content = readFileSync(path, 'utf8');

    expect(content).not.toMatch(/snyk|synk_pat_token/i);
  });

  it('documents replacement security ownership', () => {
    const tooling = readFileSync('docs/security-tooling.md', 'utf8');

    for (const required of [
      'dependency review',
      '`npm audit`',
      'Trivy',
      'CodeQL',
      'Semgrep',
      'Socket'
    ]) {
      expect(tooling).toContain(required);
    }
  });
});
