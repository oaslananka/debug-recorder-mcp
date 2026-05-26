# Contributing to debug-recorder-mcp

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

Supported local development targets are Node 22 LTS and Node 24 LTS.

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
docker build -t debug-recorder-mcp:local .
```

## Protected Main Branch

All changes to `main` must go through a pull request. The branch protection
rule requires the pull request branch to be up to date, code owner approval,
resolved conversations, and these passing checks:

- `Quality / Node 22.22.3`
- `Quality / Node 24.16.0`
- `Docker Build, Smoke, and Scan`
- `Workflow Lint and Security`
- `Gitleaks Secret Scan`
- `Trivy Filesystem Scan`
- `CodeQL / JavaScript-TypeScript`
- `CodeQL`

Force pushes and branch deletion are disabled for `main`.
Repository administrators retain emergency bypass because this is currently a
single-maintainer repository.

## Commit Style

Use Conventional Commits such as:

- `feat:`
- `fix:`
- `docs:`
- `test:`
- `chore:`
