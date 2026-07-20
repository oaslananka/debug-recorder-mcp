# Dependency and security tooling

This repository uses layered automation so developers receive fast local feedback while authenticated scanners remain authoritative in GitHub Actions.

## Tool versions

| Tool            | Pinned version  | Purpose                                           |
| --------------- | --------------- | ------------------------------------------------- |
| Renovate        | `43.272.4`      | Dependency and pinned-reference updates           |
| pre-commit      | `4.6.0`         | Local Git hook orchestration                      |
| Semgrep         | `1.170.0`       | Repository-owned SAST rules and Semgrep AppSec CI |
| Snyk CLI        | `1.1306.1`      | npm dependency vulnerability analysis             |
| SonarQube Cloud | Managed service | Automatic code-quality and security quality gate  |

Renovate manages these pinned versions and their workflow/action references. Major, Node, MCP runtime, native dependency, and other high-risk updates require explicit maintainer approval.

## Install local hooks

Install the Python-based hook tools in isolated environments:

```bash
pipx install 'pre-commit==4.6.0'
pipx install 'semgrep==1.170.0'
npm ci
npm run hooks:install
```

The install command enables both `pre-commit` and `pre-push` stages.

Run the commit-stage checks across the repository:

```bash
npm run hooks:run
```

Run the push-stage checks explicitly:

```bash
pre-commit run --hook-stage pre-push --all-files
```

## Hook stages

### pre-commit

The fast commit path runs:

- JSON/YAML, merge-conflict, private-key, large-file, whitespace, and EOF checks;
- strict Renovate config validation;
- repository Semgrep rules on staged JavaScript and TypeScript;
- Prettier and ESLint on staged TypeScript source/tests;
- repository-specific Renovate policy assertions.

Semgrep rule fixtures are generated in a temporary directory by `scripts/validate-semgrep-rules.mjs`; intentionally insecure examples are never tracked as analyzable repository source.

### pre-push

Before a push, hooks run:

- `npm run ci:local`;
- `node scripts/run-snyk.mjs`.

A missing local Snyk token is reported and skipped so offline development is not blocked. GitHub Actions remains authoritative for authenticated Snyk results.

### manual

Run token-dependent or remote status checks deliberately:

```bash
pre-commit run --hook-stage manual snyk-open-source
pre-commit run --hook-stage manual sonar-quality-gate
```

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

CI invokes the same repository runner through the npm registry, avoiding the separate Snyk binary CDN. It scans production and development npm dependencies and fails on high or critical findings.

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
SKIP=snyk-open-source git push
```

GitHub Actions scans still run. Do not use `--no-verify` as a routine workflow.

## Troubleshooting

- `pre-commit: command not found`: install the pinned version with pipx and rerun `npm run hooks:install`.
- `semgrep: command not found`: install Semgrep `1.170.0` with pipx.
- Renovate validation fails: run `npm run check:renovate` and fix both schema and repository policy errors.
- Snyk skips locally: set `SNYK_TOKEN`; CI continues to enforce authenticated scanning.
- Sonar quality gate is red: run `npm run security:sonar`, then inspect the SonarQube Cloud project and the linked remediation issue.
