# Contributing to mcp-debug-recorder

## Development Setup

```bash
node --version
npm ci
npm run format:check
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
node scripts/check-version-sync.mjs
node scripts/validate-mcp-metadata.mjs
```

Supported local development targets are Node 20 and Node 24.

## Adding a New Tool

1. Add the Zod schema and TypeScript types in `src/types.ts`.
2. Add any DB-facing behavior to `src/store.ts`.
3. Register the tool in `src/mcp.ts`.
4. Add or update unit coverage in `test/unit`.

## Database Migrations

To change the schema:

1. Append a new migration to `MIGRATIONS` in `src/db.ts`.
2. Never edit old migrations after release.
3. Add migration coverage in `test/unit/migrations.test.ts`.

## Quality Gates

Run these before opening a PR:

```bash
npm run lint
npm run format:check
npm run test:coverage
npm run build
npm audit --audit-level=moderate
npm pack --dry-run
node scripts/check-version-sync.mjs
node scripts/validate-mcp-metadata.mjs
```

For Docker changes, also run:

```bash
docker build -t mcp-debug-recorder:local .
```

## Commit Style

Use Conventional Commits such as:

- `feat:`
- `fix:`
- `docs:`
- `test:`
- `chore:`
