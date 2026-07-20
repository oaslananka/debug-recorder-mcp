# debug-recorder-mcp

<p align="center">
  <strong>Local-first debug memory for MCP clients.</strong><br />
  Record incidents, commands, failed attempts, successful fixes, diagnostics, and searchable debugging history in SQLite.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/debug-recorder-mcp"><img alt="npm version" src="https://img.shields.io/npm/v/debug-recorder-mcp.svg" /></a>
  <a href="https://www.npmjs.com/package/debug-recorder-mcp"><img alt="npm downloads" src="https://img.shields.io/npm/dm/debug-recorder-mcp.svg" /></a>
  <a href="https://github.com/oaslananka/debug-recorder-mcp/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/oaslananka/debug-recorder-mcp/ci.yml?branch=main&label=ci" /></a>
  <a href="https://github.com/oaslananka/debug-recorder-mcp/actions/workflows/release.yml"><img alt="Release" src="https://img.shields.io/github/actions/workflow/status/oaslananka/debug-recorder-mcp/release.yml?branch=main&label=release" /></a>
  <a href="https://github.com/oaslananka/debug-recorder-mcp/actions/workflows/docs.yml"><img alt="Docs" src="https://img.shields.io/github/actions/workflow/status/oaslananka/debug-recorder-mcp/docs.yml?branch=main&label=docs" /></a>
  <a href="https://github.com/oaslananka/debug-recorder-mcp/actions/workflows/codeql.yml"><img alt="CodeQL" src="https://img.shields.io/github/actions/workflow/status/oaslananka/debug-recorder-mcp/codeql.yml?branch=main&label=codeql" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
  <a href="https://www.buymeacoffee.com/oaslananka"><img alt="Sponsor" src="https://img.shields.io/badge/sponsor-Buy%20me%20a%20coffee-FFDD00?logo=buymeacoffee&logoColor=111827" /></a>
</p>

<p align="center">
  <a href="https://oaslananka.github.io/debug-recorder-mcp/">Published docs</a>
  · <a href="./docs/usage.md">Usage</a>
  · <a href="./docs/client-recipes.md">Client recipes</a>
  · <a href="./docs/security.md">Security</a>
  · <a href="./docs/release-flow.md">Release flow</a>
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/oaslananka">
    <img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=oaslananka&button_colour=FFDD00&font_colour=000000&font_family=Arial&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" />
  </a>
</p>

## Why this exists

Debugging knowledge usually disappears into chat windows, terminals, and commit history. `debug-recorder-mcp` gives MCP-enabled agents and IDEs a durable local memory so they can answer:

> “Have I fixed this before?”

It stores each debugging session, error, command, attempted fix, working fix, tags, and context in a local SQLite database. Search combines SQLite FTS5 with fuzzy reranking, reusable presets, pagination metadata, related-session groups, and optional Markdown exports.

## Highlights

- **Local-first storage:** no external database or hosted service required.
- **MCP-native tools:** stdio server for desktop MCP clients plus optional Streamable HTTP mode.
- **Search that survives messy errors:** FTS5 + Fuse.js reranking for stack traces, typos, Unicode, and punctuation-heavy logs.
- **Reusable search presets:** save common filters and limits for recurring incident patterns.
- **Safe operations:** redaction-before-store option, explicit destructive confirmations, local HTTP host/origin/auth/body-limit hardening.
- **Diagnostics:** `get_diagnostics` returns redacted runtime, schema, package, and health signals for support without leaking raw paths, tokens, stack traces, or command output.
- **Release-grade packaging:** audit, coverage, fuzzing, package-size gates, SBOM/VEX policy, install-script approvals, provenance-ready release workflow, and MCP Registry readiness checks.

## Quick start

Requires Node.js **22 LTS** or **24 LTS** and npm **10+**.

```bash
npx debug-recorder-mcp
```

Default database path:

```text
~/.debug-recorder-mcp/sessions.db
```

Use a custom database path:

```bash
DEBUG_RECORDER_DB=/path/to/custom.db npx debug-recorder-mcp
```

## MCP client setup

### Desktop MCP clients

```json
{
  "mcpServers": {
    "debug-recorder-mcp": {
      "command": "npx",
      "args": ["debug-recorder-mcp"]
    }
  }
}
```

### VS Code / GitHub Copilot

Create or update `.vscode/mcp.json`:

```json
{
  "servers": {
    "debug-recorder-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["debug-recorder-mcp"]
    }
  }
}
```

More setup examples are in [Client setup recipes](./docs/client-recipes.md).

## Available MCP tools

