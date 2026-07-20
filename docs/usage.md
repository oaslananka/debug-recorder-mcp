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

| Field | Meaning |
| --- | --- |
| `format` | Literal discriminator: `"json"` or `"summary"`. |
| `exported_at` | ISO-8601 timestamp for when the response was created. |
| `schema_version` | Current storage schema version. |
| `sessions` | Session rows whose shape depends on `format`. |

Use `export_sessions` with `format: "json"` for a full backup. The response
contains:

- `format: "json"`
- complete storage rows in `sessions`
- all `fixes`
- all `commands`

Full JSON session rows preserve numeric `created_at` and `updated_at` timestamps
and all nullable debug fields.

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

- existing IDs are skipped
- orphan child rows are reported as invalid
- unsupported `schema_version` values are rejected

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
