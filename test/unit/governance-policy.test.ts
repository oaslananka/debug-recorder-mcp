import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from '@jest/globals';

const fixtures: string[] = [];

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'debug-recorder-governance-'));
  fixtures.push(root);
  for (const directory of ['.github/workflows', 'docs', 'scripts']) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  for (const path of [
    '.pre-commit-config.yaml',
    '.github/CODEOWNERS',
    'docs/repository-governance.md',
    'docs/security-tooling.md',
    'package.json',
    'renovate.json',
    '.github/workflows/security.yml',
    'scripts/validate-governance-policy.mjs'
  ]) {
    cpSync(path, join(root, path));
  }
  return root;
}

function runPolicy(root: string) {
  return spawnSync(
    process.execPath,
    ['scripts/validate-governance-policy.mjs'],
    {
      cwd: root,
      encoding: 'utf8'
    }
  );
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

describe('repository governance policy', () => {
  it('accepts the repository policy', () => {
    const result = runPolicy(createFixture());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'Repository governance and local hook policy validated.'
    );
  });

  it('rejects a full CI pre-push hook', () => {
    const root = createFixture();
    const path = join(root, '.pre-commit-config.yaml');
    writeFileSync(
      path,
      readFileSync(path, 'utf8').replace(
        'stages: [manual]',
        'stages: [pre-push]'
      )
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('must not run full tests');
  });

  it('rejects retired Azure ownership paths', () => {
    const root = createFixture();
    const path = join(root, '.github/CODEOWNERS');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n.azure/ @oaslananka\n`);

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('retired path: .azure/');
  });
});
