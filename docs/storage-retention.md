# Storage retention and maintenance

Debug Recorder MCP is local-first. The SQLite database can contain command
output, stack traces, environment snippets, fix notes, and other operational
context. Treat the database and JSON exports as sensitive debugging records.

## Retention expectations

The server does not delete records automatically. Keep retention explicit and
project-specific:

- Use a dedicated `DEBUG_RECORDER_DB` for each project, customer, or scratch
  investigation when histories should not mix.
- Delete sessions with `delete_session` when the record is no longer needed or
  contains data that should not remain in the local history.
- Keep short-lived scratch histories only as long as needed for the active
  incident or reproduction cycle.
- Keep project histories only while they provide debugging value, then export a
  redacted backup or delete the database.
- Store JSON backups in the same trust boundary as the original database,
  preferably encrypted or in a restricted local backup location.
- Backup format `2` includes saved search presets as well as sessions, fixes,
  and commands. Legacy v1.1.x backups remain importable as format `1`.
- Treat `format_version` as the compatibility boundary. `schema_version` is
  informational and may change independently as SQLite migrations are added.

## Backup and restore

Before upgrades, large imports, manual database inspection, or compaction:

1. Stop active MCP clients that are writing to the database.
2. Run `export_sessions` with `format: "json"` and save the result outside the
   working tree.
3. Optionally copy the SQLite file from `DEBUG_RECORDER_DB` or the default
   `~/.debug-recorder-mcp/sessions.db` path.
4. Validate restores in a scratch database first:

```bash
DEBUG_RECORDER_DB=/tmp/debug-recorder-restore-test.db npx debug-recorder-mcp
```

Use `import_sessions` only with payloads produced by `export_sessions`. Imports
validate schema version, parent-child relationships, duplicate IDs, and batch
limits before writing rows.

## Redaction policy

`DEBUG_RECORDER_REDACT_BEFORE_STORE=true` redacts common credential patterns
before new text is written to SQLite. It applies to:

- newly created sessions
- session updates and close summaries
- fixes
- recorded commands and command output
- imported sessions, fixes, and commands

It does **not** retroactively scrub rows that already exist in the database.
When existing data may contain secrets:

1. Enable `DEBUG_RECORDER_REDACT_BEFORE_STORE=true`.
2. Export the current database with `export_sessions`.
3. Import the export into a scratch database while redaction is enabled.
4. Review the scratch export for expected redaction.
5. Replace or delete the original database only after the redacted copy is
   verified.

Deleting a session removes its child fixes and commands through SQLite foreign
key cascade rules. Exports after deletion should not contain the deleted session
or its child rows.

## Compaction and VACUUM

SQLite can keep free pages after large deletions or imports. Use the maintenance
script when the database has changed significantly and no MCP process is writing
to it:

```bash
node scripts/compact-sqlite.mjs --db ~/.debug-recorder-mcp/sessions.db
```

For a non-mutating estimate first:

```bash
node scripts/compact-sqlite.mjs --db ~/.debug-recorder-mcp/sessions.db --dry-run
```

The script runs:

1. `PRAGMA optimize`
2. `PRAGMA wal_checkpoint(TRUNCATE)`
3. `VACUUM`, unless `--dry-run` is set

Run compaction only after taking a backup. `VACUUM` rewrites the database file
and should not run concurrently with active writers.

## Migration rollback guidance

Schema migrations are forward-only. There is no automatic downgrade path.
Rollback means restoring data, not reversing SQL in place:

1. Stop MCP clients.
2. Restore a pre-upgrade SQLite copy, or create a fresh database and import the
   pre-upgrade JSON export.
3. Restart the older application version against the restored database.
4. If a migration has already run, do not point an older binary at that migrated
   database unless it explicitly supports the schema version.

## Operational checklist

- Back up before upgrades, compaction, and bulk imports.
- Enable store-time redaction before importing untrusted or secret-bearing
  exports.
- Delete sensitive sessions before creating long-lived backups.
- Run compaction after large delete/import cycles.
- Keep database files and exports out of Git.
