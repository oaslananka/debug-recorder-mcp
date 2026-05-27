# Release Flow

This repository uses GitHub Actions and release-please manifest mode for normal
package releases.

## Release inputs

- `release-please-config.json`
- `.release-please-manifest.json`
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`
- `mcp.json`
- `server.json`

Manual version inputs are not part of the release workflow. The release version,
tag, major, minor, and patch values are read only from release-please outputs.

## Pull request validation

Pull requests run validation only:

- format check
- typecheck and lint
- dead-code check
- coverage tests
- deterministic fuzz regression tests
- build
- e2e tests
- dependency audit
- package dry run
- package size check
- version synchronization
- MCP metadata validation
- Docker build, smoke, and scan
- workflow lint and workflow security scan
- secret scan
- filesystem vulnerability scan
- CodeQL

Pull request validation does not publish npm packages, MCP Registry metadata,
containers, marketplace assets, or production GitHub Releases.

## Main branch release automation

When commits land on `main`, release-please runs first. If no release is due,
asset and publish jobs are skipped. If release-please creates a release, the
release workflow:

1. installs with `npm ci`
2. runs the local release gate
3. creates the npm package tarball with `npm pack`
4. generates a CycloneDX SBOM with `npm sbom`
5. writes SHA256 checksums
6. creates a GitHub artifact attestation for the package tarball
7. attaches the tarball, SBOM, and checksums to the GitHub Release
8. waits for the `npm-publish` environment before publishing to npm
9. verifies the published npm version

The npm publish step uses provenance and is intended for npm trusted publishing
through GitHub OIDC. A long-lived `NPM_TOKEN` is only a fallback when trusted
publishing is not available.

The repository Actions setting must keep default `GITHUB_TOKEN` permissions at
read-only while enabling "Allow GitHub Actions to create and approve pull
requests". Release Please still receives only the job-level permissions in
`.github/workflows/release.yml`, but GitHub blocks release PR creation unless
that repository setting is enabled.

## MCP Registry

The registry identity remains:

```text
io.github.oaslananka/debug-recorder-mcp
```

Before an MCP Registry update:

- `server.json.name` must match `package.json.mcpName`
- `server.json.packages[].identifier` must remain `debug-recorder-mcp`
- `server.json.version` must match `package.json.version` for package releases
- `server.json.packages[].version` must exist on npm
- `node scripts/check-version-sync.mjs` must pass
- `node scripts/validate-mcp-metadata.mjs` must pass

Registry publishing is intentionally separate from npm publishing and should be
gated after npm publish verification succeeds.

## Architecture decisions

- [ADR-0004: Release, Provenance, and Publish Flow](./adr/0004-release-provenance-and-publish-flow.md)
- [ADR-0005: MCP Registry Identity and Version Metadata](./adr/0005-mcp-registry-versioning-and-metadata.md)
