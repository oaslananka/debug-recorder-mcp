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
  const renovate = read('.github/workflows/renovate.yml');
  const semgrep = read('.github/workflows/semgrep.yml');
  const snyk = read('.github/workflows/snyk.yml');
  const manifest = JSON.parse(read('package.json'));
  const lockfile = JSON.parse(read('package-lock.json'));

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

  assertContains(
    '.github/workflows/release.yml',
    release,
    'environment: release-automation'
  );
  assertContains(
    '.github/workflows/renovate.yml',
    renovate,
    'environment: dependency-automation'
  );
  assertContains(
    '.github/workflows/semgrep.yml',
    semgrep,
    'environment: semgrep-appsec'
  );
  assertContains('.github/workflows/snyk.yml', snyk, 'environment: snyk');
  assertContains('.github/workflows/snyk.yml', snyk, 'npm ci --ignore-scripts');
  assertContains(
    '.github/workflows/snyk.yml',
    snyk,
    'node scripts/run-snyk.mjs --required'
  );
  assertContains('package.json', read('package.json'), '"check:sbom"');
  if (snyk.includes('snyk/actions/setup')) {
    throw new Error(
      '.github/workflows/snyk.yml must not depend on the Snyk binary CDN setup action'
    );
  }

  const requiredOverrides = {
    'fast-uri': '3.1.4',
    'js-yaml': '4.3.0',
    'markdown-it': '14.3.0'
  };
  for (const [dependency, expectedVersion] of Object.entries(
    requiredOverrides
  )) {
    if (manifest.overrides?.[dependency] !== expectedVersion) {
      throw new Error(
        `package.json override ${dependency} must remain pinned to ${expectedVersion}`
      );
    }
  }

  const requiredVersionScopedOverrides = {
    'brace-expansion@1.1.15': '1.1.16',
    'brace-expansion@5.0.6': '5.0.7'
  };
  for (const [dependency, expectedVersion] of Object.entries(
    requiredVersionScopedOverrides
  )) {
    if (manifest.overrides?.[dependency] !== expectedVersion) {
      throw new Error(
        `package.json override ${dependency} must remain pinned to ${expectedVersion}`
      );
    }
  }

  const forbiddenLockedVersions = new Map([
    ['brace-expansion', new Set(['1.1.15', '5.0.6'])],
    ['fast-uri', new Set(['3.1.2'])],
    ['js-yaml', new Set(['4.2.0'])],
    ['linkify-it', new Set(['5.0.1'])]
  ]);
  for (const [packagePath, packageMetadata] of Object.entries(
    lockfile.packages ?? {}
  )) {
    for (const [dependency, forbiddenVersions] of forbiddenLockedVersions) {
      if (
        (packagePath === `node_modules/${dependency}` ||
          packagePath.endsWith(`/node_modules/${dependency}`)) &&
        forbiddenVersions.has(packageMetadata.version)
      ) {
        throw new Error(
          `package-lock.json contains vulnerable ${dependency}@${packageMetadata.version}`
        );
      }
    }
  }

  console.log('Security SBOM/VEX policy invariants verified.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
