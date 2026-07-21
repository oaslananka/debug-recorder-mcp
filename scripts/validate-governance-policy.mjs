#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const PRECOMMIT = '.pre-commit-config.yaml';
const CODEOWNERS = '.github/CODEOWNERS';
const GOVERNANCE_DOC = 'docs/repository-governance.md';
const TOOLING_DOC = 'docs/security-tooling.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing governance policy file: ${path}`);
  }
}

function assertContains(path, content, needle) {
  if (!content.includes(needle)) {
    throw new Error(`${path} must contain: ${needle}`);
  }
}

try {
  for (const path of [PRECOMMIT, CODEOWNERS, GOVERNANCE_DOC, TOOLING_DOC]) {
    assertFile(path);
  }

  const precommit = read(PRECOMMIT);
  const codeowners = read(CODEOWNERS);
  const governance = read(GOVERNANCE_DOC);
  const tooling = read(TOOLING_DOC);
  const manifest = JSON.parse(read('package.json'));
  const renovate = JSON.parse(read('renovate.json'));
  const securityWorkflow = read('.github/workflows/security.yml');

  for (const required of [
    'default_install_hook_types: [pre-commit]',
    'https://github.com/rhysd/actionlint',
    'rev: v1.7.12',
    'https://github.com/zizmorcore/zizmor-pre-commit',
    'rev: v1.27.0',
    '- id: mixed-line-ending',
    '- id: check-toml',
    'stages: [manual]'
  ]) {
    assertContains(PRECOMMIT, precommit, required);
  }

  if (precommit.includes('pre-push')) {
    throw new Error(
      '.pre-commit-config.yaml must not run full tests or network scanners on every push'
    );
  }

  for (const hook of [
    'full-local-ci',
    'snyk-open-source',
    'sonar-quality-gate'
  ]) {
    const hookIndex = precommit.indexOf(`- id: ${hook}`);
    if (hookIndex < 0) {
      throw new Error(`${PRECOMMIT} must define manual hook: ${hook}`);
    }
    const nextHook = precommit.indexOf('\n      - id:', hookIndex + 1);
    const block = precommit.slice(
      hookIndex,
      nextHook < 0 ? precommit.length : nextHook
    );
    assertContains(PRECOMMIT, block, 'stages: [manual]');
  }

  for (const required of [
    '.github/workflows/',
    '.pre-commit-config.yaml',
    'renovate.json'
  ]) {
    assertContains(CODEOWNERS, codeowners, required);
  }
  for (const retired of ['.azure/', 'azure-pipelines.yml']) {
    if (codeowners.includes(retired)) {
      throw new Error(`${CODEOWNERS} contains retired path: ${retired}`);
    }
  }

  for (const required of [
    'Solo-maintainer review model',
    'Squash-only merge policy',
    'Default `GITHUB_TOKEN`: read-only',
    'Full commit SHA pinning',
    'Merge queue and Mergify',
    'Required checks',
    'Advisory and specialist checks'
  ]) {
    assertContains(GOVERNANCE_DOC, governance, required);
  }

  for (const required of [
    'Primary owner',
    'CodeQL',
    'Semgrep',
    'Snyk',
    'Codecov',
    'SonarQube Cloud',
    'Trivy',
    'GitHub secret scanning and push protection'
  ]) {
    assertContains(TOOLING_DOC, tooling, required);
  }

  const automationRule = (renovate.packageRules ?? []).find((rule) =>
    rule.description?.includes('dependency automation and security scanner')
  );
  for (const dependency of [
    'rhysd/actionlint',
    'zizmorcore/zizmor-pre-commit',
    'zizmorcore/zizmor-action',
    'zizmorcore/zizmor'
  ]) {
    if (!automationRule?.matchPackageNames?.includes(dependency)) {
      throw new Error(`renovate.json must group security tool: ${dependency}`);
    }
  }
  if (
    !(renovate.customManagers ?? []).some((manager) =>
      manager.description?.includes('pinned Zizmor engine')
    )
  ) {
    throw new Error('renovate.json must manage the pinned Zizmor engine');
  }
  for (const required of [
    'ZIZMOR_VERSION: 1.27.0',
    'version: ${{ env.ZIZMOR_VERSION }}'
  ]) {
    assertContains(
      '.github/workflows/security.yml',
      securityWorkflow,
      required
    );
  }

  if (
    manifest.scripts?.['hooks:install'] !==
    'pre-commit install --install-hooks --hook-type pre-commit'
  ) {
    throw new Error(
      'hooks:install must install only the fast pre-commit stage'
    );
  }
  if (
    manifest.scripts?.['hooks:manual'] !==
    'pre-commit run --hook-stage manual --all-files'
  ) {
    throw new Error('package.json must expose hooks:manual');
  }
  if (
    manifest.scripts?.['check:governance'] !==
    'node scripts/validate-governance-policy.mjs'
  ) {
    throw new Error('package.json must expose check:governance');
  }

  console.log('Repository governance and local hook policy validated.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
