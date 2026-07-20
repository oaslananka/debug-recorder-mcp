#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const DEFAULT_PROJECT_KEY = 'oaslananka_debug-recorder-mcp';
const DEFAULT_BRANCH = 'main';
const STATUS_LABELS = new Map([
  ['OK', 'OK'],
  ['ERROR', 'ERROR'],
  ['WARN', 'WARN'],
  ['NONE', 'NONE']
]);
const METRIC_LABELS = new Map([
  ['new_reliability_rating', 'new_reliability_rating'],
  ['new_security_rating', 'new_security_rating'],
  ['new_maintainability_rating', 'new_maintainability_rating'],
  ['new_duplicated_lines_density', 'new_duplicated_lines_density'],
  ['new_security_hotspots_reviewed', 'new_security_hotspots_reviewed'],
  ['new_coverage', 'new_coverage']
]);
const COMPARATOR_LABELS = new Map([
  ['GT', 'GT'],
  ['LT', 'LT'],
  ['EQ', 'EQ'],
  ['NE', 'NE']
]);

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
  const url = new URL('https://sonarcloud.io/api/qualitygates/project_status');
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

function numericLabel(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : 'unknown';
}

function describeCondition(condition) {
  const metric = METRIC_LABELS.get(condition.metricKey) ?? 'unknown_metric';
  const actual = numericLabel(condition.actualValue);
  const threshold = numericLabel(condition.errorThreshold);
  const comparator =
    COMPARATOR_LABELS.get(condition.comparator) ?? 'unknown_comparator';
  return `${metric}: actual=${actual}, threshold=${threshold}, comparator=${comparator}`;
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
  const statusLabel = STATUS_LABELS.get(projectStatus.status) ?? 'UNKNOWN';

  if (projectStatus.status === 'OK') {
    console.log('SonarQube Cloud quality gate: OK');
    process.exit(0);
  }

  console.error(`SonarQube Cloud quality gate: ${statusLabel}`);
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
