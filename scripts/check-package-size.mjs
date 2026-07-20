import { spawnSync } from 'node:child_process';

// SQL-backed search paging measures 64.2 KiB packed; keep a 1.8 KiB margin.
const MAX_PACKED_BYTES = 66 * 1024;
// SQL-backed search paging measures 374.4 KiB unpacked; keep a 3.6 KiB margin.
const MAX_UNPACKED_BYTES = 378 * 1024;
const MAX_ENTRY_COUNT = 80;
const SIZE_UNIT_BYTES = 1024;
const PACKAGE_INFO_INDEX = 0;
const NPM_PACK_ARGS = ['pack', '--json', '--dry-run'];

const REQUIRED_PACKAGE_PATHS = [
  'package.json',
  'README.md',
  'LICENSE',
  'mcp.json',
  'server.json',
  'dist/mcp.js',
  'dist/mcp.d.ts',
  'dist/store.js',
  'dist/db.js',
  'dist/types.js'
];

const FORBIDDEN_PACKAGE_PATHS = new Set([
  'package-lock.json',
  '.env',
  '.env.example',
  'doppler.yaml'
]);

const FORBIDDEN_PACKAGE_PREFIXES = [
  '.github/',
  '.codex-checkpoints/',
  '.TEMP/',
  'coverage/',
  'docs/api/',
  'node_modules/',
  'scripts/',
  'src/',
  'test/',
  'test-results/'
];

function fail(message) {
  throw new Error(message);
}

function formatBytes(bytes) {
  return `${(bytes / SIZE_UNIT_BYTES).toFixed(1)} KiB`;
}

function parseJsonOutput(stdout) {
  const trimmed = stdout.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('[');
    const end = trimmed.lastIndexOf(']');

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    fail('Unable to parse npm pack JSON output');
  }
}

function collectForbiddenFiles(files) {
  return files
    .map((file) => file.path)
    .filter(
      (path) =>
        FORBIDDEN_PACKAGE_PATHS.has(path) ||
        FORBIDDEN_PACKAGE_PREFIXES.some((prefix) => path.startsWith(prefix))
    );
}

function validatePackageInfo(packageInfo) {
  const files = Array.isArray(packageInfo.files) ? packageInfo.files : [];
  const filePaths = new Set(files.map((file) => file.path));
  const missingFiles = REQUIRED_PACKAGE_PATHS.filter(
    (path) => !filePaths.has(path)
  );
  const forbiddenFiles = collectForbiddenFiles(files);
  const issues = [];

  if (packageInfo.size > MAX_PACKED_BYTES) {
    issues.push(
      `packed size ${formatBytes(packageInfo.size)} exceeds ${formatBytes(
        MAX_PACKED_BYTES
      )}`
    );
  }

  if (packageInfo.unpackedSize > MAX_UNPACKED_BYTES) {
    issues.push(
      `unpacked size ${formatBytes(
        packageInfo.unpackedSize
      )} exceeds ${formatBytes(MAX_UNPACKED_BYTES)}`
    );
  }

  if (packageInfo.entryCount > MAX_ENTRY_COUNT) {
    issues.push(
      `entry count ${packageInfo.entryCount} exceeds ${MAX_ENTRY_COUNT}`
    );
  }

  if (missingFiles.length > 0) {
    issues.push(`missing required package files: ${missingFiles.join(', ')}`);
  }

  if (forbiddenFiles.length > 0) {
    issues.push(`forbidden package files: ${forbiddenFiles.join(', ')}`);
  }

  return issues;
}

function resolveNpmInvocation() {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...NPM_PACK_ARGS],
      shell: false
    };
  }

  return {
    command: 'npm',
    args: NPM_PACK_ARGS,
    shell: process.platform === 'win32'
  };
}

function runPackDryRun() {
  const invocation = resolveNpmInvocation();
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: 'utf8',
    shell: invocation.shell
  });

  if (result.error) {
    fail(`Unable to run npm pack: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    fail(`npm pack failed with exit code ${result.status ?? 'unknown'}`);
  }

  return parseJsonOutput(result.stdout);
}

const packResult = runPackDryRun();

if (!Array.isArray(packResult) || packResult.length === 0) {
  fail('npm pack did not return package metadata');
}

const packageInfo = packResult[PACKAGE_INFO_INDEX];
const issues = validatePackageInfo(packageInfo);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`Package artifact check failed: ${issue}`);
  }

  process.exit(1);
}

console.log(
  `Package artifact OK: ${packageInfo.filename} ` +
    `${formatBytes(packageInfo.size)} packed, ` +
    `${formatBytes(packageInfo.unpackedSize)} unpacked, ` +
    `${packageInfo.entryCount} files`
);
