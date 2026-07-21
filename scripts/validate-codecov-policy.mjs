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
    throw new Error(`Codecov remote validation failed (${response.status}).`);
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
    'reports/coverage/cobertura-coverage.xml',
    'report_type: test_results',
    'reports/test-results/node-${{ matrix.node-version }}/coverage/junit.xml',
    'reports/test-results/node-${{ matrix.node-version }}/fuzz/junit.xml',
    'reports/test-results/node-${{ matrix.node-version }}/e2e/junit.xml',
    'flags: node-${{ matrix.node-version }}',
    'actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1',
    'environment: codecov',
    'fail_ci_if_error: true',
    'handle_no_reports_found: true',
    'npm run check:codecov -- --remote',
    'permissions: {}'
  ]) {
    assertContains(WORKFLOW_PATH, workflow, required);
  }

  assertOccurrenceCount(
    WORKFLOW_PATH,
    workflow,
    'github.event.pull_request.head.repo.full_name == github.repository',
    1
  );

  assertOccurrenceCount(
    WORKFLOW_PATH,
    workflow,
    'codecov/codecov-action@fb8b3582c8e4def4969c97caa2f19720cb33a72f # v7.0.0',
    2
  );

  assertOccurrenceCount(
    WORKFLOW_PATH,
    workflow,
    `    permissions:
      contents: read`,
    3
  );

  if (
    workflow.includes(`permissions:
  contents: read`)
  ) {
    throw new Error('CI permissions must be declared at job level.');
  }

  if (workflow.includes('codecov/test-results-action@')) {
    throw new Error('Deprecated Codecov test-results-action must not be used.');
  }

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

  const hasCodecovManager = (renovate.customManagers ?? []).some((manager) =>
    manager.description?.includes('Codecov CLI')
  );
  if (!hasCodecovManager) {
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
