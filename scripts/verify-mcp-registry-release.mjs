import { execNpmSync } from './npm-cli.mjs';
import { readFileSync } from 'node:fs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function npmViewVersion(packageName, version) {
  try {
    return execNpmSync(['view', `${packageName}@${version}`, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : error.message;
    throw new Error(
      `Unable to verify npm publication for ${packageName}@${version}: ${stderr}`
    );
  }
}

const args = new Set(process.argv.slice(2));
const requireNpm = args.has('--require-npm');

const pkg = readJson('package.json');
const server = readJson('server.json');
const npmPackages = (server.packages ?? []).filter(
  (entry) => entry.registryType === 'npm'
);

assert(pkg.name === 'debug-recorder-mcp', 'Unexpected package name');
assert(
  pkg.mcpName === server.name,
  'package.json mcpName/server.json name mismatch'
);
assert(server.version === pkg.version, 'server.json version mismatch');
assert(
  npmPackages.length === 1,
  'server.json must contain exactly one npm package'
);

const [npmPackage] = npmPackages;
assert(
  npmPackage.identifier === pkg.name,
  'server.json npm package identifier mismatch'
);
assert(
  npmPackage.version === pkg.version,
  'server.json npm package version mismatch'
);
assert(
  npmPackage.transport?.type === 'stdio',
  'server.json npm package transport must remain stdio'
);

if (requireNpm) {
  const publishedVersion = npmViewVersion(pkg.name, pkg.version);
  assert(
    publishedVersion === pkg.version,
    `npm published version mismatch: expected ${pkg.version}, got ${publishedVersion}`
  );
}

console.log(
  requireNpm
    ? `MCP Registry release readiness verified for ${server.name}@${server.version} after npm publication`
    : `MCP Registry metadata readiness verified for ${server.name}@${server.version}`
);
