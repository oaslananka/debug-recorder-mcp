# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `delete_session` tool for permanent deletion with explicit confirmation.
- `update_session` tool for editing titles, descriptions, and tags.
- `export_sessions` and `import_sessions` tools for backup and migration.
- `get_session_context` tool for AI-friendly session summaries.
- Versioned SQLite migrations via `PRAGMA user_version`.
- FTS5 full-text search with Fuse.js reranking.
- `Store` class with dependency injection and import/export support.
- Graceful shutdown handling for stdio and HTTP entrypoints.
- Coverage thresholds and expanded unit coverage for DB, store, search, MCP, and logging.
- `SECURITY.md`, `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md`.

### Changed
- `src/db.ts` now exposes `openDb(path?)` and `createTestDb()` instead of a global singleton connection.
- `src/store.ts` now uses a repository-style `Store` class.
- `src/search.ts` now searches the full dataset instead of the previous 500-row in-memory cap.
- `package.json` now includes publish metadata, `exports`, `prepublishOnly`, `format:check`, and `test:coverage`.
- Azure DevOps CI is consolidated into the root `azure-pipelines.yml` file.
- GitHub Actions CI remains manual fallback only.

### Fixed
- Node 24 compatibility for `better-sqlite3`.
- Bearer token redaction in structured logs.
- Session status now has a DB-level `CHECK` constraint.

## [1.0.0] - 2026-04-06

### Added
- Initial implementation.
- SQLite storage with `better-sqlite3`.
- Fuzzy session search with `fuse.js`.
- MCP tools for starting sessions, recording fixes, recording commands, searching history, and reporting stats.
- Streamable HTTP transport.
