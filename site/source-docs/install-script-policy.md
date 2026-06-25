# npm install-script approval policy

npm 11 reports install scripts that are not covered by the project
`allowScripts` policy. The field is currently advisory, but npm documents that a
future release will block unreviewed install scripts. This repository keeps the
policy explicit and version-pinned so dependency updates cannot silently expand
native or postinstall execution.

## Approved scripts

| Package                 | Why it is approved                                                                                                                                       | Review expectation                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `better-sqlite3@12.8.0` | Required native SQLite binding for the local-first debug session store. The package uses install/build steps to provide or compile native bindings.      | Review changelog, native build changes, release provenance, and `npm audit` before changing this pin.                 |
| `unrs-resolver@1.12.2`  | Transitive resolver dependency used by the lint/developer tooling dependency graph. Its postinstall path is reviewed and pinned to the lockfile version. | Review resolver package release notes, transitive dependency changes, and the lockfile diff before changing this pin. |

Do not replace these with unpinned package names. Version-pinned entries make a
future dependency update create a visible policy diff.

## Maintainer workflow

When dependencies change:

1. Run `npm ci` from a clean checkout.
2. Run `npm run check:install-scripts`.
3. If the check reports pending install scripts, inspect each package and decide
   whether to approve, deny, replace, or pin the dependency.
4. Approve only reviewed packages with pinned entries:

```bash
npm approve-scripts <package-name>
```

5. Update this document with the reason for every newly approved package.
6. Run the standard supply-chain gate:

```bash
npm audit --audit-level=moderate
npm run check:install-scripts
npm run test:coverage
```

## CI behavior

CI runs `npm run check:install-scripts` after `npm audit` and before package
verification.

On npm versions that provide `npm approve-scripts`, the check uses that native
pending-review command. Older npm versions fall back to scanning installed
`preinstall`, `install`, and `postinstall` lifecycle scripts in `node_modules`
and comparing them to the pinned `allowScripts` policy.

The check fails when:

- `package.json` does not define `allowScripts`
- expected approved scripts are missing
- an approved script is not version-pinned
- the npm native pending-review command reports any unreviewed install scripts
- the fallback installed lifecycle scan finds a package that is not approved in
  `allowScripts`

This keeps install-script drift visible in ordinary dependency PRs and in manual
release validation.

## Renovate and dependency PRs

Renovate does not automerge `better-sqlite3` or `unrs-resolver` updates. PRs that
change native or postinstall-capable packages must include evidence from
`npm run check:install-scripts` and must update `allowScripts` plus this policy
when the reviewed version changes.
