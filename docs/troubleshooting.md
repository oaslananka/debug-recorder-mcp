# Troubleshooting

Use `get_diagnostics` first when an agent or operator needs a safe snapshot of
runtime state. The diagnostics payload intentionally avoids raw database paths,
HTTP tokens, allowed host values, command output, stack traces, and environment
values. It reports booleans, versions, counters, and aggregate stats instead.

## Startup issues

1. Confirm the Node version is supported by the package and native dependencies.
2. Run the stdio server directly:

```bash
npx debug-recorder-mcp
```

3. If `better-sqlite3` native bindings fail, rebuild native dependencies for the
   current Node version:

```bash
npm rebuild better-sqlite3
```

4. Run `get_diagnostics` after startup to confirm package version, schema
   version, runtime platform, redaction mode, and aggregate history stats.

## Database issues

1. Confirm `DEBUG_RECORDER_DB` points to the intended SQLite file.
2. Back up with `export_sessions` before manual inspection, compaction, or bulk
   imports.
3. Validate imports in a scratch database before replacing a real history.
4. Use `node scripts/compact-sqlite.mjs --db <path> --dry-run` to estimate free
   pages after large delete/import cycles.
5. See [Storage retention and maintenance](./storage-retention.md) for backup,
   redaction, compaction, and rollback policy.

## MCP client issues

1. Check that the client launches the package with stdio, not HTTP, unless the
   client explicitly supports Streamable HTTP.
2. Confirm tool discovery includes `start_debug_session`, `search_sessions`,
   `get_stats`, and `get_diagnostics`.
3. If a tool call fails, retry with a minimal input and inspect the structured
   JSON-RPC error.
4. Use `get_diagnostics` to confirm counters and aggregate stats without exposing
   sensitive local content.

## HTTP auth and transport issues

1. Start local HTTP with `npm run start:http` for development.
2. Check `GET /health` and `GET /version` with an allowed `Host` header.
3. For non-loopback HTTP, set all required controls:
   - `DEBUG_RECORDER_REMOTE_HTTP=true`
   - `DEBUG_RECORDER_HTTP_TOKEN=<long random token>`
   - `DEBUG_RECORDER_ALLOWED_HOSTS=<expected host>`
   - `DEBUG_RECORDER_ALLOWED_ORIGINS=<expected origin>`
4. Rejections are counted by reason in diagnostics, including forbidden host,
   forbidden origin, unauthorized, unsupported media type, parse error, body too
   large, and method not allowed.

## Search issues

1. Start with a broad `search_sessions` query and then add filters for language,
   framework, or status.
2. Use pagination metadata: `has_more` and `next_offset` show whether more
   results are available.
3. Use `include_related` to see clusters by tag, error type, language, or
   framework.
4. Lower `FUZZY_THRESHOLD` for stricter matching or raise it for typo-heavy
   workflows.
5. Save known investigations with `save_search_preset` and reuse them with
   `list_search_presets`.

## Redaction expectations

Diagnostics applies the same token redaction used by structured logging and also
removes representative local file paths. It is safe to include diagnostics output
in issues when the surrounding issue text does not include raw secrets.
