# Usage

`debug-recorder-mcp` stores debug sessions in a local SQLite database and exposes them through MCP tools over stdio or Streamable HTTP.

## Client setup recipes

Use [Client Setup Recipes](./client-recipes.md) for copy-paste stdio configuration, Streamable HTTP examples, safe sample debug sessions, and troubleshooting guidance.

## Core workflow

1. Start a session with `start_debug_session`
2. Record commands with `record_command`
3. Log failed and successful attempts with `add_fix`
4. Search history with `search_sessions` or `find_similar_errors`
5. Finish with `close_session`

## Workflow: resuming a session

When you come back to an old issue, use this sequence:

1. Call `search_sessions` or `find_similar_errors`
2. Pick the most relevant `session_id`
3. Call `get_session_context`

`get_session_context` returns a compact AI-friendly summary that includes:

- the original problem statement
- environment, language, and framework
- failed fixes
- the working fix if one exists
- the last commands recorded for the session

This is the fastest way to rehydrate context into an assistant conversation.

## Search workflows

`search_sessions` supports pagination and incident-oriented output:

```json
{
  "query": "postgres ECONNREFUSED",
  "language": "typescript",
  "status": "resolved",
  "limit": 10,
  "offset": 0,
  "include_related": true,
  "markdown": true
}
```

The response includes:

- `pagination`: `limit`, `offset`, `returned`, `has_more`, and `next_offset`
- `related_groups`: result-page clusters by tag, error type, language, or framework
- `markdown`: optional Markdown export for incident notes or postmortems

Saved presets help agents reuse known investigation patterns:

```json
{
  "name": "node-postgres-crashes",
  "query": "postgres ECONNREFUSED",
  "language": "typescript",
  "framework": "node",
  "status": "resolved",
  "limit": 10
}
```

Use `save_search_preset` to create or update a preset, `list_search_presets` to inspect stored presets, and `remove_search_preset` to remove one by name.

## Updating and deleting sessions

- Use `update_session` when the title, notes, or tags need cleanup after the incident becomes clearer.
- Use `delete_session` only for permanent removal. The tool requires `confirm: true`.

## Backup and migration

### Exporting

Every successful export includes these common fields:

| Field            | Meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `format`         | Literal discriminator: `"json"` or `"summary"`.                                        |
| `exported_at`    | ISO-8601 timestamp for when the response was created.                                  |
| `format_version` | Public backup contract version. Current exports use `2`.                               |
| `schema_version` | Informational SQLite storage schema version; it does not control backup compatibility. |
| `sessions`       | Session rows whose shape depends on `format`.                                          |

Use `export_sessions` with `format: "json"` for a full backup. The response
contains:

- `format: "json"`
- `format_version: 2`
- complete storage rows in `sessions`
- all `fixes`
- all `commands`
- all `saved_search_presets`

Full JSON session rows preserve numeric `created_at`, `updated_at`, and nullable
`closed_at` timestamps together with all nullable debug fields. `closed_at` is set
once when a session first becomes `resolved` or `abandoned`; later metadata updates
or repeated close calls do not move it. There is no reopen operation.

Use `format: "summary"` for a lightweight inventory. The response contains:

- `format: "summary"`
- aggregate `stats`
- abbreviated session rows with `id`, `title`, `status`, `language`,
  `error_type`, and ISO-8601 `created_at`

Summary exports intentionally omit fixes, commands, stack traces, descriptions,
and other backup-only fields. They cannot be restored with `import_sessions`.

### Importing

Pass the complete object returned by `export_sessions` with `format: "json"`
as `import_sessions.payload`. Input validation accepts the documented backup
fields and safely ignores the output-only `format` discriminator before import.

Default import behavior:

- existing session, fix, and command IDs are skipped
- existing preset names are skipped
- orphan child rows are reported as invalid
- legacy v1.1.x payloads without `format_version` are treated as backup format `1`
- future `format_version` values are rejected with `IMPORT_INCOMPATIBLE`
- `schema_version` is retained for diagnostics but does not determine compatibility

Current format `2` backups must include `saved_search_presets`. When
`skip_existing` is `false`, conflicting preset names are deterministically
replaced by the incoming preset, including its filters and timestamps. Session,
fix, and command ID conflicts remain invalid in that mode rather than being
silently overwritten.

Older backups may omit `closed_at`. During import, open sessions receive `null`
and resolved or abandoned sessions derive their completion timestamp from the
legacy `updated_at` value.

`get_session_context.duration_ms` is measured in milliseconds. It grows against
the current time while a session is open and becomes stable against `closed_at`
after completion.

When pre-store redaction is enabled, imported session text, fixes, commands, and
preset queries are redacted before persistence. Export does not perform a second
redaction pass, so backup files must be protected with the same care as the
SQLite database.

## Scaling

Search uses a hybrid model:

- SQLite FTS5 for recall across the full session history
- Fuse.js for reranking a much smaller candidate set

This removes the old 500-session ceiling and keeps results useful as the history grows.

FTS5 becomes especially valuable when:

- the local session history reaches hundreds of entries
- you search by fragments of stack traces or error messages
- you need filter combinations such as `status + framework + language`

## Custom database paths

To keep multiple isolated histories, point the process at a custom path:

```bash
DEBUG_RECORDER_DB=/path/to/custom.db npx debug-recorder-mcp
```

This is useful for:

- separating work and personal debugging history
- testing imports against a scratch database
- keeping project-specific memory stores

## HTTP transport

Start the HTTP server with:

```bash
npm run start:http
```

Useful routes:

- `GET /health`
- `GET /version`
- `POST /mcp`
- `GET /mcp`
- `DELETE /mcp`

## Runtime knobs

- `LOG_LEVEL=warn` is useful for CI and automated smoke tests.
- `FUZZY_THRESHOLD=0.4` makes search stricter; `0.6` allows more typo tolerance.

See also:

- [Configuration](./configuration.md)
- [Architecture](./architecture.md)
- [Search Algorithm](./search-algorithm.md)
- [Roadmap](../ROADMAP.md)

## Development verification

Typical contributor loop:

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
npm run docs:api
```

## Tool execution error contract

Recoverable domain failures are returned as normal MCP tool results with
`isError: true`; the client connection remains usable for a corrected retry.
Both the text content and `structuredContent` carry the same stable error object:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found: missing-session. Check the session_id and retry.",
    "retryable": true
  }
}
```

| Code                    | Meaning                                                            | Typical recovery                                                 |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `SESSION_NOT_FOUND`     | The requested session ID does not exist.                           | List/search sessions, correct `session_id`, and retry.           |
| `PRESET_NOT_FOUND`      | The named saved-search preset does not exist.                      | List presets, correct the name, and retry.                       |
| `CONFIRMATION_REQUIRED` | A destructive operation was called without explicit confirmation.  | Repeat the call with `confirm: true` after reviewing the target. |
| `IMPORT_INCOMPATIBLE`   | The export schema version is not supported by this server version. | Export with a compatible version before retrying.                |
| `IMPORT_INVALID`        | The import payload is malformed or incomplete.                     | Use JSON produced by `export_sessions` and retry.                |

Unexpected database, protocol, transport, or server defects are not converted to
domain errors; they remain exceptions so operators can distinguish a server
failure from correctable tool input.

`remove_search_preset` and `delete_session` are advertised as destructive tools.
Clients should surface an appropriate confirmation affordance before invoking
them.
