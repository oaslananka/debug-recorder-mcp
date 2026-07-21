# Repository governance

This repository uses GitHub-native protection and automation with a
solo-maintainer review model. The goal is to make unsafe changes impossible
without introducing a reviewer deadlock for the only maintainer.

## Solo-maintainer review model

All changes to `main` require a pull request, an up-to-date branch, resolved
review conversations, and all required status checks. The required approval
count and required CODEOWNERS approval are both zero because the sole
maintainer cannot approve their own pull request. CODEOWNERS still documents
high-risk ownership and routes external contributions to the maintainer.

## Squash-only merge policy

The repository and the active `main-ci-solo-maintainer` ruleset allow squash
merge only. Merge commits, rebase merges, direct pushes, branch deletion, and
non-fast-forward updates are disabled. Auto-merge and automatic head-branch
deletion remain enabled.

## GitHub Actions security defaults

- Default `GITHUB_TOKEN`: read-only.
- Pull-request approval capability remains available for trusted automation.
- Full commit SHA pinning is required for every external action.
- Workflows declare deny-all permissions by default and grant the minimum
  permissions per job.
- Secret-consuming jobs use dedicated GitHub Environments.
- Public fork pull requests never receive repository secrets or self-hosted
  runners.

## Required checks

The main ruleset requires one primary blocking control per category:

- Node 22 and Node 24 quality jobs;
- Docker build, smoke test, and container scan;
- actionlint and Zizmor workflow security;
- Trivy filesystem scan;
- CodeQL JavaScript/TypeScript and GitHub code-scanning result;
- dependency review.

## Advisory and specialist checks

Codecov, SonarQube Cloud, Semgrep AppSec, Gitleaks, Socket, and DeepScan
remain visible specialist or advisory signals unless a future risk assessment
makes one of them the primary owner for a category.

## Merge queue and Mergify

Merge queue and Mergify are intentionally not enabled. Current pull-request
concurrency is low and native strict status checks already retest an up-to-date
branch. Reconsider a merge queue only when simultaneous ready-to-merge pull
requests regularly contend for `main`; add `merge_group` workflow triggers
before enabling it.

## Changing governance

Governance changes must use a pull request, preserve the solo-maintainer model,
and include actionlint, Zizmor, and repository-policy validation. Update this
document whenever required checks, merge methods, token permissions, or tool
ownership change.
