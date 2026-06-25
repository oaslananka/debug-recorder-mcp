# ADR-0004: Release, Provenance, and Publish Flow

## Status

Accepted, 2026-05-26.

## Context

The package is distributed through npm and advertised through repository and MCP
metadata. Releases must keep `package.json`, `package-lock.json`, `mcp.json`,
`server.json`, `CHANGELOG.md`, GitHub Releases, npm publication, SBOMs, and
artifact checksums in sync.

The repository already uses conventional commits, release-please manifest mode,
GitHub Actions, npm provenance, SBOM generation, and GitHub artifact
attestations.

## Decision

Use release-please manifest mode as the source of release version changes, and
use GitHub Actions for release asset creation, provenance, and npm publishing.

The release workflow:

1. Lets release-please decide whether a release is due.
2. Updates versioned files through `release-please-config.json`.
3. Runs `npm run ci:local` before asset creation.
4. Packs the npm tarball.
5. Generates a CycloneDX SBOM with `npm sbom`.
6. Writes SHA256 checksums.
7. Creates a GitHub artifact attestation for the tarball.
8. Attaches release assets to the GitHub Release.
9. Publishes the verified tarball to npm with provenance.
10. Verifies the version on npm.

`NPM_TOKEN` is treated only as a fallback. Trusted publishing through GitHub
OIDC is the intended path.

## Consequences

- Version bumps are centralized in release-please instead of manual edits.
- GitHub Releases, npm tarballs, SBOMs, and checksums are generated from the
  same workflow run.
- npm provenance and artifact attestations provide auditable supply-chain
  metadata for consumers.
- The release workflow depends on GitHub Actions permissions, release-please
  behavior, npm trusted publishing configuration, and the `npm-publish`
  environment.
- Failed release jobs must be fixed forward; published versions must not be
  retagged.

## Alternatives Considered

- Manual release checklist: flexible, but easier to drift and harder to audit.
- Tag-only release scripts: simple, but weaker at changelog, manifest, and
  metadata synchronization.
- semantic-release: mature, but this repository already uses release-please's
  manifest and pull-request based workflow.
- Publish from a local maintainer machine: avoids CI dependency, but weakens
  provenance and repeatability.

## Revisit Conditions

- release-please changes manifest semantics or action inputs in a breaking way.
- npm trusted publishing or provenance requirements change.
- The project adds additional registries, signed container releases, or separate
  release channels.
- A release incident shows the current workflow lacks required rollback or yank
  handling.

## References

- [release-please manifest releaser documentation](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers)
- [npm provenance documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub artifact attestations documentation](https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds)