| Tool                   | Purpose                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `start_debug_session`  | Start tracking a new issue or incident.                                                              |
| `add_fix`              | Record a failed or successful fix attempt.                                                           |
| `record_command`       | Save a command, output, exit code, and session link.                                                 |
| `close_session`        | Mark a session as resolved or abandoned.                                                             |
| `update_session`       | Edit title, description, or tags.                                                                    |
| `delete_session`       | Permanently delete a session with explicit confirmation.                                             |
| `search_sessions`      | Search history with FTS5, fuzzy reranking, pagination, related groups, and optional Markdown export. |
| `save_search_preset`   | Store a reusable query, filters, and limit.                                                          |
| `list_search_presets`  | List saved search presets.                                                                           |
| `remove_search_preset` | Remove a saved search preset by name.                                                                |
| `find_similar_errors`  | Ask whether a similar error has appeared before.                                                     |
| `get_session`          | Fetch full details, fixes, and commands.                                                             |
| `get_session_context`  | Get an AI-friendly session summary.                                                                  |
| `list_sessions`        | Browse sessions with filters.                                                                        |
| `get_stats`            | Summarize debug history.                                                                             |
| `get_diagnostics`      | Return a redacted operational diagnostics snapshot.                                                  |
| `export_sessions`      | Export a full JSON backup or a lightweight summary inventory.                                        |
| `import_sessions`      | Import a validated export payload.                                                                   |

## Real usage examples

### Have I seen this before?

Ask your MCP client:

> I am getting `TypeError: Cannot read properties of undefined`. Have I seen this before?

The client can call `find_similar_errors`, then inspect the best match with `get_session_context`.

### Record an active incident

1. Call `start_debug_session` with the problem title and error details.
2. Add terminal commands with `record_command`.
3. Add each attempted fix with `add_fix`.
4. Improve title, notes, or tags with `update_session`.
5. Close the incident with `close_session`.

### Back up or migrate history

1. Call `export_sessions` with `format: "json"`. The response is marked with
   `format: "json"` and contains the full `sessions`, `fixes`, and `commands`
   arrays.
2. Store the returned object in your backup system.
3. Restore later by passing that object as `import_sessions.payload`.

For a lightweight inventory, call `export_sessions` with `format: "summary"`.
Summary responses are marked with `format: "summary"`, include aggregate
`stats` and abbreviated session rows, and are not restore payloads.

## HTTP transport

The package also supports local Streamable HTTP:

```bash
npm run start:http
```

Useful routes:

- `GET /health`
- `GET /version`
- MCP endpoint: `POST /mcp`

HTTP mode is local-first by default. It binds to `127.0.0.1`, creates an isolated stateless MCP server/transport per request, validates `Host`, validates browser `Origin` when present, and enforces a JSON body-size limit before the MCP transport receives the request.

For deliberate non-loopback exposure, set all of these:

```bash
HOST=0.0.0.0
DEBUG_RECORDER_REMOTE_HTTP=true
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token
DEBUG_RECORDER_ALLOWED_HOSTS=debug-recorder.example.com
DEBUG_RECORDER_ALLOWED_ORIGINS=https://debug-recorder.example.com
npm run start:http
```

Wildcard origins are rejected for remote mode.

## Configuration

| Variable                             | Description                                                           |
| ------------------------------------ | --------------------------------------------------------------------- |
| `DEBUG_RECORDER_DB`                  | Override the SQLite database path.                                    |
| `HOST`                               | HTTP bind host. Defaults to `127.0.0.1`.                              |
| `PORT`                               | HTTP port. Defaults to `3000`.                                        |
| `DEBUG_RECORDER_HTTP_TOKEN`          | Optional bearer token for local HTTP; required for non-loopback HTTP. |
| `DEBUG_RECORDER_ALLOWED_HOSTS`       | Comma-separated HTTP `Host` allowlist.                                |
| `DEBUG_RECORDER_ALLOWED_ORIGINS`     | Comma-separated browser `Origin` allowlist.                           |
| `DEBUG_RECORDER_MAX_BODY_BYTES`      | HTTP JSON body limit. Defaults to `1048576`.                          |
| `DEBUG_RECORDER_REMOTE_HTTP`         | Must be `true` before binding to a non-loopback host.                 |
| `DEBUG_RECORDER_REDACT_BEFORE_STORE` | Set `true` to redact common secret patterns before persistence.       |
| `LOG_LEVEL`                          | Minimum structured log level: `debug`, `info`, `warn`, or `error`.    |
| `FUZZY_THRESHOLD`                    | Override the Fuse.js reranking threshold.                             |

