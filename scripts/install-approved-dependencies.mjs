#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnNpmSync } from './npm-cli.mjs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseApproval(key) {
  const separator = key.lastIndexOf('@');
  if (separator <= 0 || separator === key.length - 1) {
    throw new Error(`Invalid version-pinned install-script approval: ${key}`);
  }

  return {
    name: key.slice(0, separator),
    version: key.slice(separator + 1)
  };
}

function packageManifestPath(name) {
  return join('node_modules', ...name.split('/'), 'package.json');
}

function approvedDependencies() {
  const manifest = readJson('package.json');
  const approvals = Object.entries(manifest.allowScripts ?? {})
    .filter(([, approved]) => approved === true)
    .map(([key]) => parseApproval(key));

  if (approvals.length === 0) {
    throw new Error('No approved dependency lifecycle scripts are configured');
  }

  for (const approval of approvals) {
    const installed = readJson(packageManifestPath(approval.name));
    if (installed.name !== approval.name) {
      throw new Error(
        `${approval.name} installed package name does not match its approval`
      );
    }
    if (installed.version !== approval.version) {
      throw new Error(
        `${approval.name} installed version ${installed.version} does not match approved ${approval.version}`
      );
    }
  }

  return approvals;
}

try {
  const approvals = approvedDependencies();
  const result = spawnNpmSync(
    ['rebuild', ...approvals.map(({ name }) => name), '--foreground-scripts'],
    { stdio: 'inherit' }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `Approved dependency rebuild failed with exit ${result.status}`
    );
  }

  console.log(
    `Approved lifecycle scripts rebuilt: ${approvals
      .map(({ name, version }) => `${name}@${version}`)
      .join(', ')}`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
