Fixed the 11 fixable vulnerabilities (8 HIGH, 3 CRITICAL) reported by Trivy in the Docker container scan.

**Changes made to `Dockerfile`:**
- Added `libpcre2-8-0` and `perl-base` to the `apt-get install --only-upgrade` command (line 35)

**Vulnerabilities fixed:**
- `libpcre2-8-0`: 4 HIGH CVEs (CVE-2026-103111, CVE-2026-86145, CVE-2026-89157, CVE-2026-89161)
- `perl-base`: 1 CRITICAL (CVE-2026-13221) + 6 HIGH (CVE-2026-42496, CVE-2026-8376, CVE-2026-42497, CVE-2026-48962, CVE-2026-57432, CVE-2026-57433)

**Verified:**
- Docker build succeeds
- Trivy container scan: 0 HIGH/CRITICAL findings
- HTTP smoke test passes (health endpoint returns `{"ok":true}`)
- All quality checks pass (lint, typecheck, format, dead-code, tests, audit)