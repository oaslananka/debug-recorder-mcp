# Operations

## Stdio

Run the default stdio server:

```bash
npx debug-recorder-mcp
```

Use `DEBUG_RECORDER_DB` to place the SQLite database somewhere other than
`~/.debug-recorder-mcp/sessions.db`.

## Local HTTP

```bash
npm run start:http
curl -fsS http://127.0.0.1:3000/health
```

The local HTTP server validates `Host` and `Origin` and enforces a body-size
limit. Set `DEBUG_RECORDER_HTTP_TOKEN` if local token auth is desired.

## Remote deployment boundaries

The built-in bearer token is private/shared-secret mode. Use it only when all
callers intentionally share one trust boundary and one SQLite dataset, such as
an encrypted private network or a private reverse proxy. Bind the core to
loopback whenever a proxy is present and prevent direct network access around
the proxy.

Do not expose the built-in token mode as a public multi-user service. The future
public profile requires an external authorization server, an MCP-aware gateway,
OAuth protected-resource discovery, audience/resource validation, scopes, TLS,
rate limits, request correlation, proxy trust, audit events, and a subject/tenant
storage decision. See [Public HTTP authorization](./public-http-authorization.md).

## Docker

Build:

```bash
docker build -t debug-recorder-mcp:local .
```

Run with a host-published port:

```bash
docker run --rm -p 127.0.0.1:3000:3000 \
  -e HOST=0.0.0.0 \
  -e DEBUG_RECORDER_REMOTE_HTTP=true \
  -e DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token \
  -e DEBUG_RECORDER_ALLOWED_HOSTS=127.0.0.1:3000,localhost:3000 \
  -e DEBUG_RECORDER_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000 \
  debug-recorder-mcp:local
```

The image installs native dependencies with `npm ci`, prunes development
dependencies, and runs as the non-root `node` user.

The Dockerfile pins `node:24-bookworm-slim` by multi-architecture digest. When
refreshing the base image, verify the digest with:

```bash
docker buildx imagetools inspect node:24-bookworm-slim
```

Security workflow tools must stay pinned and updateable. `actionlint` is
installed through a fixed Go module version, and `zizmor` runs through the
official pinned `zizmor-action` commit with an exact `zizmor` version.

## Diagnostics

Use `get_diagnostics` for a safe runtime snapshot before sharing issue details.
It reports package/runtime versions, schema version, aggregate stats, and
lightweight counters without raw tokens, command output, stack traces, or local
paths. See [Troubleshooting](./troubleshooting.md) for the full flow.

## Backups, retention, and compaction

Use `export_sessions` for JSON backups and `import_sessions` for restores.
Imports validate schema version, parent-child relationships, and batch limits
before writing records.

For retention, redaction, backup, restore, migration rollback, and SQLite
compaction guidance, see [Storage retention and maintenance](./storage-retention.md).

Run safe local compaction after large delete/import cycles and while no MCP
client is writing to the database:

```bash
node scripts/compact-sqlite.mjs --db ~/.debug-recorder-mcp/sessions.db
```
