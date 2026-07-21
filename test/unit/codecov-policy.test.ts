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
  const root = mkdtempSync(join(tmpdir(), 'debug-recorder-codecov-'));
  fixtures.push(root);
  mkdirSync(join(root, '.github/workflows'), { recursive: true });
  mkdirSync(join(root, 'scripts'), { recursive: true });
  for (const path of [
    'package.json',
    'renovate.json',
    'codecov.yml',
    '.github/workflows/ci.yml',
    'scripts/validate-codecov-policy.mjs'
  ]) {
    cpSync(path, join(root, path));
  }
  return root;
}

function runPolicy(root: string) {
  return spawnSync(process.execPath, ['scripts/validate-codecov-policy.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

describe('Codecov policy validator', () => {
  it('accepts the repository Codecov policy', () => {
    const result = runPolicy(createFixture());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Codecov policy validated locally.');
  });

  it('rejects a workflow that could expose uploads to fork pull requests', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      readFileSync(workflowPath, 'utf8')
        .split(
          'github.event.pull_request.head.repo.full_name == github.repository'
        )
        .join('github.event_name == github.event_name')
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'github.event.pull_request.head.repo.full_name == github.repository'
    );
  });

  it('requires an explicit workflow-level deny-all permissions block', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      readFileSync(workflowPath, 'utf8').replace('permissions: {}\n\n', '')
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('permissions: {}');
  });

  it('rejects workflow-level token permissions', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      `permissions:\n  contents: read\n\n${readFileSync(workflowPath, 'utf8')}`
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'permissions must be declared at job level'
    );
  });

  it('rejects the deprecated Codecov test-results action', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      `${readFileSync(workflowPath, 'utf8')}\n# codecov/test-results-action@deprecated\n`
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Deprecated Codecov test-results-action');
  });

  it('rejects Codecov token access without a dedicated environment', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      readFileSync(workflowPath, 'utf8').replace(
        '    environment: codecov\n',
        ''
      )
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('environment: codecov');
  });

  it('rejects bundle analysis for the non-bundled package', () => {
    const root = createFixture();
    const configPath = join(root, 'codecov.yml');
    writeFileSync(
      configPath,
      `${readFileSync(configPath, 'utf8')}\nbundle_analysis:\n  status: informational\n`
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('must not enable Bundle Analysis');
  });
});
