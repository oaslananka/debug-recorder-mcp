#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const DEFAULT_PROJECT_KEY = 'oaslananka_debug-recorder-mcp';
const DEFAULT_BRANCH = 'main';

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function loadPayload() {
  const inputPath = optionValue('--input');
  if (inputPath) {
    return JSON.parse(await readFile(inputPath, 'utf8'));
  }

  const projectKey = optionValue('--project') || DEFAULT_PROJECT_KEY;
  const branch = optionValue('--branch') || DEFAULT_BRANCH;
  const url = new URL(
    'https://sonarcloud.io/api/qualitygates/project_status'
  );
  url.searchParams.set('projectKey', projectKey);
  url.searchParams.set('branch', branch);

  const response = await fetch(url, {
    headers: { accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error(
      `SonarQube Cloud returned ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function describeCondition(condition) {
  const actual = condition.actualValue ?? 'unknown';
  const threshold = condition.errorThreshold ?? 'unknown';
  return `${condition.metricKey}: actual=${actual}, threshold=${threshold}, comparator=${condition.comparator ?? 'unknown'}`;
}

try {
  const payload = await loadPayload();
  const projectStatus = payload.projectStatus;
  if (!projectStatus || typeof projectStatus.status !== 'string') {
    throw new Error('SonarQube Cloud response did not contain projectStatus');
  }

  const failedConditions = (projectStatus.conditions ?? []).filter(
    (condition) => condition.status !== 'OK'
  );

  if (projectStatus.status === 'OK') {
    console.log('SonarQube Cloud quality gate: OK');
    process.exit(0);
  }

  console.error(`SonarQube Cloud quality gate: ${projectStatus.status}`);
  for (const condition of failedConditions) {
    console.error(`- ${describeCondition(condition)}`);
  }
  process.exit(1);
} catch (error) {
  console.error(
    `Unable to evaluate the SonarQube Cloud quality gate: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(2);
}
