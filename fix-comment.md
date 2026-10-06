Fixed the repository-side CI/security failures on PR #110 (renovate/dependency-security-automation).

## Root Cause
The governance policy validation (`scripts/validate-governance-policy.mjs`) expected `ZIZMOR_VERSION: 1.27.0` in `.github/workflows/security.yml`, but the workflow had been updated to `1.30.1` by the dependency automation PR. This caused the "Quality / Node 22" and "Quality / Node 24" jobs to fail on the governance policy test.

## Fix
Updated `scripts/validate-governance-policy.mjs:146` to check for `ZIZMOR_VERSION: 1.30.1` to match the current security workflow.

## Verification
All local CI checks now pass:
- ✅ `npm run lint` (typecheck + eslint)
- ✅ `npm run format:check`
- ✅ `npm run check:dead-code`
- ✅ `npm run test:coverage` (172 tests, 90%+ coverage)
- ✅ `npm run test:fuzz`
- ✅ `npm run build`
- ✅ `npm run test:e2e`
- ✅ `npm run check:install-scripts`
- ✅ `npm run check:package-size`
- ✅ `npm run check:version`
- ✅ `npm run check:mcp`
- ✅ `npm run check:security-policy`
- ✅ `npm run check:governance`
- ✅ `npm run check:renovate`
- ✅ `npm run check:codecov`
- ✅ `git diff --check` (no whitespace errors)

Pre-commit hooks also pass (formatting fixes applied to `comment.md`, `final-comment.md`, `fix-summary.md`, `remediation-summary.md`).

Note: `npm audit` reports a high-severity vulnerability in `@modelcontextprotocol/sdk` (GHSA-6qxp-vccf-f47h) that requires a version outside the declared range. This is a pre-existing finding not introduced by this PR and should be addressed via a VEX decision per `docs/security-sbom-vex.md`.