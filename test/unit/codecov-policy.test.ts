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

  it.each([
    {
      name: 'requires an explicit workflow-level deny-all permissions block',
      mutate: (workflow: string) => workflow.replace('permissions: {}\n\n', ''),
      expected: 'permissions: {}'
    },
    {
      name: 'rejects workflow-level token permissions',
      mutate: (workflow: string) =>
        `permissions:\n  contents: read\n\n${workflow}`,
      expected: 'permissions must be declared at job level'
    },
    {
      name: 'rejects the deprecated Codecov test-results action',
      mutate: (workflow: string) =>
        `${workflow}\n# codecov/test-results-action@deprecated\n`,
      expected: 'Deprecated Codecov test-results-action'
    },
    {
      name: 'rejects Codecov token access without a dedicated environment',
      mutate: (workflow: string) =>
        workflow.replace('    environment: codecov\n', ''),
      expected: 'environment: codecov'
    },
    {
      name: 'requires the exact PyPI Codecov CLI path for both uploads',
      mutate: (workflow: string) =>
        workflow.replace('          use_pypi: true\n', ''),
      expected: 'use_pypi: true'
    }
  ])('$name', ({ mutate, expected }) => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(workflowPath, mutate(readFileSync(workflowPath, 'utf8')));

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expected);
  });

  it('rejects bypassing Codecov CLI validation', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      readFileSync(workflowPath, 'utf8').replace(
        '          use_pypi: true\n',
        '          use_pypi: true\n          skip_validation: true\n'
      )
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('must not be bypassed');
  });

  it('rejects mutable or binary-prefixed Codecov CLI versions', () => {
    const root = createFixture();
    const workflowPath = join(root, '.github/workflows/ci.yml');
    writeFileSync(
      workflowPath,
      readFileSync(workflowPath, 'utf8').replace(
        'CODECOV_CLI_VERSION: 11.3.1',
        'CODECOV_CLI_VERSION: latest'
      )
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('CODECOV_CLI_VERSION: 11.3.1');
  });

  it('requires Renovate to track Codecov CLI from PyPI', () => {
    const root = createFixture();
    const renovatePath = join(root, 'renovate.json');
    writeFileSync(
      renovatePath,
      readFileSync(renovatePath, 'utf8').replace(
        '"datasourceTemplate": "pypi"',
        '"datasourceTemplate": "github-releases"'
      )
    );

    const result = runPolicy(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('exact Codecov CLI version from PyPI');
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
