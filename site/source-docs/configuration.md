# Configuration

## Environment variables

| Variable                             | Default                                          | Purpose                                                                    |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `DEBUG_RECORDER_DB`                  | `~/.debug-recorder-mcp/sessions.db`              | Overrides the SQLite database location.                                    |
| `HOST`                               | `127.0.0.1`                                      | HTTP bind host for `npm run start:http`.                                   |
| `PORT`                               | `3000`                                           | HTTP port for `npm run start:http`.                                        |
| `DEBUG_RECORDER_HTTP_TOKEN`          | unset                                            | Optional bearer token for loopback HTTP. Required for non-loopback HTTP.   |
| `DEBUG_RECORDER_ALLOWED_HOSTS`       | `127.0.0.1:<PORT>,localhost:<PORT>,[::1]:<PORT>` | Comma-separated allowlist for the HTTP `Host` header.                      |
| `DEBUG_RECORDER_ALLOWED_ORIGINS`     | loopback origins for `<PORT>`                    | Comma-separated allowlist for browser `Origin` headers when present.       |
| `DEBUG_RECORDER_MAX_BODY_BYTES`      | `1048576`                                        | Maximum JSON body size accepted by the HTTP endpoint.                      |
| `DEBUG_RECORDER_REMOTE_HTTP`         | `false`                                          | Enable non-loopback HTTP with a supported true value.                      |
| `DEBUG_RECORDER_REDACT_BEFORE_STORE` | `false`                                          | Redact common token patterns before saving session, command, and fix text. |
| `LOG_LEVEL`                          | `info`                                           | Minimum structured log level: `debug`, `info`, `warn`, or `error`.         |
| `FUZZY_THRESHOLD`                    | `0.5`                                            | Fuse.js threshold used by search reranking and fallback fuzzy search.      |

Boolean variables accept `true`/`false`, `1`/`0`, and `yes`/`no`. Values are
case-insensitive and surrounding whitespace is ignored. Unsupported values fail
startup with an explicit configuration error instead of silently selecting a
different behavior. The resolved values are retained as effective runtime
configuration and are the values reported by `get_diagnostics`.

## Example

```bash
DEBUG_RECORDER_DB=/tmp/debug-memory.db LOG_LEVEL=warn FUZZY_THRESHOLD=0.4 npx debug-recorder-mcp
```

## HTTP security model

HTTP transport is local-first. The default bind address is `127.0.0.1`, and the
server rejects requests whose `Host` header is not in `DEBUG_RECORDER_ALLOWED_HOSTS`.
When an `Origin` header is present, it must match
`DEBUG_RECORDER_ALLOWED_ORIGINS`.

The `/mcp` endpoint accepts only `POST`. `GET /health` and `GET /version` are
provided for operational checks. Each MCP HTTP request gets its own stateless
`McpServer` and `StreamableHTTPServerTransport`, so transport lifecycle and
session state are not shared across independent clients.

To expose HTTP outside loopback, set all of the following:

```bash
HOST=0.0.0.0
DEBUG_RECORDER_REMOTE_HTTP=true
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token
DEBUG_RECORDER_ALLOWED_HOSTS=debug-recorder.example.com
DEBUG_RECORDER_ALLOWED_ORIGINS=https://debug-recorder.example.com
npm run start:http
```

Remote mode rejects wildcard origins and will not start without token auth.

## Persistence and redaction

By default, the recorder preserves local debug fidelity and stores the text you
provide. Set `DEBUG_RECORDER_REDACT_BEFORE_STORE=true` when command output or
error text may contain credentials. Redaction covers common bearer tokens, API
keys, npm tokens, GitHub-style tokens, Slack-style tokens, `sk-` keys, and long
base64-like values.

Store-time redaction applies to new writes and imports; it does not
retroactively scrub existing rows. See
[Storage retention and maintenance](./storage-retention.md) for the safe
redacted-copy workflow.

## Operational guidance

- Use a dedicated `DEBUG_RECORDER_DB` path for scratch imports or project-isolated histories.
- Back up with `export_sessions` before upgrades, compaction, or bulk imports.
- Run `node scripts/compact-sqlite.mjs --db <path>` after large delete/import cycles while no MCP client is writing.
- Lower `FUZZY_THRESHOLD` for stricter search results; raise it slightly for typo-heavy workflows.
- Set `LOG_LEVEL=warn` in CI and e2e runs to reduce noise from migration logs.
