# ADR-0002: Hybrid FTS5 Recall with Fuse.js Reranking

## Status

Accepted, 2026-05-26.

## Context

Search is the core product workflow: answer whether an error, command output, or
fix has been seen before. Debug text often includes exact fragments such as
exception names, stack frames, CLI flags, package names, and paths, but users
also benefit from typo-tolerant matching.

The project previously needed to avoid loading all sessions into memory as the
history grows. The current implementation keeps the search index local and
in-process.

## Decision

Use SQLite FTS5 for recall and filtering, then rerank the smaller candidate set
with Fuse.js.

The normal search path is:

1. Normalize user terms into an FTS5 prefix query.
2. Query `sessions_fts`, applying structured filters such as `status`,
   `language`, and `framework`.
3. Hydrate candidate sessions by ID.
4. Rerank candidates with Fuse.js using weighted fields.

If FTS5 returns no candidates or the query cannot run, fall back to Fuse.js over
a bounded session set. `FUZZY_THRESHOLD` controls reranking strictness and the
fallback fuzzy path.

## Consequences

- Exact technical fragments get fast local recall through FTS5.
- Typo tolerance and softer relevance are still available through Fuse.js.
- Search avoids the old all-history fuzzy scan as the primary path.
- FTS query construction must sanitize punctuation that has special FTS meaning.
- The fallback path remains bounded to protect local runtime behavior.

## Alternatives Considered

- Fuse.js only: simpler, but memory and latency scale poorly as histories grow.
- FTS5 only: fast for exact recall, but weaker for typo-heavy queries.
- External vector search: attractive for semantic recall, but adds services,
  privacy concerns, model drift, and operational cost.
- SQLite trigram/tokenizer extensions: could improve fuzzy recall, but increases
  SQLite extension complexity and install variance.

## Revisit Conditions

- Search quality measurements show repeated misses that FTS5 plus Fuse.js cannot
  address.
- The local database grows beyond the current candidate limits and search
  latency regresses.
- The project adds an explicit opt-in semantic index with privacy, storage, and
  migration behavior documented.

## References

- [SQLite FTS5 documentation](https://www.sqlite.org/fts5.html)
- [Fuse.js documentation](https://www.fusejs.io/)
