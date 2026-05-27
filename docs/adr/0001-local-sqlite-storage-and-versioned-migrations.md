# ADR-0001: Local SQLite Storage and Versioned Migrations

## Status

Accepted, 2026-05-26.

## Context

`debug-recorder-mcp` stores personal debugging history: sessions, fix attempts,
terminal commands, tags, and searchable error text. The default user workflow is
local MCP execution through `npx debug-recorder-mcp`, so persistence must work
without a network service, account, or external database.

The schema also needs to evolve without losing existing local histories. The
current implementation uses `better-sqlite3`, stores data at
`~/.debug-recorder-mcp/sessions.db` by default, and supports an override through
`DEBUG_RECORDER_DB`.

## Decision

Use a local SQLite database with versioned migrations in `src/db.ts`.

Operational settings are applied on open:

- `journal_mode = WAL`
- `synchronous = NORMAL`
- `foreign_keys = ON`
- `busy_timeout = 5000`
- `cache_size = -64000`

Schema versioning is tracked through `PRAGMA user_version`. Each migration is an
append-only entry in the `MIGRATIONS` array, and startup applies missing
migrations inside a transaction before runtime use.

## Consequences

- Users get durable local storage with no server provisioning.
- The CLI and MCP server remain portable across local machines and containers.
- Migrations are deterministic and easy to test with `createTestDb()`.
- Native SQLite bindings require Node-compatible install support, so dependency
  health for `better-sqlite3` remains a release concern.
- Write concurrency is intentionally modest; this is a local debugging history,
  not a multi-tenant database.

## Alternatives Considered

- JSON files: simpler, but weaker query, migration, and concurrency behavior.
- External database service: better for central teams, but conflicts with the
  local-first install path and increases operational burden.
- Browser-style embedded stores: not appropriate for Node MCP clients and CLI
  workflows.
- Node built-in SQLite APIs: promising, but not selected while the project still
  targets stable Node 22 and 24 behavior through the existing native dependency.

## Revisit Conditions

- Node's built-in SQLite API becomes stable enough to replace the native addon
  without losing WAL, FTS5, migration, and performance requirements.
- The project adds multi-user hosting, remote sync, or team-shared histories.
- Local write contention or database size causes measurable user-facing
  regressions.

## References

- [SQLite PRAGMA documentation](https://www.sqlite.org/pragma.html)
- [SQLite WAL documentation](https://www.sqlite.org/wal.html)
- [better-sqlite3 package](https://www.npmjs.com/package/better-sqlite3)
