# Versioning Policy

This project publishes in two layers:

1. The installable npm package: `debug-recorder-mcp`
2. The Official MCP Registry metadata entry

The former `mcp-debug-recorder` npm name was unpublished and is no longer the
documented public artifact. New releases use `debug-recorder-mcp`, which matches
the repository name and the release workflow package identifiers.

The npm package and the MCP Registry entry are related, but they do not always need
to move together. This document defines when each one should change.

## Registry Rules

The Official MCP Registry currently expects these rules:

- Every `server.json.version` must be unique for each publication.
- For normal local-server releases, `server.json.version` should align with the
  underlying npm package version.
- If only registry metadata changes, use a prerelease version such as `1.3.4-1`
  instead of mutating an already published registry version.
- `package.json.mcpName` must match `server.json.name`.

The source of truth for the installable artifact remains the npm package. The
registry only stores metadata that points to that artifact.

## Namespace

When this project is published with GitHub authentication, the intended MCP
Registry name is:

```text
io.github.oaslananka/debug-recorder-mcp
```

That name should be used in:

- `package.json` as `mcpName`
- `server.json` as `name`

If you switch authentication strategies after an npm release has already been
published, release a new npm version before publishing the registry metadata
again. The registry validates ownership against the published package metadata,
not only against the repository contents.

## Release Decision Matrix

| Change type | Bump npm version? | Publish npm? | Publish MCP Registry? | Registry version |
| --- | --- | --- | --- | --- |
| Runtime or tool behavior change | Yes | Yes | Yes | Match npm version |
| Public API, transport, packaging, install change | Yes | Yes | Yes | Match npm version |
| Docs-only or internal-only change | No | No | No | No change |
| Registry metadata-only fix | No | No | Yes | Use prerelease, e.g. `1.3.4-1` |

## Recommended Patterns

### Standard release

Use this when the shipped package changes.

- Let release-please create the release PR from Conventional Commits.
- Do not provide manual version numbers in normal release automation.
- Keep `package.json.version`, `mcp.json.version`, `server.json.version`, and
  `server.json.packages[].version` equal to the npm version.
- Publish npm first, then publish the registry metadata.

Example:

```json
{
  "version": "1.3.5",
  "packages": [
    {
      "identifier": "debug-recorder-mcp",
      "version": "1.3.5"
    }
  ]
}
```

### Registry-only metadata correction

Use this when the installable npm package is already correct and only MCP Registry
metadata needs to change, for example:

- title or description refinement
- category/tag style metadata updates
- repository or homepage metadata correction

In that case:

- keep the npm package at the last published stable version
- keep `server.json.packages[].version` pointing to that stable npm version
- bump only `server.json.version` with a prerelease suffix

Example:

```json
{
  "version": "1.3.5-1",
  "packages": [
    {
      "identifier": "debug-recorder-mcp",
      "version": "1.3.5"
    }
  ]
}
```

If another metadata-only correction is needed after that, increment the prerelease:

- `1.3.5-2`
- `1.3.5-3`

## What Not To Do

- Do not republish the same `server.json.version`
- Do not change registry metadata in place after publication
- Do not publish registry metadata that points to an npm version that does not exist
- Do not touch the registry for docs-only or internal refactors

## Practical Examples

### Example A: patch fix

- Code fix lands
- Release target: `1.3.6`
- Actions:
  - `package.json.version = 1.3.6`
  - `server.json.version = 1.3.6`
  - `server.json.packages[].version = 1.3.6`
  - publish npm
  - publish MCP Registry

### Example B: docs-only commit

- README and usage examples improve
- No package behavior changes
- Actions:
  - do not bump version
  - do not publish npm
  - do not publish MCP Registry

### Example C: registry metadata fix

- npm package `1.3.6` is already published
- Registry title or description needs correction
- Actions:
  - keep npm package at `1.3.6`
  - set `server.json.version = 1.3.6-1`
  - keep `server.json.packages[].version = 1.3.6`
  - publish MCP Registry only

## Server Metadata Checklist

Before a registry publish, confirm:

- `package.json.mcpName` equals `server.json.name`
- `server.json.version` follows the rules above
- `server.json.packages[].identifier` matches the real npm package name
- `server.json.packages[].version` exists on npm
- npm publication succeeded before registry publication
- `node scripts/check-version-sync.mjs` passes
- `node scripts/validate-mcp-metadata.mjs` passes

## Automation

This repository uses release-please manifest mode:

- `release-please-config.json`
- `.release-please-manifest.json`
- `CHANGELOG.md`

The manifest is bootstrapped from the current package version. On merge to
`main`, release-please either opens/updates a release PR or, after that PR is
merged, creates the GitHub Release. Downstream release jobs derive the version
and tag only from release-please outputs.

The `npm-publish` environment gates production npm publish. Pull request checks
perform only validation and package dry runs.
