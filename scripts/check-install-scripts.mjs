#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const INSTALL_LIFECYCLE_SCRIPTS = [
  'pre' + 'install',
  'install',
  'post' + 'install'
];
const EXPECTED_APPROVALS = new Map([
  [
    'better-sqlite3@12.8.0',
    'Required native SQLite binding used by the local-first session store.'
  ],
  [
    'unrs-resolver@1.12.2',
    'Required by lint/developer tooling resolver dependency tree.'
  ]
]);

function fail(message) {
  throw new Error(message);
}

function readPackageJson(path = 'package.json') {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateAllowScripts(packageJson) {
  const allowScripts = packageJson.allowScripts;

  if (!allowScripts || typeof allowScripts !== 'object') {
    fail('package.json must define an allowScripts policy');
  }

  const approvals = Object.entries(allowScripts).filter(([, value]) => value);
  const approvedKeys = new Set(approvals.map(([key]) => key));

  for (const [expected, reason] of EXPECTED_APPROVALS) {
    if (!approvedKeys.has(expected)) {
      fail(`Missing install-script approval for ${expected}: ${reason}`);
    }
  }

  for (const [key, value] of Object.entries(allowScripts)) {
    if (value !== true && value !== false) {
      fail(`allowScripts.${key} must be true or false`);
    }

    if (value === true && !/^(@[^/]+\/[^@]+|[^@/]+)@\d/.test(key)) {
      fail(`Approved install script must be version-pinned: ${key}`);
    }
  }

  return allowScripts;
}

function* packageDirectories(root) {
  if (!existsSync(root)) {
    return;
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const entryPath = join(root, entry.name);

    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith('@')) {
      yield* packageDirectories(entryPath);
      continue;
    }

    if (existsSync(join(entryPath, 'package.json'))) {
      yield entryPath;
    }
  }
}

function collectInstalledInstallScripts() {
  const packages = [];

  for (const packageDir of packageDirectories('node_modules')) {
    const packageJson = readPackageJson(join(packageDir, 'package.json'));
    const scripts = packageJson.scripts ?? {};
    const scriptNames = INSTALL_LIFECYCLE_SCRIPTS.filter(
      (scriptName) => typeof scripts[scriptName] === 'string'
    );

    if (scriptNames.length > 0) {
      packages.push({
        key: `${packageJson.name}@${packageJson.version}`,
        scriptNames
      });
    }
  }

  return packages.sort((left, right) => left.key.localeCompare(right.key));
}

function checkInstalledScriptsFallback(allowScripts) {
  const packages = collectInstalledInstallScripts();
  const pending = packages.filter(({ key }) => allowScripts[key] !== true);

  if (pending.length > 0) {
    fail(
      `Unreviewed installed lifecycle scripts detected:\n${pending
        .map(({ key, scriptNames }) => `- ${key}: ${scriptNames.join(', ')}`)
        .join('\n')}`
    );
  }

  return packages;
}

function isUnknownApproveScriptsCommand(output) {
  return /Unknown command: ["']?approve-scripts/.test(output);
}

function checkPendingScripts(allowScripts) {
  const result = spawnSync(
    'npm',
    ['approve-scripts', '--allow-scripts-pending'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );
  const output = `${result.stdout}${result.stderr}`.trim();

  if (result.status !== 0) {
    if (isUnknownApproveScriptsCommand(output)) {
      const packages = checkInstalledScriptsFallback(allowScripts);
      return `npm approve-scripts is unavailable in this npm version; checked installed lifecycle scripts instead. Approved installed scripts: ${packages
        .map(({ key }) => key)
        .join(', ')}`;
    }

    fail(
      `npm approve-scripts --allow-scripts-pending failed:\n${output || '(no output)'}`
    );
  }

  if (!output.includes('No packages with unreviewed install scripts.')) {
    fail(
      `Unreviewed install scripts detected. Run npm approve-scripts --allow-scripts-pending and update docs/install-script-policy.md.\n${output}`
    );
  }

  return output;
}

try {
  const allowScripts = validateAllowScripts(readPackageJson());
  const output = checkPendingScripts(allowScripts);
  console.log(output);
  console.log('Install-script approval policy is current.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
