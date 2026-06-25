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
- Scanner output: <link to CI run, artifact, or local scanner output>
- Notes: <why this is safe for this package>
