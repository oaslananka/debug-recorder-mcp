#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';

export const SNYK_CLI_VERSION = '1.1306.1';

const argumentsSet = new Set(process.argv.slice(2));
const required = argumentsSet.has('--required');
const dryRun = argumentsSet.has('--dry-run');
const token = process.env.SNYK_TOKEN || process.env.SYNK_PAT_TOKEN;

function resolveNpxCli() {
  const nodeDirectory = dirname(process.execPath);
  const candidates =
    process.platform === 'win32'
      ? [join(nodeDirectory, 'node_modules', 'npm', 'bin', 'npx-cli.js')]
      : [
          join(
            nodeDirectory,
            '..',
            'lib',
            'node_modules',
            'npm',
            'bin',
            'npx-cli.js'
          ),
          join(nodeDirectory, 'node_modules', 'npm', 'bin', 'npx-cli.js')
        ];
  const candidate = candidates.find((path) => existsSync(path));
  if (!candidate) {
    throw new Error(
      'Unable to locate the npm npx CLI beside the active Node.js runtime'
    );
  }
  return resolve(candidate);
}

function buildChildEnvironment(snykToken) {
  const environment = {
    PATH:
      process.platform === 'win32'
        ? dirname(process.execPath)
        : [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter),
    SNYK_TOKEN: snykToken
  };

  for (const key of [
    'HOME',
    'USERPROFILE',
    'TMPDIR',
    'TMP',
    'TEMP',
    'HTTPS_PROXY',
    'HTTP_PROXY',
    'NO_PROXY',
    'NODE_EXTRA_CA_CERTS',
    'SSL_CERT_FILE',
    'SSL_CERT_DIR',
    'npm_config_cache'
  ]) {
    const value = process.env[key];
    if (value) {
      environment[key] = value;
    }
  }

  return environment;
}

if (!token) {
  const message =
    'Snyk token is not configured; skipping the local scan. Authenticated CI remains authoritative.';

  if (required) {
    console.error(
      'Snyk token is required. Set SNYK_TOKEN (or legacy SYNK_PAT_TOKEN) before running this command.'
    );
    process.exit(2);
  }

  console.log(message);
  process.exit(0);
}

if (dryRun) {
  console.log(
    `Snyk ${SNYK_CLI_VERSION} scan configuration is ready; no scan was executed.`
  );
  process.exit(0);
}

let npxCli;
try {
  npxCli = resolveNpxCli();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    npxCli,
    '--yes',
    `snyk@${SNYK_CLI_VERSION}`,
    'test',
    '--file=package.json',
    '--package-manager=npm',
    '--dev',
    '--severity-threshold=high',
    '--strict-out-of-sync=true'
  ],
  {
    stdio: 'inherit',
    env: buildChildEnvironment(token),
    shell: false
  }
);

if (result.error) {
  console.error(`Unable to run Snyk: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
