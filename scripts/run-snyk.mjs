#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

export const SNYK_CLI_VERSION = '1.1306.1';

const argumentsSet = new Set(process.argv.slice(2));
const required = argumentsSet.has('--required');
const dryRun = argumentsSet.has('--dry-run');
const token = process.env.SNYK_TOKEN || process.env.SYNK_PAT_TOKEN;

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

const result = spawnSync(
  'npx',
  [
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
    env: {
      ...process.env,
      SNYK_TOKEN: token
    },
    shell: process.platform === 'win32'
  }
);

if (result.error) {
  console.error(`Unable to run Snyk: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
