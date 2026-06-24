#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const EXPECTED_SERVER_NAME = 'io.github.oaslananka/debug-recorder-mcp';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseArgs(argv) {
  const options = {
    version: process.env.VERSION,
    skipNpm: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--skip-npm') {
      options.skipNpm = true;
      continue;
    }

    if (arg === '--version') {
      const value = argv[index + 1];
      assert(value, '--version requires a value');
      options.version = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--version=')) {
      options.version = arg.slice('--version='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function npmViewVersion(packageName, version) {
  return execFileSync('npm', ['view', `${packageName}@${version}`, 'version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function validatePackage(pkg, expectedVersion) {
  assert(pkg.name === 'debug-recorder-mcp', 'Unexpected package name');
  assert(pkg.mcpName === EXPECTED_SERVER_NAME, 'Unexpected MCP identity');
  assert(
    pkg.version === expectedVersion,
    `package.json version ${pkg.version} does not match release version ${expectedVersion}`
  );
}

function validateMcpMetadata(mcp, pkg, expectedVersion) {
  assert(mcp.name === pkg.name, 'mcp.json name mismatch');
  assert(mcp.mcpName === pkg.mcpName, 'mcp.json mcpName mismatch');
  assert(mcp.version === expectedVersion, 'mcp.json release version mismatch');
  assert(mcp.command === 'npx', 'mcp.json must use npx');
  assert(
    Array.isArray(mcp.args) && mcp.args.includes(pkg.name),
    'mcp.json args must invoke the npm package'
  );
}

function validateServerMetadata(server, pkg, expectedVersion) {
  assert(server.name === EXPECTED_SERVER_NAME, 'server.json name mismatch');
  assert(server.name === pkg.mcpName, 'server.json/package identity mismatch');
  assert(
    server.version === expectedVersion,
    'server.json release version mismatch'
  );

  const npmPackages = (server.packages ?? []).filter(
    (entry) => entry.registryType === 'npm'
  );
  assert(npmPackages.length === 1, 'server.json must contain one npm package');

  const [npmPackage] = npmPackages;
  assert(
    npmPackage.identifier === pkg.name,
    'server.json npm package mismatch'
  );
  assert(
    npmPackage.version === expectedVersion,
    'server.json npm package release version mismatch'
  );
  assert(
    npmPackage.transport?.type === 'stdio',
    'server.json npm package transport must be stdio'
  );

  return npmPackage;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const pkg = readJson('package.json');
  const expectedVersion = options.version ?? pkg.version;
  const mcp = readJson('mcp.json');
  const server = readJson('server.json');

  validatePackage(pkg, expectedVersion);
  validateMcpMetadata(mcp, pkg, expectedVersion);
  const npmPackage = validateServerMetadata(server, pkg, expectedVersion);

  if (!options.skipNpm) {
    const publishedVersion = npmViewVersion(
      npmPackage.identifier,
      expectedVersion
    );
    assert(
      publishedVersion === expectedVersion,
      `npm registry returned ${publishedVersion}, expected ${expectedVersion}`
    );
  }

  console.log(
    options.skipNpm
      ? `MCP Registry metadata is ready for ${expectedVersion}; npm publication check skipped`
      : `MCP Registry metadata is ready for ${expectedVersion} and npm publication is verified`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
