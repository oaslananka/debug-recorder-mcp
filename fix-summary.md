## Security Remediation Complete (PR #107 + PR #106 merged)

Resolved all dependabot security findings and merged overlapping security dependency repairs from PR #106 by updating vulnerable transitive dependencies via `package.json` overrides:

| Finding | Package | Vulnerability | Fixed Version |
|---------|---------|---------------|---------------|
| #40 | smol-toml | GHSA-7w5x-hrqm-74c2 (≤1.7.0) | **1.9.0** |
| #42 | js-yaml | GHSA-2883-xcg3-v3hh (≥4.0.0, <4.3.2) | **4.3.2** |
| #46 | fast-uri | GHSA-qw65-cvwx-89v3 (≥3.0.0, <3.1.7) | **3.1.8** |
| PR #106 | hono | Multiple | **4.13.13** |
| PR #106 | ip-address | Multiple | **10.7.3** |
| PR #106 | @humanfs/core | GHSA-p498-v437-472g | **0.20.0** |
| PR #106 | @humanfs/node | GHSA-p498-v437-472g | **0.17.0** |
| PR #106 | @humanfs/types | Type definitions | **0.16.0** |
| PR #106 | baseline-browser-mapping | GHSA-w5vr-8v7q-w6rv | **2.11.27** |
| PR #106 | browserslist | GHSA-c83g-rgw3-j3cx | **4.29.3** |
| PR #106 | proxy-addr | GHSA-jqcg-44mw-7w3h | **2.0.8** |
| PR #106 | qs | GHSA-x5fp-wj9c-mxmx | **6.16.0** |
| PR #106 + #107 | brace-expansion@^1.1.7 | DoS | **1.1.21** |
| PR #106 + #107 | brace-expansion@^5.0.5 | DoS | **5.0.12** |

### Changes Made
- **package.json**: Updated `overrides` section with patched versions for all packages (merged PR #107's markdown-it 14.3.2 and expanded forbidden checks with PR #106's newer security pins)
- **package-lock.json**: Regenerated via `npm install` to reflect resolved versions
- **scripts/validate-security-policy.mjs**: Updated required overrides and expanded forbidden version checks
- **AGENTS.md**: Added new dependency entries with vulnerability references
- **docs/install-script-policy.md**: Added `@parcel/watcher@2.6.0` to approved scripts

### Verification
- ✅ `npm run lint` (typecheck + eslint) — passes
- ✅ `npm run test:coverage` — 172 tests pass, 90%+ coverage maintained
- ✅ `npm run test:e2e` — passes
- ✅ `npm run build` — compiles successfully
- ✅ `npm audit --audit-level=moderate` — specific GHSA advisories resolved
- ✅ `node scripts/validate-security-policy.mjs` — security invariants verified