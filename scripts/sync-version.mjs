import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const mcp = JSON.parse(readFileSync('./mcp.json', 'utf8'));
const server = JSON.parse(readFileSync('./server.json', 'utf8'));

mcp.name = pkg.name;
mcp.version = pkg.version;
mcp.mcpName = pkg.mcpName;

server.name = pkg.mcpName;
server.version = pkg.version;

for (const packageEntry of server.packages ?? []) {
  if (packageEntry.registryType === 'npm') {
    packageEntry.identifier = pkg.name;
    packageEntry.version = pkg.version;
  }
}

writeFileSync('./mcp.json', `${JSON.stringify(mcp, null, 2)}\n`);
writeFileSync('./server.json', `${JSON.stringify(server, null, 2)}\n`);

console.log(`MCP metadata versions synced to ${pkg.version}`);