## Data and privacy

- Database: local SQLite via `better-sqlite3`.
- Search index: SQLite FTS5 virtual table.
- Default path: `~/.debug-recorder-mcp/sessions.db`.
- Redaction: optional before-store redaction plus diagnostics redaction.
- Deletion: destructive operations require explicit confirmation.
- Maintenance: see [Storage retention and maintenance](./docs/storage-retention.md).

> `better-sqlite3` uses a native addon. If Node versions change and bindings fail, run `npm rebuild better-sqlite3`.

## Docker

```bash
docker build -t debug-recorder-mcp:local .
docker run --rm -p 127.0.0.1:3000:3000 \
  -e HOST=0.0.0.0 \
  -e DEBUG_RECORDER_REMOTE_HTTP=true \
  -e DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token \
  -e DEBUG_RECORDER_ALLOWED_HOSTS=127.0.0.1:3000,localhost:3000 \
  -e DEBUG_RECORDER_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000 \
  debug-recorder-mcp:local
```

The image installs with `npm ci`, preserves reviewed native install scripts, prunes development dependencies, and runs as the non-root `node` user.

## Documentation

Published documentation is generated by `npm run docs:site` and published to GitHub Pages:

```text
https://oaslananka.github.io/debug-recorder-mcp/
```

Important docs:

- [Usage](./docs/usage.md)
- [Client setup recipes](./docs/client-recipes.md)
- [Configuration](./docs/configuration.md)
- [Architecture](./docs/architecture.md)
- [Security](./docs/security.md)
- [Operations](./docs/operations.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Storage retention](./docs/storage-retention.md)
- [Testing](./docs/testing.md)
- [Release flow](./docs/release-flow.md)
- [Install-script policy](./docs/install-script-policy.md)
- [SBOM/VEX policy](./docs/security-sbom-vex.md)
- [Architecture decision records](./docs/adr/README.md)

## Development

```bash
npm ci
npm run format:check
npm run lint
npm run check:dead-code
npm run test:coverage
npm run test:fuzz
npm run build
npm run test:e2e
npm run audit
npm run check:install-scripts
npm pack --dry-run
npm run check:package-size
npm run check:version
npm run check:mcp
npm run check:security-policy
npm run check:sbom
npm run docs:site
```

Full local gate:

```bash
npm run ci:local
```

Release readiness:

```bash
npm run prepublishOnly
npm run check:mcp-registry
```

## Release and npm publishing

The normal release workflow uses Release Please, builds release assets, generates SBOM/checksums, attests the tarball, uploads GitHub Release assets, and publishes to npm with provenance.

For the first npm package creation, use the manual **Initial npm Token Publish** workflow with repository secret `NPM_TOKEN`. After the package exists and npm trusted publishing is configured, the regular **Release** workflow can publish through GitHub OIDC. Details are in [Release flow](./docs/release-flow.md).

## License

Released under the [MIT License](./LICENSE). `package.json` also declares `"license": "MIT"`, and the npm package includes `LICENSE`.

## Funding

If this project saves you debugging time, support development here:

- Buy Me a Coffee: <https://www.buymeacoffee.com/oaslananka>
- GitHub Sponsors: <https://github.com/sponsors/oaslananka>

Funding metadata is available in both `.github/FUNDING.yml` and `package.json`.

## Agent plugin and runtime configuration

This repository owns the product-level agent plugin, MCP runtime configuration, and product-specific skills for `debug-recorder-mcp`. The central [`agent-tools`](https://github.com/oaslananka/agent-tools) repository should catalog this plugin, but the manifest and workflow instructions live here so they stay synchronized with the actual MCP server package.

| File                                                           | Purpose                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json)     | Claude Code-valid product plugin manifest.                    |
| [`.mcp.json`](.mcp.json)                                       | Claude Code project-local MCP server configuration.           |
| [`.codex/config.example.toml`](.codex/config.example.toml)     | Codex CLI MCP configuration example.                          |
| [`.vscode/mcp.example.json`](.vscode/mcp.example.json)         | VS Code / GitHub Copilot workspace MCP configuration example. |
| [`opencode.example.jsonc`](opencode.example.jsonc)             | OpenCode project MCP configuration example.                   |
| `.opencode/skills/`                                            | OpenCode-native mirrored skill definitions.                   |
| [`docs/agent-runtime-config.md`](docs/agent-runtime-config.md) | Agent runtime setup and validation notes.                     |

Validate plugin packaging locally:

```bash
claude plugin validate .
```
