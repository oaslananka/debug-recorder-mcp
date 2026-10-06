# ADR-0005: MCP Registry Identity and Version Metadata

## Status

Accepted, 2026-05-26.

## Context

The repository publishes an MCP server package and maintains registry metadata
in both `mcp.json` and `server.json`. The stable registry identity is:

```text
io.github.oaslananka/debug-recorder-mcp
```

The npm package identity remains:

```text
debug-recorder-mcp
```

Version drift across `package.json`, `package-lock.json`, `mcp.json`, and
`server.json` would make installs, registry discovery, and release verification
ambiguous.

## Decision

Keep MCP Registry metadata source-controlled and version-synchronized with the
npm package.

Required invariants:

- `package.json.mcpName` is the MCP Registry server name.
- `mcp.json.mcpName` matches `package.json.mcpName`.
- `server.json.name` matches `package.json.mcpName`.
- `server.json.version` matches `package.json.version`.
- `server.json.packages[0].identifier` remains `debug-recorder-mcp`.
- `server.json.packages[0].version` matches `package.json.version`.
- `server.json.packages[0].transport.type` remains `stdio` for the npm package.
- `node scripts/check-version-sync.mjs` and
  `node scripts/validate-mcp-metadata.mjs` gate changes.

Registry publishing remains separate from npm publishing and should happen only
after npm publication is verified.

## Consequences

- Clients and registry consumers see a stable server identity.
- Release automation can update npm and MCP metadata together.
- Registry metadata validation is testable in local and CI gates.
- Adding remote transport metadata requires an intentional update to this ADR
  and to validation scripts.

## Alternatives Considered

- Generate `server.json` only during release: reduces source files, but hides
  registry metadata changes from pull request review.
- Maintain registry metadata manually outside the repository: avoids local
  checks, but increases drift risk.
- Use npm package name as the MCP server name: shorter, but loses namespaced
  registry identity and ownership context.
- Publish registry updates before npm verification: faster, but risks pointing
  registry clients at an unavailable package version.

## Revisit Conditions

- The official MCP Registry changes schema requirements or supported package
  fields.
- The package adds remote Streamable HTTP registry metadata.
- Multiple package artifacts or registries are introduced.
- Registry publishing becomes part of the automated release workflow.

## References

- [Official MCP Registry reference](https://registry.modelcontextprotocol.io/docs)
- [MCP Registry quickstart](https://modelcontextprotocol.org/registry/quickstart)
