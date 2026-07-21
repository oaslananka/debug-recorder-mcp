# Security

## Local-first transports

Stdio is the primary transport for local MCP clients. It avoids opening a network
listener and is the recommended production/local integration path.

Streamable HTTP is available for local tooling and controlled deployments. It
binds to `127.0.0.1` by default, accepts only `POST /mcp` for MCP messages, and
creates a fresh stateless MCP server and HTTP transport for every request.

## HTTP controls

The HTTP entrypoint enforces:

- loopback default bind
- explicit `DEBUG_RECORDER_REMOTE_HTTP=true` before non-loopback bind
- bearer token requirement for non-loopback bind
- `Host` allowlist validation
- `Origin` allowlist validation when an `Origin` header is present
- fixed JSON request body limit
- deterministic JSON-RPC errors for malformed or oversized request bodies

Remote HTTP requires:

```bash
HOST=0.0.0.0
DEBUG_RECORDER_REMOTE_HTTP=true
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token
DEBUG_RECORDER_ALLOWED_HOSTS=debug-recorder.example.com
DEBUG_RECORDER_ALLOWED_ORIGINS=https://debug-recorder.example.com
```

Wildcard origins are rejected for remote mode.

## Secrets

Logs are written to stderr so stdout remains safe for the stdio MCP protocol.
Structured log metadata is redacted for common token shapes and key names.

Persistence redaction is optional because exact local debugging text can be
valuable. Set `DEBUG_RECORDER_REDACT_BEFORE_STORE=true` to redact common
credential patterns before storing session, fix, and command text. This protects
new writes and imports only; use the documented redacted-copy workflow for
existing databases.

Database files and JSON exports should be treated as sensitive local artifacts.
See [Storage retention and maintenance](./storage-retention.md) for retention,
backup, compaction, and migration rollback guidance.

Never commit tokens, package credentials, registry credentials, private keys, or
local transcript/scratch files. Pull request validation includes Gitleaks.

## Dependency and code scanning

The repository assigns one primary owner per security category and keeps other
services as specialist or advisory signals. CodeQL owns blocking SAST, Trivy
owns container/filesystem scanning, Codecov owns coverage and test analytics,
and GitHub secret scanning/push protection owns secret prevention.

- Renovate is operated by a repository-owned scheduled workflow and uses the
  `renovate-managed/` branch prefix.
- Semgrep uses committed high-signal rules locally and authenticated AppSec
  analysis for trusted GitHub events. Fork pull requests receive no secrets.
- Snyk scans npm production and development dependencies with the existing
  `SYNK_PAT_TOKEN` repository secret mapped to `SNYK_TOKEN` at runtime.
- SonarQube Cloud automatic analysis remains the single Sonar analysis method;
  it tracks maintainability and technical debt without becoming a duplicate
  coverage or SAST gate.
- Snyk and Socket provide additional dependency/AppSec visibility without
  replacing the required CodeQL, dependency-review, or Trivy controls.

Installation, hook stages, pinned versions, manual commands, secret boundaries,
and troubleshooting are documented in
[Dependency and security tooling](./security-tooling.md). The July 2026 historical finding cleanup is recorded in [SonarQube Cloud remediation](./sonar-remediation.md).

## Architecture decisions

- [ADR-0003: Local-First Streamable HTTP Security Model](./adr/0003-local-first-streamable-http-security.md)
- [ADR-0004: Release, Provenance, and Publish Flow](./adr/0004-release-provenance-and-publish-flow.md)
