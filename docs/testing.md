# Testing

## Local gate

Run the full local gate before opening or updating a release pull request:

```bash
npm ci
npm run format:check
npm run lint
npm run check:dead-code
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
size checks, version synchronization, MCP metadata validation, workflow
linting, workflow security scanning, secret scanning, Trivy, CodeQL, and
scheduled OpenSSF Scorecard.
