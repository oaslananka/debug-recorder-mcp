import { readFileSync } from 'node:fs';

const SERVER_SCHEMA_HOST = 'static.modelcontextprotocol.io';
const EXPECTED_SERVER_NAME = 'io.github.oaslananka/mcp-debug-recorder';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertOfficialServerSchemaReachable(schemaUrl) {
  const url = new URL(schemaUrl);

  assert(
    url.hostname === SERVER_SCHEMA_HOST,
    'server.json $schema must point at the official MCP schema host'
  );

  const response = await fetch(url, {
    headers: {
      accept: 'application/schema+json, application/json'
    }
  });

  assert(
    response.ok,
    `Unable to fetch official MCP server schema: ${response.status} ${response.statusText}`
  );

  const schema = await response.json();
  assert(schema && typeof schema === 'object', 'MCP server schema is not JSON');
  assert(
    schema.$schema || schema.type || schema.properties,
    'MCP server schema does not look like a JSON Schema document'
  );
}

const pkg = readJson('package.json');
const mcp = readJson('mcp.json');
const server = readJson('server.json');

assert(pkg.name === 'mcp-debug-recorder', 'Unexpected package name');
assert(pkg.mcpName === EXPECTED_SERVER_NAME, 'Unexpected MCP package identity');
assert(mcp.name === pkg.name, 'mcp.json name mismatch');
assert(mcp.mcpName === pkg.mcpName, 'mcp.json mcpName mismatch');
assert(mcp.version === pkg.version, 'mcp.json version mismatch');
assert(mcp.transport === 'stdio', 'mcp.json must advertise stdio transport');
assert(mcp.command === 'npx', 'mcp.json command must remain npx');
assert(
  Array.isArray(mcp.args) && mcp.args.includes(pkg.name),
  'mcp.json args must invoke the npm package'
);

assert(server.$schema, 'server.json must declare an official schema URL');
await assertOfficialServerSchemaReachable(server.$schema);
assert(server.name === EXPECTED_SERVER_NAME, 'server.json name mismatch');
assert(server.name === pkg.mcpName, 'server.json/package mcpName mismatch');
assert(server.version === pkg.version, 'server.json version mismatch');
assert(
  server.repository?.url === 'https://github.com/oaslananka/mcp-debug-recorder',
  'server.json repository URL mismatch'
);

const npmPackages = (server.packages ?? []).filter(
  (entry) => entry.registryType === 'npm'
);
assert(npmPackages.length === 1, 'server.json must contain one npm package');

const [npmPackage] = npmPackages;
assert(npmPackage.identifier === pkg.name, 'server.json package mismatch');
assert(
  npmPackage.version === pkg.version,
  'server.json package version mismatch'
);
assert(
  npmPackage.transport?.type === 'stdio',
  'server.json package transport must remain stdio'
);

for (const envVar of npmPackage.environmentVariables ?? []) {
  assert(
    typeof envVar.name === 'string' && envVar.name.length > 0,
    'server.json environment variables must have names'
  );
  assert(
    typeof envVar.isSecret === 'boolean',
    `server.json environment variable ${envVar.name} must declare isSecret`
  );
}

console.log(
  'MCP metadata validated against project invariants and official schema URL'
);
