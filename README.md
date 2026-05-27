# debug-recorder-mcp

[![npm version](https://img.shields.io/npm/v/debug-recorder-mcp.svg)](https://www.npmjs.com/package/debug-recorder-mcp)
[![License](https://img.shields.io/npm/l/debug-recorder-mcp.svg)](./LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/debug-recorder-mcp.svg)](https://www.npmjs.com/package/debug-recorder-mcp)

`debug-recorder-mcp` answers a simple question fast: have I fixed this before?

It records debug sessions, terminal commands, failed attempts, and successful fixes in a local SQLite database so your MCP client can query your own debugging history in natural language.

## Quick Start

Requires Node.js 22 LTS or 24 LTS.

```bash
npx debug-recorder-mcp
```

By default, data is stored at `~/.debug-recorder-mcp/sessions.db`. The storage
directory keeps the original name so existing local histories continue to load.

## Architecture

```text
src/
├── db.ts           - openDb(), createTestDb(), versioned MIGRATIONS[]
├── store.ts        - Store class with dependency-injected SQLite access
├── search.ts       - FTS5 + Fuse.js hybrid search
├── tools/          - MCP tool handlers grouped by session/search/admin concerns
├── types.ts        - Zod schemas and TypeScript types
├── mcp.ts          - MCP server wiring + tool registration
├── server-http.ts  - Streamable HTTP transport
├── logging.ts      - Structured logging with secret redaction
└── version.ts      - Package version helper
```

### Schema versioning

The database schema is versioned via `PRAGMA user_version`. Migrations run automatically on startup, so upgrading does not require manual SQL.

### Adding a custom database path

```bash
DEBUG_RECORDER_DB=/path/to/custom.db npx debug-recorder-mcp
```

## Configuration

### Environment variables

- `DEBUG_RECORDER_DB`: override the SQLite database path
- `HOST`: HTTP bind host for Streamable HTTP mode. Defaults to `127.0.0.1`
- `PORT`: HTTP port for Streamable HTTP mode. Defaults to `3000`
- `DEBUG_RECORDER_HTTP_TOKEN`: optional bearer token for local HTTP, required for non-loopback HTTP
- `DEBUG_RECORDER_ALLOWED_HOSTS`: comma-separated HTTP `Host` allowlist
- `DEBUG_RECORDER_ALLOWED_ORIGINS`: comma-separated browser `Origin` allowlist
- `DEBUG_RECORDER_MAX_BODY_BYTES`: HTTP JSON body limit. Defaults to `1048576`
- `DEBUG_RECORDER_REMOTE_HTTP`: must be `true` before binding to a non-loopback host
- `DEBUG_RECORDER_REDACT_BEFORE_STORE`: set `true` to redact common secret patterns before persistence
- `LOG_LEVEL`: minimum structured log level (`debug`, `info`, `warn`, `error`)
- `FUZZY_THRESHOLD`: override the Fuse.js threshold used during reranking

## Available Tools

- `start_debug_session`: start tracking a new issue
- `add_fix`: record a failed or successful fix attempt
- `record_command`: save a terminal command and its output
- `close_session`: mark a session as resolved or abandoned
- `update_session`: edit title, description, or tags
- `delete_session`: permanently delete a session with explicit confirmation
- `search_sessions`: search historical sessions with FTS5 + fuzzy reranking
- `find_similar_errors`: ask whether you have seen a similar error before
- `get_session`: fetch full session details
- `get_session_context`: fetch an AI-friendly summary of a session
- `list_sessions`: browse sessions with filters
- `get_stats`: summarize your debug history
- `export_sessions`: export your local history for backup or migration
- `import_sessions`: import a previously exported JSON payload

## Client Setup

### Desktop MCP Clients

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

### CLI MCP Clients

```bash
mcp-client add debug-recorder-mcp -- npx debug-recorder-mcp
mcp-client list
```

### Gemini CLI

```bash
gemini mcp add debug-recorder-mcp npx debug-recorder-mcp
gemini mcp list
```

### Antigravity

```powershell
antigravity --add-mcp "{\"name\":\"debug-recorder-mcp\",\"command\":\"npx\",\"args\":[\"debug-recorder-mcp\"]}"
```

## Real Usage Examples

### Have I seen this before?

> "I'm getting `TypeError: Cannot read properties of undefined`, have I seen this before?"

Call `find_similar_errors` with the current error text, then inspect the best match with `get_session_context`.

### Record an active incident

1. Call `start_debug_session`
2. Add terminal commands with `record_command`
3. Add each attempted fix with `add_fix`
4. Use `update_session` when the title or notes become clearer
5. Close the session with `close_session`

### Back up your local debug history

1. Call `export_sessions` with `format: "json"`
2. Save the returned JSON in your preferred backup system
3. Restore later with `import_sessions`

## Data Storage

- Default path: `~/.debug-recorder-mcp/sessions.db`
- Portable SQLite storage with `better-sqlite3`
- FTS5-backed search index for large histories
- No external database server required

> Note: `better-sqlite3` uses a native addon. If you see binding errors, run `npm rebuild better-sqlite3` for your Node version.

## HTTP Transport

The package also supports local Streamable HTTP:

```bash
npm run start:http
```

Useful routes:

- `GET /health`
- `GET /version`
- MCP endpoint: `POST /mcp`

HTTP mode is intentionally local-first. It binds to `127.0.0.1` by default,
creates an isolated stateless MCP server and transport for every request, checks
the `Host` header, checks `Origin` when present, and enforces a JSON body-size
limit before the MCP transport sees the request.

If you deliberately expose HTTP outside loopback, all of these must be set:

```bash
HOST=0.0.0.0
DEBUG_RECORDER_REMOTE_HTTP=true
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token
DEBUG_RECORDER_ALLOWED_HOSTS=debug-recorder.example.com
DEBUG_RECORDER_ALLOWED_ORIGINS=https://debug-recorder.example.com
npm run start:http
```

Then call `/mcp` with `Authorization: Bearer <token>`. Wildcard origins are not
accepted for remote mode.

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

The image is built with `npm ci`, preserves native install scripts for
`better-sqlite3`, prunes development dependencies, and runs as the non-root
`node` user.

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
npm audit --audit-level=moderate
npm pack --dry-run
npm run check:package-size
node scripts/check-version-sync.mjs
node scripts/validate-mcp-metadata.mjs
npm run docs:api
```

For release verification:

```bash
npm run format:check
npm run check:dead-code
npm run test:coverage
npm run test:fuzz
npm run check:package-size
npm run prepublishOnly
```

Additional project docs:

- [Usage](./docs/usage.md)
- [Configuration](./docs/configuration.md)
- [Architecture](./docs/architecture.md)
- [Security](./docs/security.md)
- [Operations](./docs/operations.md)
- [Architecture Decision Records](./docs/adr/README.md)
- [Testing](./docs/testing.md)
- [Search Algorithm](./docs/search-algorithm.md)
- [Release Flow](./docs/release-flow.md)
- [Support](./SUPPORT.md)
- [Versioning Policy](./VERSIONING.md)
- [Roadmap](./ROADMAP.md)
