#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const CONFIG_PATH = 'codecov.yml';
const WORKFLOW_PATH = '.github/workflows/ci.yml';
const REMOTE_VALIDATOR = 'https://api.codecov.io/validate';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required Codecov file: ${path}`);
  }
}

function assertContains(path, content, needle) {
  if (!content.includes(needle)) {
    throw new Error(`${path} must contain: ${needle}`);
  }
}

function assertOccurrenceCount(path, content, needle, expected) {
  const actual = content.split(needle).length - 1;
  if (actual !== expected) {
    throw new Error(
      `${path} must contain ${expected} occurrences of: ${needle}; found ${actual}`
    );
  }
}

async function validateRemote(config) {
  const response = await fetch(REMOTE_VALIDATOR, {
    method: 'POST',
    headers: { 'content-type': 'text/plain; charset=utf-8' },
    body: config,
    signal: AbortSignal.timeout(15_000)
  });
  const body = await response.text();
  if (!response.ok || !body.includes('Valid!')) {
    throw new Error(
      `Codecov remote validation failed (${response.status}): ${body.trim()}`
    );
  }
}

try {
  assertFile(CONFIG_PATH);
  assertFile(WORKFLOW_PATH);

  const config = read(CONFIG_PATH);
  const workflow = read(WORKFLOW_PATH);
  const manifest = JSON.parse(read('package.json'));
  const renovate = JSON.parse(read('renovate.json'));

  for (const required of [
    'require_ci_to_pass: true',
    'target: auto',
    'target: 85%',
    'informational: true',
    'require_changes: true',
    'hide_project_coverage: false'
  ]) {
    assertContains(CONFIG_PATH, config, required);
  }

  for (const required of [
    'CODECOV_CLI_VERSION: v11.3.1',
    'codecov/codecov-action@fb8b3582c8e4def4969c97caa2f19720cb33a72f # v7.0.0',
    'codecov/test-results-action@0fa95f0e1eeaafde2c782583b36b28ad0d8c77d3 # v1.2.1',
    'coverage/cobertura-coverage.xml',
    'directory: test-results/node-${{ matrix.node-version }}',
    'flags: node-${{ matrix.node-version }}',
    'fail_ci_if_error: true',
    'handle_no_reports_found: true',
    'npm run check:codecov -- --remote'
  ]) {
    assertContains(WORKFLOW_PATH, workflow, required);
  }

  assertOccurrenceCount(
    WORKFLOW_PATH,
    workflow,
    'github.event.pull_request.head.repo.full_name == github.repository',
    2
  );

  if (config.includes('bundle_analysis:')) {
    throw new Error(
      'codecov.yml must not enable Bundle Analysis for this non-bundled Node package'
    );
  }

  if (
    manifest.scripts?.['check:codecov'] !==
    'node scripts/validate-codecov-policy.mjs'
  ) {
    throw new Error('package.json must expose the check:codecov policy script');
  }

  const codecovManager = (renovate.customManagers ?? []).find((manager) =>
    manager.description?.includes('Codecov CLI')
  );
  if (!codecovManager) {
    throw new Error('renovate.json must manage the pinned Codecov CLI version');
  }

  if (process.argv.includes('--remote')) {
    await validateRemote(config);
  }

  console.log(
    `Codecov policy validated${process.argv.includes('--remote') ? ' locally and remotely' : ' locally'}.`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
