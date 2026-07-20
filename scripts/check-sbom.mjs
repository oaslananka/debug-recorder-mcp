#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['sbom', '--sbom-format=cyclonedx'], {
  encoding: 'utf8',
  shell: false
});

if (result.error) {
  console.error(`Unable to generate npm SBOM: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  console.error(`npm SBOM generation exited with ${result.status}`);
  process.exit(result.status ?? 1);
}

let payload;
try {
  payload = JSON.parse(result.stdout);
} catch (error) {
  console.error(
    `npm SBOM output was not valid JSON: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}

if (
  payload.bomFormat !== 'CycloneDX' ||
  typeof payload.specVersion !== 'string'
) {
  console.error('npm SBOM output was not a CycloneDX document.');
  process.exit(1);
}

if (!Array.isArray(payload.components) || payload.components.length === 0) {
  console.error('npm SBOM output did not contain dependency components.');
  process.exit(1);
}

console.log(
  `CycloneDX ${payload.specVersion} SBOM validated with ${payload.components.length} components.`
);
