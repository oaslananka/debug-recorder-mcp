## Summary

Fixed all open HIGH and MEDIUM Dependabot vulnerabilities via a consolidated update to `package.json` overrides and `package-lock.json`. All acceptance criteria met:

- ✅ `npm audit --audit-level=moderate` exits 0 (0 vulnerabilities)
- ✅ `npm run test:coverage` passes (172 tests, 90.27% statement coverage)
- ✅ `npm run build` passes (TypeScript compilation successful)
- ✅ `npm run lint` passes (typecheck + eslint)

## Changes Made

Updated `package.json` overrides with fixed versions for all vulnerable transitive dependencies:

| Package | Before | After | Advisory |
|---------|--------|-------|----------|
| fast-uri | 3.1.4 | **4.2.1** | GHSA-7p8r-x3mc-p8w7 et al. (3.0.0–3.1.7 vulnerable) |
| browserslist | 4.28.4 | **4.28.7** | GHSA-c83g-rgw3-j3cx (≤4.28.6 vulnerable) |
| ip-address | 10.2.0 | **10.7.3** | GHSA-mwp4-54f8-5fhr et al. (≤10.7.0 vulnerable) |
| js-yaml | 4.3.0 | **4.3.2** | GHSA-5p4m-2wfm-xmqj (4.0.0–4.3.1 vulnerable) |
| smol-toml | 1.6.1 | **1.7.1** | GHSA-7w5x-hrqm-74c2 (≤1.7.0 vulnerable) |
| markdown-it | 14.3.0 | **14.3.1** | GHSA-253c-mchw-3w2r (<14.3.1 vulnerable) |
| hono | 4.12.27 | **4.13.13** | GHSA-8j4g-w8fx-2239 et al. (≤4.13.6 vulnerable) |
| qs | 6.15.2 | **6.16.0** | GHSA-x5fp-wj9c-mxmx (2.2.5–6.15.3 vulnerable) |
| @humanfs/node | 0.16.7 | **0.16.8** | GHSA-p498-v437-472g (<0.16.8 vulnerable) |
| baseline-browser-mapping | 2.10.38 | **2.11.0** | GHSA-w5vr-8v7q-w6rv (2.0.0–2.10.x vulnerable) |
| brace-expansion (1.x) | 1.1.16 | **1.1.21** | GHSA-mh99-v99m-4gvg et al. (≤1.1.20 vulnerable) |
| brace-expansion (5.x) | 5.0.7 | **5.0.12** | GHSA-mh99-v99m-4gvg et al. (4.0.0–5.0.11 vulnerable) |

Used version-range override syntax (`brace-expansion@^1.1.7`, `brace-expansion@^5.0.5`) to ensure both eslint (minimatch 3.x) and typedoc (minimatch 10.x) dependency trees receive their respective fixed versions.

## Notes

- No VEX statements or audit exceptions needed — all advisories had published fixes
- No major-version migrations requiring code changes were forced (fast-uri 4.x is a transitive dependency of `@modelcontextprotocol/sdk` via `ajv`; no direct code changes needed)
- Bot PRs #95–#103 should auto-close as obsolete once this lands
- Ready for Stage 2 (ENG-264 child)
