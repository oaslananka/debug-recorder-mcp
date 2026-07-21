# Search Algorithm

`debug-recorder-mcp` uses a hybrid approach so search remains useful as the session history grows.

## Step 1: FTS5 recall

- Session text fields are indexed in the `sessions_fts` virtual table.
- Search terms are normalized and converted into prefix queries.
- SQLite applies filters such as `status`, `language`, and `framework` before ranking.

## Step 2: Fuse.js reranking

- The FTS candidate set is hydrated back into full sessions.
- Fuse.js reranks only that smaller candidate set, which keeps fuzzy matching useful without loading the whole database.
- `FUZZY_THRESHOLD` controls this reranking strictness and the fallback fuzzy path.

## Fallback behavior

- If the FTS query cannot run or returns no candidates, the code falls back to Fuse.js over a bounded session set.
- This preserves compatibility for older or incomplete local databases while keeping normal operation fast.

## Why this split works

- FTS5 is better at large-scale recall and exact technical fragments.
- Fuse.js is better at typo tolerance and softer relevance scoring.
- Together they remove the old 500-session ceiling while still returning readable results.
