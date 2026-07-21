import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from '@jest/globals';

const fixtures: string[] = [];
const script = resolve('scripts/install-approved-dependencies.mjs');

function createFixture(overrides: { betterSqliteVersion?: string } = {}): {
  root: string;
  invocationLog: string;
  npmCli: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'approved-install-'));
  fixtures.push(root);
  const invocationLog = join(root, 'npm-invocation.json');
  const npmCli = join(root, 'fake-npm-cli.mjs');
  const packages = [
    ['better-sqlite3', overrides.betterSqliteVersion ?? '12.8.0'],
    ['unrs-resolver', '1.12.2']
  ] as const;

  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      allowScripts: {
        'better-sqlite3@12.8.0': true,
        'unrs-resolver@1.12.2': true
      }
    })
  );

  for (const [name, version] of packages) {
    const packageDir = join(root, 'node_modules', name);
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify({ name, version })
    );
  }

  writeFileSync(
    npmCli,
    `import { writeFileSync } from 'node:fs';\nwriteFileSync(process.env.INVOCATION_LOG, JSON.stringify(process.argv.slice(2)));\n`
  );
  chmodSync(npmCli, 0o755);

  return { root, invocationLog, npmCli };
}

function runFixture(root: string, npmCli: string, invocationLog: string) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_execpath: npmCli,
      INVOCATION_LOG: invocationLog
    }
  });
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

describe('approved dependency lifecycle rebuild', () => {
  it('rebuilds only exact version-approved dependencies without PATH lookup', () => {
    const { root, invocationLog, npmCli } = createFixture();
    const result = runFixture(root, npmCli, invocationLog);

    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(invocationLog, 'utf8'))).toEqual([
      'rebuild',
      'better-sqlite3',
      'unrs-resolver',
      '--foreground-scripts'
    ]);
    expect(result.stdout).toContain('Approved lifecycle scripts rebuilt');
  });

  it('rejects an installed version that differs from the repository approval', () => {
    const { root, invocationLog, npmCli } = createFixture({
      betterSqliteVersion: '12.8.1'
    });
    const result = runFixture(root, npmCli, invocationLog);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'better-sqlite3 installed version 12.8.1 does not match approved 12.8.0'
    );
    expect(() => readFileSync(invocationLog)).toThrow();
  });

  it('rejects a non-absolute npm CLI path', () => {
    const { root, invocationLog } = createFixture();
    const result = runFixture(root, 'npm', invocationLog);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('npm_execpath must be an absolute path');
  });
});
