# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

Do not open a public GitHub issue for a security problem.

Use GitHub Security Advisories from the repository Security tab and choose **Report a vulnerability**.

### Response targets

- Acknowledgement: 48 hours
- Initial assessment: 5 business days
- Critical fix target: 30 days

## Scope

Examples of issues that are in scope:

- SQL injection or unsafe query handling
- Path traversal via `DEBUG_RECORDER_DB`
- Sensitive data exposure in logs
- HTTP DNS rebinding, origin validation, request-size, or token-auth bypasses
- FTS5 query handling flaws

## Data Privacy

All session data is stored locally at `~/.debug-recorder-mcp/sessions.db` unless you override `DEBUG_RECORDER_DB`.

The package does not send debug history to external services. Streamable HTTP
mode binds to `127.0.0.1` by default, validates `Host`, validates `Origin` when
present, and requires explicit token-protected remote enablement before it will
bind to non-loopback hosts.

Set `DEBUG_RECORDER_REDACT_BEFORE_STORE=true` if you want common credential
patterns redacted before debug text is persisted. The default remains `false` so
local users can preserve exact debugging context when they control the database.


## Dependency Findings, SBOM, and VEX

Dependency and scanner findings are handled by the repository SBOM/VEX policy in [`docs/security-sbom-vex.md`](docs/security-sbom-vex.md). The default baseline is zero `npm audit --audit-level=moderate` findings, no unreviewed npm install scripts, and release assets that include SBOM, checksums, and provenance attestations.

## Release and Secret Handling

Pull request validation never publishes packages, registry metadata, containers,
or production releases. The release workflow is driven by release-please manifest
mode after merges to `main`; npm publish is gated by the `npm-publish`
environment and is intended for trusted publishing/OIDC. Long-lived npm tokens
should only be used as a documented fallback and must never be printed in logs.
