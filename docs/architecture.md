# Architecture

`debug-recorder-mcp` keeps runtime responsibilities intentionally narrow:

- MCP transports accept tool calls.
- Tool handlers translate those calls into store operations.
- `Store` owns SQLite persistence and import/export rules.
- `search.ts` combines SQLite FTS5 recall with Fuse.js reranking.

```mermaid
flowchart TD
  Client["MCP client"] --> Transport["stdio or Streamable HTTP transport"]
  Transport --> Server["src/mcp.ts wiring + tool registration"]
  Server --> Tools["src/tools/* handlers"]
  Tools --> Store["Store"]
  Store --> DB["SQLite sessions.db"]
  DB --> FTS["FTS5 index + triggers"]
  Tools --> Search["search.ts"]
  Search --> FTS
  Search --> Store
```

## Module map

- `src/mcp.ts`: runtime creation, shutdown handling, tool registration.
- `src/tools/session-tools.ts`: session lifecycle and context handlers.
- `src/tools/recording-tools.ts`: fix and command recording handlers.
- `src/tools/search-tools.ts`: search and similar-error handlers.
- `src/tools/admin-tools.ts`: stats, export, and import handlers.
- `src/store.ts`: repository-style DB access layer.
- `src/db.ts`: connection opening, pragmas, and schema migrations.

## Runtime notes

- File-backed databases use `WAL`, `synchronous = NORMAL`, `foreign_keys = ON`, and a 64 MB negative cache size hint.
- Search stays local and in-process; no external services are required.
- Import/export stays JSON-compatible with the existing MCP tools.
