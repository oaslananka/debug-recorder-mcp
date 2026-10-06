# Dependency and Security Automation Implementation Plan

> Historical note (2026-07-21): the Snyk-specific portions of this record were retired by issue #90 after the account and credential were removed. Current security ownership is defined in `docs/security-tooling.md`.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Operate Renovate and provide layered pre-commit, Semgrep, Snyk, and SonarQube Cloud security feedback for debug-recorder-mcp.

**Architecture:** A self-hosted Renovate workflow consumes the repository-local policy. Fast deterministic checks run at pre-commit, full/token-bound checks run at pre-push or manual stages, and authenticated Semgrep/Snyk scans run in dedicated CI workflows. SonarQube Cloud remains automatic-analysis-only and gains a status checker plus documented remediation ownership.

**Tech Stack:** GitHub Actions, Renovate 43.272.4, pre-commit 4.6.0, Semgrep 1.170.0, Snyk CLI 1.1306.1, Node.js 22/24, Bash, JavaScript modules.

## Global Constraints

- Target only `oaslananka/debug-recorder-mcp` from the self-hosted Renovate runner.
- Use `renovate-managed/` as the self-hosted branch prefix.
- Keep major, Node, runtime, and native dependency updates manual.
- Never expose repository secrets to fork pull requests.
- Never print secret values.
- Do not add a Sonar scanner workflow or `sonar-project.properties` while automatic analysis is active.
- Do not weaken the SonarQube Cloud quality gate.
- Missing local Snyk credentials must be reported and skipped; CI remains authoritative.
- Pin actions by commit SHA and scanner/runtime versions exactly.

---

### Task 1: Operate and validate Renovate

**Files:**

- Create: `.github/renovate-global.js`
- Create: `.github/workflows/renovate.yml`
- Modify: `renovate.json`
- Modify: `package.json`

**Interfaces:**

- Consumes: repository secret `GH_AUTH_TOKEN`.
- Produces: scheduled/manual Renovate runner, `npm run check:renovate`, and `renovate-managed/*` branches.

- [x] Add a failing policy check proving the current config lacks the self-hosted runtime manager and dedicated branch prefix.
- [x] Add the global self-hosted configuration and pinned workflow.
- [x] Extend repository rules for Docker, config migration, abandonment detection, status checks, security tooling grouping, and Renovate runtime extraction.
- [x] Add `check:renovate` using `renovate-config-validator --strict` pinned to `43.272.4`.
- [x] Run strict validation and an authenticated dry-run; verify no branches or PRs are created by the dry-run.
- [x] Commit as `ci(renovate): operate repository dependency updates`.

### Task 2: Add deterministic local hooks and Semgrep rules

**Files:**

- Create: `.pre-commit-config.yaml`
- Create: `.semgrep.yml`
- Modify: `scripts/validate-semgrep-rules.mjs` (generate temporary rule fixtures outside the tracked source tree)
- Modify: `package.json`

**Interfaces:**

- Produces: pre-commit/pre-push hook installation, `security:semgrep`, and Semgrep rule tests.

- [x] Generate temporary Semgrep test fixtures for forbidden `eval`, dynamic `Function`, shell execution, and environment logging patterns.
- [x] Run Semgrep tests before rules exist and verify RED.
- [x] Add high-signal repository-local Semgrep rules and verify rule tests GREEN.
- [x] Add pre-commit hooks pinned to pre-commit-hooks v6.0.0, Renovate hook 43.272.4, and Semgrep v1.170.0.
- [x] Add staged Prettier/ESLint checks and pre-push full CI hooks.
- [x] Validate the hook configuration and run all pre-commit-stage hooks.
- [x] Commit as `build: add layered pre-commit security hooks`.

### Task 3: Add authenticated Snyk and Semgrep CI

**Files:**

- Create: `.github/workflows/semgrep.yml`
- Create: `.github/workflows/snyk.yml`
- Create: `scripts/run-snyk.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: `SEMGREP_APP_TOKEN` and legacy secret `SYNK_PAT_TOKEN`.
- Produces: diff-aware Semgrep AppSec scans, fork-safe local fallback scans, and high-severity Snyk dependency gates.

- [x] Add tests for tokenless Snyk skip and required-token failure modes.
- [x] Implement `run-snyk.mjs` with exact CLI version `1.1306.1` and no secret logging.
- [x] Add the Semgrep workflow with pinned image/version and fork fallback.
- [x] Add the Snyk workflow with pinned setup action/CLI and internal-PR secret boundary.
- [x] Parse workflow YAML and run actionlint/zizmor.
- [x] Commit as `ci(security): add Semgrep and Snyk scans`.

### Task 4: Document Sonar and contributor workflow

**Files:**

- Create: `scripts/check-sonar-quality-gate.mjs`
- Create: `docs/security-tooling.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/security.md`
- Modify: `package.json`

**Interfaces:**

- Produces: `npm run security:sonar`, documented hook setup, and explicit scanner ownership.

- [x] Add a deterministic test for Sonar status parsing using injected JSON input.
- [x] Implement the public quality-gate status checker for `oaslananka_debug-recorder-mcp`.
- [x] Document pre-commit installation, stages, scanner commands, secret names, fork behavior, and Sonar automatic-analysis ownership.
- [x] Link the guide from contributor and security docs.
- [x] Commit as `docs: document dependency and security automation`.

### Task 5: Verify, run remote checks, and integrate

**Files:**

- Modify: `docs/superpowers/plans/2026-07-20-dependency-security-automation.md`

**Interfaces:**

- Produces: issue #70 completion evidence and a merge-ready pull request.

- [x] Run `npm run ci:local`.
- [x] Run `npm run check:renovate`.
- [x] Run `pre-commit validate-config` and `pre-commit run --all-files`.
- [x] Run `pre-commit run --hook-stage pre-push --all-files` with no local Snyk token and verify explicit skip plus successful remaining gates.
- [x] Run Semgrep rule tests and full local scan.
- [x] Run actionlint and zizmor for all workflows.
- [x] Push the branch and open a PR with `Fixes #70`.
- [ ] Verify authenticated Semgrep and Snyk workflow results on GitHub.
- [ ] Trigger the Renovate workflow after merge and verify the Dependency Dashboard plus `renovate-managed/*` behavior.
