import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const repositoryConfig = JSON.parse(readFileSync('renovate.json', 'utf8'));
const globalConfig = JSON.parse(
  readFileSync('.github/renovate-global.json', 'utf8')
);
const workflow = readFileSync('.github/workflows/renovate.yml', 'utf8');

for (const preset of [
  'config:recommended',
  'docker:pinDigests',
  'helpers:pinGitHubActionDigests',
  ':configMigration',
  ':pinDevDependencies',
  'abandonments:recommended'
]) {
  assert.ok(repositoryConfig.extends.includes(preset), `missing preset: ${preset}`);
}

assert.deepEqual(globalConfig.repositories, [
  'oaslananka/debug-recorder-mcp'
]);
assert.equal(globalConfig.autodiscover, false);
assert.equal(globalConfig.onboarding, false);
assert.equal(globalConfig.requireConfig, 'required');
assert.equal(globalConfig.branchPrefix, 'renovate-managed/');
assert.equal(globalConfig.platformCommit, 'enabled');

assert.ok(
  repositoryConfig.customManagers.some(
    (manager) => manager.depNameTemplate === 'ghcr.io/renovatebot/renovate'
  ),
  'Renovate runtime custom manager is missing'
);
assert.ok(
  repositoryConfig.packageRules.some(
    (rule) =>
      rule.matchUpdateTypes?.includes('major') &&
      rule.dependencyDashboardApproval === true &&
      rule.automerge === false
  ),
  'major updates must require dashboard approval'
);
assert.ok(
  repositoryConfig.packageRules.some(
    (rule) =>
      rule.matchPackageNames?.includes('better-sqlite3') &&
      rule.dependencyDashboardApproval === true &&
      rule.automerge === false
  ),
  'native dependencies must require manual review'
);

assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /cron: '17 3 \* \* 1-5'/);
assert.match(
  workflow,
  /renovatebot\/github-action@3064367f740a1a91cca218698a63902689cce200 # v46\.1\.20/
);
assert.match(workflow, /renovate-version: 43\.272\.4/);
assert.match(workflow, /token: \$\{\{ secrets\.GH_AUTH_TOKEN \}\}/);

console.log('Renovate repository policy and self-hosted runner are consistent.');
