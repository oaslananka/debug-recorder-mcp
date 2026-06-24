# SBOM and VEX Dependency Finding Policy

This project treats dependency and scanner findings as release-quality signals. The goal is to keep runtime users safe while avoiding noisy, undocumented exceptions for dev-only or non-exploitable findings.

## Release assets

Every GitHub Release build must keep producing the following assets:

- npm package tarball from `npm pack`.
- CycloneDX SBOM from `npm sbom --sbom-format=cyclonedx`.
- `SHA256SUMS` for release artifacts.
- GitHub artifact provenance attestations for the package tarball.

The release workflow must fail rather than publish when any of those assets cannot be generated.

## Finding classification

| Class | Examples | Required action |
| --- | --- | --- |
| Production/runtime | Direct runtime dependencies, transitive dependencies shipped in the npm package, HTTP transport dependencies | Fix immediately for `moderate`, `high`, and `critical` findings before release. |
| Optional/native runtime | `better-sqlite3` native build chain or platform-specific optional packages | Fix immediately when exploitable in supported runtime use; otherwise document scope and mitigation. |
| Development-only | Jest, TypeDoc, lint, coverage, test-only transform packages | Fix before merge when `npm audit --audit-level=moderate` fails, unless a documented temporary VEX decision exists. |
| Scanner-only container/OS | Findings emitted by Trivy for base image or package-manager metadata | Fix `high` and `critical` findings before release, or document why the vulnerable component is unreachable/not present in the final artifact. |
| False positive / not affected | Finding targets an unused adapter, disabled feature, unreachable platform path, or non-shipped file | Record a VEX decision and keep scanner/audit output linked to that decision. |

## Fix vs temporary acceptance

Fix immediately when any of these are true:

- The vulnerable package is used by production code or included in the published npm package.
- The vulnerability affects Streamable HTTP, local storage, redaction, search/query handling, release automation, install scripts, or package publication.
- The finding is `high` or `critical` in a supported runtime path.
- A patch is available and does not require a breaking downgrade or unsafe override.

Temporary acceptance is allowed only when all of these are true:

- The finding is not exploitable in the supported configuration, or it is dev/test-only and blocked from runtime publication.
- A tracking issue exists with owner, scope, mitigation, and re-review date.
- The decision is captured using the VEX record format below.
- CI output links maintainers to this policy when the relevant audit/scanner step fails.

## VEX decision record format

Store VEX/advisory decisions in `docs/security/vex/YYYY-MM-DD-<package-or-advisory>.md` when needed.

```md
# VEX: <package/advisory>

- Date: YYYY-MM-DD
- Review by: <GitHub handle>
- Advisory: <GHSA/CVE/npm advisory URL or identifier>
- Package and version: <name>@<version>
- Affected path: production | optional-native | development-only | scanner-only
- Status: affected | not_affected | fixed | under_investigation
- Justification: component_not_present | vulnerable_code_not_in_execute_path | vulnerable_code_cannot_be_controlled_by_adversary | inline_mitigations_already_exist | dev_dependency_only | other
- Mitigation: <patch, override, config, or release gate>
- Tracking issue/PR: #<number>
- Re-review date: YYYY-MM-DD

## Evidence

- Commands run:
  - `npm audit --audit-level=moderate`
  - `npm sbom --sbom-format=cyclonedx >/tmp/debug-recorder-mcp.cdx.json`
  - `npm run ci:local`
- Notes: <why this is safe for this package>
```

## Current policy baseline

As of this policy, the expected baseline is:

- `npm audit --audit-level=moderate` reports zero vulnerabilities.
- `npm approve-scripts --allow-scripts-pending` reports no unreviewed install scripts.
- Release assets include SBOM, checksums, and provenance attestations.
- Any future exception must be explicit, issue-linked, and time-bounded.

## Maintainer checklist

Before merging a dependency/security PR:

1. Run `npm ci` from a clean checkout.
2. Run `npm approve-scripts --allow-scripts-pending` and review any new install scripts.
3. Run `npm audit --audit-level=moderate`.
4. Generate a local SBOM with `npm sbom --sbom-format=cyclonedx >/tmp/debug-recorder-mcp.cdx.json`.
5. Run `npm run ci:local`.
6. If anything remains unfixed, add a VEX decision record and link the tracking issue.
