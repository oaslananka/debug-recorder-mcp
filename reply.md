Remediation complete for PR #105 (round 3, @1a8fe6c).

## Changes Made

1. **package.json:131** — Updated `markdown-it` override from `14.3.0` to `14.3.1` (patched version for GHSA-253c-mchw-3w2r)
2. **AGENTS.md** — Added `markdown-it@14.3.1` to the Approved Dependencies table with advisory rationale
3. **scripts/validate-security-policy.mjs:208** — Updated the required override check from `14.3.0` to `14.3.1`
4. **package-lock.json** — Regenerated with `npm install --package-lock-only --ignore-scripts` (lockfile format updated, markdown-it resolved to 14.3.1)

## Verification Results

- `npm ci --ignore-scripts` ✓
- `npm run install:approved-scripts` ✓
- `npm ls markdown-it typedoc` → resolves `markdown-it@14.3.1 overridden` ✓
- `npm audit --audit-level=moderate` → **0 vulnerabilities** ✓
- `npm run docs:site` ✓ (TypeDoc generates successfully)
- `npm run check:install-scripts` ✓
- `npm run check:security-policy` ✓
- `npm run ci:local` → **All checks pass** (lint, typecheck, tests, audit, security policy, etc.)

The two Quality gates (Node 22.22.3 and Node 24.16.0) that previously failed at `npm audit --audit-level=moderate` for GHSA-253c-mchw-3w2r now pass. No VEX exception or broad dependency upgrade was needed — only the targeted patch upgrade.