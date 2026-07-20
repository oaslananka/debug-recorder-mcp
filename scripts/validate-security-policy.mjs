#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertContains(path, content, needle) {
  if (!content.includes(needle)) {
    throw new Error(`${path} must contain: ${needle}`);
  }
}

function assertFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required security policy file: ${path}`);
  }
}

try {
  assertFile('docs/security-sbom-vex.md');
  assertFile('docs/security/vex/README.md');
  assertFile('docs/security/vex/_template.md');

  const policy = read('docs/security-sbom-vex.md');
  const template = read('docs/security/vex/_template.md');
  const release = read('.github/workflows/release.yml');
  const ci = read('.github/workflows/ci.yml');
  const security = read('.github/workflows/security.yml');

  for (const required of [
    'Production/runtime',
    'Optional/native runtime',
    'Development-only',
    'Scanner-only container/OS',
    'False positive / not affected',
    'Fix immediately',
    'Temporary acceptance',
    'VEX decision record format'
  ]) {
    assertContains('docs/security-sbom-vex.md', policy, required);
  }

  for (const required of [
    'Advisory:',
    'Package and version:',
    'Affected path:',
    'Status:',
    'Justification:',
    'Mitigation:',
    'Tracking issue/PR:',
    'Re-review date:',
    'npm audit --audit-level=moderate',
    'npm sbom --sbom-format=cyclonedx',
    'npm run ci:local'
  ]) {
    assertContains('docs/security/vex/_template.md', template, required);
  }

  for (const required of [
    'npm sbom --sbom-format=cyclonedx',
    'sha256sum',
    'actions/attest-build-provenance',
    'npm publish "$tarball" --access public --provenance',
    'token: ${{ secrets.GH_AUTH_TOKEN }}'
  ]) {
    assertContains('.github/workflows/release.yml', release, required);
  }

  assertContains(
    '.github/workflows/ci.yml',
    ci,
    'Review docs/security-sbom-vex.md before fixing or recording a VEX decision.'
  );
  assertContains(
    '.github/workflows/ci.yml',
    ci,
    'Trivy container scan failed. Review docs/security-sbom-vex.md before fixing or recording a VEX decision.'
  );
  assertContains(
    '.github/workflows/security.yml',
    security,
    'Trivy filesystem scan failed. Review docs/security-sbom-vex.md before fixing or recording a VEX decision.'
  );

  console.log('Security SBOM/VEX policy invariants verified.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
