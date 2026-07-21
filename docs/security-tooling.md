# Dependency and security tooling

This repository uses layered automation so developers receive fast local feedback while authenticated scanners remain authoritative in GitHub Actions.

## Tool versions

| Tool            | Pinned version  | Purpose                                           |
| --------------- | --------------- | ------------------------------------------------- |
| Renovate        | `43.272.4`      | Dependency and pinned-reference updates           |
| pre-commit      | `4.6.0`         | Local Git hook orchestration                      |
| Semgrep         | `1.170.0`       | Repository-owned SAST rules and Semgrep AppSec CI |
| actionlint      | `1.7.12`        | GitHub Actions syntax and semantic validation     |
| Zizmor          | `1.27.0`        | GitHub Actions security analysis                  |
| Snyk CLI        | `1.1306.1`      | npm dependency vulnerability analysis             |
| SonarQube Cloud | Managed service | Automatic code-quality and security quality gate  |

Renovate manages these pinned versions and their workflow/action references. Major, Node, MCP runtime, native dependency, and other high-risk updates require explicit maintainer approval.

## Tool ownership matrix

Each category has one primary owner. Additional services are specialist or
advisory signals rather than duplicate blocking gates.

| Category                        | Primary owner                              | Specialist or advisory signals                                               |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Dependency updates              | Renovate                                   | Dependabot alerts only; no duplicate version-update PRs                      |
| SAST                            | CodeQL                                     | Semgrep for repository-owned patterns; Snyk Code only as platform visibility |
| Secrets                         | GitHub secret scanning and push protection | Gitleaks as CI defense in depth                                              |
| Container/filesystem            | Trivy                                      | Snyk container/IaC only if the platform becomes the organization standard    |
| Coverage and test analytics     | Codecov                                    | SonarQube Cloud may display metrics but is not a second coverage gate        |
| Code quality and technical debt | ESLint, TypeScript, and Knip               | SonarQube Cloud advisory/new-code quality gate                               |
| Workflow security               | actionlint and Zizmor                      | OpenSSF Scorecard for repository-level posture                               |
| Releases and supply chain       | Release Please, OIDC, attestations, SBOM   | OpenSSF Scorecard                                                            |

Codecov statuses remain informational while the baseline stabilizes. CodeQL, Trivy, dependency review, and workflow security are the blocking
category owners in the `main` ruleset. See
[Repository governance](./repository-governance.md) for the exact merge model.

## Install local hooks

Install the Python-based hook tools in isolated environments:

```bash
pipx install 'pre-commit==4.6.0'
pipx install 'semgrep==1.170.0'
npm ci
npm run hooks:install
```

The install command enables only the fast `pre-commit` stage. Full tests and
network-dependent scanners are deliberate manual commands, not automatic push
hooks.

Run the commit-stage checks across the repository:

```bash
npm run hooks:run
```

Run the complete manual hook stage explicitly:

```bash
npm run hooks:manual
```

## Hook stages

### pre-commit

The fast commit path runs:

- JSON/YAML/TOML, merge-conflict, private-key, large-file, line-ending,
  whitespace, and EOF checks;
- actionlint and offline Zizmor checks for changed GitHub Actions workflows;
- strict Renovate config validation;
- repository Semgrep rules on staged JavaScript and TypeScript;
- Prettier and ESLint on staged TypeScript source/tests;
- repository-specific Renovate policy assertions.

Semgrep rule fixtures are generated in a temporary directory by `scripts/validate-semgrep-rules.mjs`; intentionally insecure examples are never tracked as analyzable repository source.

### manual

Full tests and token-dependent or remote checks are explicit so routine commits
and pushes stay fast and deterministic:

```bash
pre-commit run --hook-stage manual full-local-ci
pre-commit run --hook-stage manual snyk-open-source
pre-commit run --hook-stage manual sonar-quality-gate
# or run all manual checks
npm run hooks:manual
```

A missing local Snyk token is reported and skipped so offline development is not
blocked. GitHub Actions remains authoritative for authenticated Snyk results.

## Semgrep

Validate the repository rules against positive and negative fixtures:

```bash
npm run security:semgrep:test
```

Scan the tracked repository with the committed high-signal rules:

```bash
npm run security:semgrep
```

GitHub Actions uses `SEMGREP_APP_TOKEN` for trusted pull requests, main pushes, schedules, and manual runs. Fork pull requests never receive that secret; they run the committed `.semgrep.yml` rules in a fork-safe job instead.

## Snyk

For local authenticated scans, set one of these environment variables:

```bash
export SNYK_TOKEN=replace-with-your-token
# Legacy repository-compatible spelling:
export SYNK_PAT_TOKEN=replace-with-your-token
npm run security:snyk
```

`SNYK_TOKEN` is preferred locally. The existing GitHub repository secret is named `SYNK_PAT_TOKEN`; the workflow maps it to the CLI-standard `SNYK_TOKEN` without printing either value.

Require a token instead of allowing a local skip:

```bash
npm run security:snyk:required
```

CI invokes the same repository runner through the npm registry, avoiding the separate Snyk binary CDN. It scans production and development npm dependencies and fails on high or critical findings. Emergency transitively fixed versions are pinned in `overrides`; `npm run check:security-policy` rejects known-vulnerable lockfile regressions.

## SonarQube Cloud

The project key is `oaslananka_debug-recorder-mcp`. SonarQube Cloud automatic analysis is the only analysis method for this repository. Do not add `sonar-project.properties` or a separate scanner workflow while automatic analysis is enabled because duplicate analysis methods can conflict.

Check the public quality-gate status:

```bash
npm run security:sonar
```

The command needs no token and exits non-zero when the quality gate is not `OK`. Historical findings are tracked separately; maintainers must remediate or explicitly review them without lowering the quality gate.

## Renovate operations

Repository policy lives in `renovate.json`; self-hosted runner boundaries live in `.github/renovate-global.json`. Validate both with:

```bash
npm run check:renovate
```

The scheduled workflow targets only `oaslananka/debug-recorder-mcp`, uses the `renovate-managed/` branch prefix, and authenticates with `GH_AUTH_TOKEN`. A personal access token is required so Renovate-created pull requests trigger normal protected-branch workflows.

Release Please uses the same PAT boundary when creating or updating release pull requests. The default GitHub Actions token must not be used for bot-authored pull requests because those events do not start the repository's normal pull-request workflows.

Secret-consuming jobs use dedicated GitHub Environments: `release-automation`, `dependency-automation`, `semgrep-appsec`, and `snyk`. These boundaries make secret access explicit without changing the repository-level secret names.

The Dependency Dashboard is the approval surface for major and high-risk updates. Digest-only updates may automerge only after required checks pass.

## Skipping hooks

Use hook skips only for a documented emergency and never to bypass repository CI:

```bash
SKIP=actionlint,zizmor git commit
```

GitHub Actions scans still run. Do not use `--no-verify` as a routine workflow.

## Troubleshooting

- `pre-commit: command not found`: install the pinned version with pipx and rerun `npm run hooks:install`.
- `semgrep: command not found`: install Semgrep `1.170.0` with pipx.
- Renovate validation fails: run `npm run check:renovate` and fix both schema and repository policy errors.
- Snyk skips locally: set `SNYK_TOKEN`; CI continues to enforce authenticated scanning.
- Sonar quality gate is red: run `npm run security:sonar`, then inspect the SonarQube Cloud project and the linked remediation issue.
