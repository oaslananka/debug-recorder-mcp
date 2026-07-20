# Dependency and Security Automation Design

## Objective

Make dependency maintenance and security feedback operational, reproducible, and repository-owned without turning ordinary commits into slow, token-dependent operations.

## Current State

- `renovate.json` contains strong repository policy, but the Dependency Dashboard has been closed since June 2026 and no Renovate branches are active.
- Git hooks are not standardized.
- `SEMGREP_APP_TOKEN`, `SONAR_TOKEN`, and the legacy-named `SYNK_PAT_TOKEN` secrets exist.
- SonarQube Cloud automatic analysis decorates pull requests, but the main quality gate is currently red because of historical findings.
- CodeQL, dependency review, Gitleaks, Trivy, Socket, and npm audit already provide complementary CI coverage.

## Chosen Architecture

### 1. Dependency automation

Run Renovate self-hosted from GitHub Actions so operation does not depend on an unverified hosted-app installation. The workflow targets only `oaslananka/debug-recorder-mcp`, uses `GH_AUTH_TOKEN`, and has a non-default `renovate-managed/` branch prefix to avoid collisions with any hosted Renovate installation.

Pin:

- `renovatebot/github-action` by commit SHA with a release comment.
- Renovate runtime to `43.272.4`.
- Repository config validator hook to `43.272.4`.

The repository policy continues to require human approval for majors, runtime/native dependencies, and Node changes. Digest-only updates can automerge after checks. Renovate also manages GitHub Actions, Docker references, pre-commit revisions, and its own runtime version through a regex custom manager.

### 2. Local Git hooks

Use pre-commit `4.6.0` with both `pre-commit` and `pre-push` hook types.

`pre-commit` stage:

- whitespace, EOF, JSON/YAML, merge-conflict, and private-key checks;
- Prettier and ESLint on staged TypeScript/JavaScript files;
- strict Renovate config validation;
- Semgrep `1.170.0` against a repository-local high-signal ruleset.

`pre-push` stage:

- full `npm run ci:local`;
- Snyk Open Source scan when a local token is available. A missing local token is reported explicitly and skipped because CI is authoritative.

`manual` stage:

- Snyk scan;
- SonarQube Cloud quality-gate status check.

### 3. CI security scanners

Semgrep gets its own workflow. Internal pull requests and main/scheduled runs use `semgrep ci` with `SEMGREP_APP_TOKEN`; fork pull requests fall back to the committed local rules so untrusted code never receives secrets.

Snyk gets its own workflow. It runs for internal pull requests, main pushes, schedules, and manual dispatch. The workflow maps the existing secret `SYNK_PAT_TOKEN` to the CLI-standard `SNYK_TOKEN`, pins the setup action and CLI version, and fails on high or critical dependency findings.

### 4. SonarQube Cloud

Keep automatic analysis as the single Sonar analysis method. Do not add `sonar-project.properties` or a scanner workflow while automatic analysis is enabled, because duplicate analysis methods can conflict. Add a local/manual status checker for project key `oaslananka_debug-recorder-mcp` and document the current remediation boundary. Historical findings remain a separate issue; the quality gate will not be weakened.

## Security Boundaries

- No workflow prints secret values.
- Fork pull requests never receive Semgrep or Snyk secrets.
- Actions and scanner versions are pinned.
- Renovate uses a PAT secret rather than `GITHUB_TOKEN`, because bot-created PRs must trigger normal CI.
- Local token absence never blocks commits; authenticated CI remains authoritative.
- No automatic major-version merges.

## Testing

- Strict Renovate validation and dry-run against the repository.
- `pre-commit validate-config`, all-file pre-commit execution, and pre-push execution with tokenless Snyk skip behavior.
- Semgrep rule tests and full repository scan.
- YAML parsing, actionlint, and zizmor for all workflows.
- Full `npm run ci:local`.
- Branch workflow runs after push, including authenticated Semgrep and Snyk jobs.

## Documentation

Add one security-tooling guide covering installation, hook stages, manual commands, CI authority, secret naming, Sonar automatic-analysis ownership, and troubleshooting. Link it from contributor and security documentation.
