import { spawnSync } from 'node:child_process';

const semgrepBinary = process.env.SEMGREP_BIN || 'semgrep';
const result = spawnSync(
  semgrepBinary,
  [
    'scan',
    '--config',
    '.semgrep.yml',
    '--json',
    '--metrics=off',
    '--disable-version-check',
    'test/semgrep/security-patterns.ts'
  ],
  { encoding: 'utf8' }
);

if (result.error) {
  throw new Error(
    `Unable to run Semgrep (${semgrepBinary}): ${result.error.message}`
  );
}

if (result.status !== 0) {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  throw new Error(`Semgrep rule test scan exited with ${result.status}`);
}

const payload = JSON.parse(result.stdout);
const matches = payload.results.map((finding) => finding.check_id);
const counts = new Map();
for (const ruleId of matches) {
  counts.set(ruleId, (counts.get(ruleId) ?? 0) + 1);
}

const expectedCounts = new Map([
  ['debug-recorder.no-dynamic-code-execution', 2],
  ['debug-recorder.no-shell-true', 1],
  ['debug-recorder.no-log-entire-environment', 1]
]);

for (const [ruleId, expectedCount] of expectedCounts) {
  const actualCount = counts.get(ruleId) ?? 0;
  if (actualCount !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} match(es) for ${ruleId}, received ${actualCount}`
    );
  }
}

const unexpected = [...counts.keys()].filter(
  (ruleId) => !expectedCounts.has(ruleId)
);
if (unexpected.length > 0) {
  throw new Error(`Unexpected Semgrep rules matched: ${unexpected.join(', ')}`);
}

console.log('Semgrep repository rules matched the expected secure-code fixtures.');
