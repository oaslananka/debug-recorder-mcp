# Testing

## Local gate

Run the full local gate before opening or updating a release pull request:

```bash
npm ci
npm run format:check
npm run lint
npm run check:dead-code
npm run check:codecov
npm run test:coverage
npm run test:fuzz
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm run check:install-scripts
npm pack --dry-run
npm run check:package-size
node scripts/check-version-sync.mjs
node scripts/validate-mcp-metadata.mjs
npm run check:security-policy
```

Run the e2e stdio flow after building:

```bash
npm run build
npm run test:e2e
```

Run deterministic property-based regression tests for import payloads, search
normalization, HTTP allowlist validation, and redaction:

```bash
npm run test:fuzz
```

Run the package hygiene checks whenever exports, scripts, package metadata, or
the `files` allowlist changes:

```bash
npm run check:dead-code
npm run check:package-size
```

Run the Docker gate when the Dockerfile or HTTP runtime changes:

```bash
docker build -t debug-recorder-mcp:local .
```

## Coverage focus

The unit suite covers:

- database migrations and store behavior
- missing-session domain errors
- import/export boundaries
- search behavior
- tool handler validation
- secret redaction
- HTTP host, origin, auth, body limit, malformed JSON, and transport isolation
- property-based fuzz regressions for import/export boundaries, search query
  normalization, HTTP allowlists, and redaction

CI enforces coverage thresholds, e2e flow coverage, deterministic fuzz
regression tests, dead-code checks, dependency audit, install-script approval checks, package dry run, package
size checks, version synchronization, MCP metadata validation, SBOM/VEX policy invariant checks, workflow
linting, workflow security scanning, secret scanning, Trivy, CodeQL, and
scheduled OpenSSF Scorecard.

## Codecov coverage and test analytics

The Node 24 quality job uploads the canonical Cobertura report to Codecov. Both
Node 22 and Node 24 jobs upload their JUnit XML results with runtime-specific
flags so failed and flaky tests can be compared across supported runtimes.
The pinned Codecov action installs exact `codecov-cli==11.3.1` packages through
its PyPI path; this avoids the action's external Keybase public-key fetch while
keeping the action SHA, CLI version, token boundary, and upload failures strict.
Upload steps run with `!cancelled()` so reports generated before a test failure
are still sent, while fork pull requests are kept secret-free and skip uploads.

`codecov.yml` keeps project and patch statuses informational during baseline
establishment. Jest remains the blocking local coverage gate. Promote Codecov
statuses to blocking only after the default branch has a stable baseline and the
Codecov GitHub App is active for the repository.

JavaScript Bundle Analysis is intentionally not enabled. This repository ships
a TypeScript-compiled Node CLI/server package and has no Rollup, Vite, or
Webpack browser bundle. The npm packed/unpacked artifact budget is the relevant
size regression gate and is enforced by `npm run check:package-size`.

Validate policy locally and against Codecov's official validator with:

```bash
npm run check:codecov
npm run check:codecov -- --remote
```
