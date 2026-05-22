import { readFileSync } from 'node:fs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const mcp = readJson('mcp.json');
const server = readJson('server.json');
const rootLock = lock.packages?.[''];

if (!pkg.name || !pkg.version || !pkg.mcpName) {
  fail('package.json must define name, version, and mcpName');
}

if (lock.name !== pkg.name || rootLock?.name !== pkg.name) {
  fail('package-lock.json package name does not match package.json');
}

if (lock.version !== pkg.version || rootLock?.version !== pkg.version) {
  fail('package-lock.json version does not match package.json');
}

if (mcp.name !== pkg.name) {
  fail('mcp.json name does not match package.json name');
}

if (mcp.version !== pkg.version) {
  fail('mcp.json version does not match package.json version');
}

if (mcp.mcpName !== pkg.mcpName) {
  fail('mcp.json mcpName does not match package.json mcpName');
}

if (server.name !== pkg.mcpName) {
  fail('server.json name does not match package.json mcpName');
}

if (server.version !== pkg.version) {
  fail('server.json version does not match package.json version');
}

const npmPackages = (server.packages ?? []).filter(
  (entry) => entry.registryType === 'npm'
);

if (npmPackages.length !== 1) {
  fail('server.json must contain exactly one npm package entry');
}

const [npmPackage] = npmPackages;

if (npmPackage.identifier !== pkg.name) {
  fail('server.json npm package identifier does not match package.json name');
}

if (npmPackage.version !== pkg.version) {
  fail('server.json npm package version does not match package.json version');
}

console.log(`Version metadata synchronized at ${pkg.version}`);
