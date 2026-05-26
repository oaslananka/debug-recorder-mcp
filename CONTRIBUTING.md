# Contributing to debug-recorder-mcp

## Development Setup

```bash
node --version
npm ci
npm run format:check
npm run lint
npm run check:dead-code
npm run test:coverage
npm run test:fuzz
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm run check:package-size
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
npm run check:dead-code
npm run test:coverage
npm run test:fuzz
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm pack --dry-run
npm run check:package-size
node scripts/check-version-sync.mjs
node scripts/validate-mcp-metadata.mjs
```

`npm run check:dead-code` must complete without unused files, exports,
dependencies, or binaries. `npm run check:package-size` must report
`Package artifact OK` for the npm tarball and fails if required package files
are missing, source/test/generated files leak into the package, or the packed
artifact exceeds the project budget.

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

## Issue Triage

Use GitHub Issues as the source of truth for planned work. New issues should use
one of the repository issue forms unless the maintainer creates a narrowly scoped
tracking issue directly.

Every actionable issue should have:

- one `priority:*` label
- at least one `area:*` label
- one `type:*` label
- one `risk:*` label
- `agent:blocked` only when external credentials, permissions, or decisions are
  the next required action

Priority labels:

| Label         | Meaning                                             | Response target |
| ------------- | --------------------------------------------------- | --------------- |
| `priority:P0` | Security, release, install, CI, or artifact blocker | 1 business day  |
| `priority:P1` | Major compatibility, product, or governance gap     | 2 business days |
| `priority:P2` | Quality, testing, DX, or maintainability gap        | 5 business days |
| `priority:P3` | Polish, demo, community, or roadmap item            | Best effort     |

Area labels:

`area:ci`, `area:release`, `area:security`, `area:compatibility`,
`area:docs`, `area:testing`, `area:packaging`, `area:dx`, `area:infra`, and
`area:governance`.

Type labels:

`type:bug`, `type:enhancement`, `type:task`, `type:docs`, and `type:security`.

Risk labels:

`risk:high`, `risk:medium`, and `risk:low`.

Triage flow:

1. Confirm the report belongs in this repository and does not expose secrets.
2. Link or close duplicates instead of creating parallel work.
3. Normalize the title to `[AREA] Action-oriented summary`.
4. Apply priority, area, type, and risk labels.
5. Assign an owner when the next action is clear.
6. Add `status:in-progress` only while active work is underway.
7. Close with validation evidence or leave a concrete blocker with
   `agent:blocked`.

No stale automation is currently enabled. If stale automation is added later, it
must never auto-close `priority:P0`, `area:security`, `area:release`, or
`agent:blocked` issues.

For support expectations and private vulnerability reporting, see
[`SUPPORT.md`](./SUPPORT.md) and [`SECURITY.md`](./SECURITY.md).

## Commit Style

Use Conventional Commits such as:

- `feat:`
- `fix:`
- `docs:`
- `test:`
- `chore:`
