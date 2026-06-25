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
10. verifies MCP Registry readiness against the published npm version
11. uploads `server.json` as the registry descriptor artifact

The npm publish step uses provenance and is intended for npm trusted publishing
through GitHub OIDC. A long-lived `NPM_TOKEN` is only a fallback when trusted
publishing is not available.

### npm trusted publishing blocker

`debug-recorder-mcp` must exist on npm with this GitHub repository configured as
an allowed trusted publisher, or the release workflow's `npm-publish` job must
run with a token that can create or update that package. If npm returns `E404`
from `PUT https://registry.npmjs.org/debug-recorder-mcp` during
`npm publish --provenance`, treat it as an npm package ownership/trusted
publisher configuration blocker, not a build failure.

To recover:

1. configure npm trusted publishing for package `debug-recorder-mcp` and GitHub
   repository `oaslananka/debug-recorder-mcp`, or provide a scoped/owned package
   name and update `package.json`, `mcp.json`, `server.json`, and docs
2. rerun the `Release` workflow from `main`
3. verify `npm view debug-recorder-mcp@<version> version`
4. only then continue with MCP Registry submission

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

Registry publishing is intentionally separate from npm publishing and remains a
manual maintainer submission until the registry provides a stable authenticated
submission mechanism for this project. The automated release workflow now runs a
post-npm `MCP Registry Readiness` gate before maintainers submit registry
metadata.

Release checklist for npm plus MCP Registry:

1. Release Please creates the GitHub Release and versioned metadata.
2. Release assets are built, attested, checksummed, and attached.
3. The `npm-publish` environment is approved.
4. The tarball is published to npm with provenance.
5. `npm view debug-recorder-mcp@<version> version` returns the release version.
6. `npm run check:version` passes.
7. `npm run check:mcp` passes.
8. `npm run check:mcp-registry:published` passes.
9. The `mcp-registry-descriptor` workflow artifact contains the exact `server.json`
   used for manual registry submission.
10. A maintainer submits or updates the registry entry for
    `io.github.oaslananka/debug-recorder-mcp`.

If npm publication succeeds but MCP Registry readiness fails, the release is in a
partial success state: npm is live, but registry metadata must not be submitted
until the failure is fixed. The workflow creates a follow-up issue labeled for
release, MCP, packaging, and triage so the published-but-not-registry-ready state
is visible.

## Architecture decisions

- [ADR-0004: Release, Provenance, and Publish Flow](./adr/0004-release-provenance-and-publish-flow.md)
- [ADR-0005: MCP Registry Identity and Version Metadata](./adr/0005-mcp-registry-versioning-and-metadata.md)
