# Export Output Schema Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `export_sessions` result validate against its advertised MCP output schema while preserving the existing flat JSON and summary response layouts.

**Architecture:** Keep the public response fields at the top level and add a required `format` discriminator. Define strict `JsonExportSessionsOutputSchema` and `SummaryExportSessionsOutputSchema` object schemas for internal/public contract testing, then expose a registration-compatible `ExportSessionsOutputSchema` object whose `sessions` field accepts either stable row shape. This avoids a breaking nested envelope and respects the MCP SDK requirement that registered output schemas be top-level Zod objects.

**Tech Stack:** TypeScript, Zod 3, `@modelcontextprotocol/sdk` 1.29.0, Jest, TypeDoc.

## Global Constraints

- Preserve JSON backup fields at the top level so existing `import_sessions` workflows remain usable.
- Do not change backup contents or import compatibility; that work remains in issue #63.
- Follow red-green-refactor: each production change must be preceded by a failing regression test.
- Keep `ExportSessionsOutputSchema` as a top-level Zod object because the MCP SDK normalizes registered schemas as object schemas.
- Keep emitted declarations within the existing package-size budget by exposing compact named output types instead of inferred Zod generics.
- Run the full local CI chain before opening the pull request.

---

### Task 1: Reproduce the public export contract failure

**Files:**
- Modify: `test/unit/mcp.test.ts`
- Modify: `test/e2e/session-flow.test.ts`

**Interfaces:**
- Consumes: `createToolHandlers(runtime)`, `Client.callTool()`, and the existing `ExportSessionsOutputSchema`.
- Produces: regression tests requiring `format: "json" | "summary"` and schema-valid `structuredContent` for both variants.

- [x] **Step 1: Add unit assertions for JSON structured content**

Update the JSON export/import test so it keeps the complete handler response and asserts the public structured result:

```ts
const exportResponse = handlers.handleExportSessions({ format: 'json' });
const exported = parseResponse<ExportPayload & { exported_at: string }>(
  exportResponse
);

expect(exportResponse.structuredContent).toEqual(exported);
expect(exportResponse.structuredContent).toMatchObject({ format: 'json' });
expect(
  ExportSessionsOutputSchema.safeParse(exportResponse.structuredContent).success
).toBe(true);
```

- [x] **Step 2: Add unit assertions for summary structured content**

Update the summary export test to retain the handler response and assert the discriminator and advertised schema:

```ts
const summaryResponse = handlers.handleExportSessions({ format: 'summary' });
const summary = parseResponse<{
  format: 'summary';
  schema_version: number;
  stats: { total: number };
  sessions: Array<{ id: string; title: string }>;
}>(summaryResponse);

expect(summaryResponse.structuredContent).toEqual(summary);
expect(summary.format).toBe('summary');
expect(
  ExportSessionsOutputSchema.safeParse(summaryResponse.structuredContent).success
).toBe(true);
```

- [x] **Step 3: Add MCP stdio coverage for both export variants**

After the session is created in `test/e2e/session-flow.test.ts`, call the public tool twice:

```ts
const jsonExport = await client.callTool({
  name: 'export_sessions',
  arguments: { format: 'json' }
});
expect(jsonExport.structuredContent).toMatchObject({
  format: 'json',
  sessions: expect.any(Array),
  fixes: expect.any(Array),
  commands: expect.any(Array)
});

const summaryExport = await client.callTool({
  name: 'export_sessions',
  arguments: { format: 'summary' }
});
expect(summaryExport.structuredContent).toMatchObject({
  format: 'summary',
  stats: expect.any(Object),
  sessions: expect.any(Array)
});
```

- [x] **Step 4: Run the unit regression test and verify RED**

Run:

```bash
node scripts/run-jest.mjs --runTestsByPath test/unit/mcp.test.ts --runInBand
```

Expected: FAIL because JSON lacks `format` and the summary payload does not satisfy the advertised full-session `sessions` schema.

- [x] **Step 5: Build and run the e2e regression test and verify RED**

Run:

```bash
npm run build
node scripts/run-jest.mjs --suite=e2e --runTestsByPath test/e2e/session-flow.test.ts --runInBand
```

Expected: FAIL on the export contract; the MCP client either rejects summary `structuredContent` against the advertised schema or the new `format` assertion fails.

### Task 2: Model and return explicit export variants

**Files:**
- Modify: `src/types.ts`
- Modify: `src/tools/admin-tools.ts`
- Modify: `test/unit/mcp.test.ts`

**Interfaces:**
- Produces: `ExportSummarySessionSchema`, `JsonExportSessionsOutputSchema`, `SummaryExportSessionsOutputSchema`, and the registration-compatible `ExportSessionsOutputSchema`.
- Preserves: flat JSON fields `exported_at`, `schema_version`, `sessions`, `fixes`, and `commands`.

- [x] **Step 1: Define the summary row and strict variant schemas**

Replace the current permissive export output schema with:

```ts
export const ExportSummarySessionSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(INPUT_LIMITS.title),
  status: SessionStatusSchema,
  language: z.string().max(INPUT_LIMITS.shortText).nullable(),
  error_type: z.string().max(INPUT_LIMITS.shortText).nullable(),
  created_at: z.string()
});

export const JsonExportSessionsOutputSchema = z.object({
  format: z.literal('json'),
  exported_at: z.string(),
  schema_version: z.number().int().min(1),
  sessions: z.array(SessionRowSchema),
  fixes: z.array(FixRowSchema),
  commands: z.array(CommandRowSchema)
});

export const SummaryExportSessionsOutputSchema = z.object({
  format: z.literal('summary'),
  exported_at: z.string(),
  schema_version: z.number().int().min(1),
  stats: StatsOutputSchema,
  sessions: z.array(ExportSummarySessionSchema)
});

export const ExportSessionsOutputSchema = z.object({
  format: z.enum(['json', 'summary']),
  exported_at: z.string(),
  schema_version: z.number().int().min(1),
  sessions: z.union([
    z.array(SessionRowSchema),
    z.array(ExportSummarySessionSchema)
  ]),
  fixes: z.array(FixRowSchema).optional(),
  commands: z.array(CommandRowSchema).optional(),
  stats: StatsOutputSchema.optional()
});
```

- [x] **Step 2: Return the discriminator from both handler paths**

Add the literal field to each response in `src/tools/admin-tools.ts`:

```ts
if (input.format === 'summary') {
  return jsonContent({
    format: 'summary',
    exported_at: new Date().toISOString(),
    schema_version: CURRENT_SCHEMA_VERSION,
    stats: store.getStats(),
    sessions: exported.sessions.map(/* existing projection */)
  });
}

return jsonContent({
  format: 'json',
  exported_at: new Date().toISOString(),
  ...exported
});
```

- [x] **Step 3: Assert each strict variant schema in unit tests**

Import the two strict schemas and add these assertions to the corresponding tests:

```ts
expect(
  JsonExportSessionsOutputSchema.safeParse(exportResponse.structuredContent)
    .success
).toBe(true);

expect(
  SummaryExportSessionsOutputSchema.safeParse(summaryResponse.structuredContent)
    .success
).toBe(true);
```

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node scripts/run-jest.mjs --runTestsByPath test/unit/mcp.test.ts --runInBand
npm run build
node scripts/run-jest.mjs --suite=e2e --runTestsByPath test/e2e/session-flow.test.ts --runInBand
```

Expected: both commands PASS.

- [x] **Step 5: Commit the contract fix**

```bash
git add src/types.ts src/tools/admin-tools.ts test/unit/mcp.test.ts test/e2e/session-flow.test.ts
git commit -m "fix(mcp): align export output schemas"
```

### Task 3: Document and verify the final response contracts

**Files:**
- Modify: `README.md`
- Modify: `docs/usage.md`
- Regenerate: `docs/api/**`
- Modify: `docs/superpowers/plans/2026-07-20-export-output-schema-contract.md`

**Interfaces:**
- Documents: `format`, common fields, JSON-only fields, summary-only fields, and import usage.

- [x] **Step 1: Document the format discriminator in README**

Replace the backup steps with wording that states JSON responses include `format: "json"`, while summary responses include `format: "summary"` and are not import payloads.

- [x] **Step 2: Add exact response-shape tables to usage docs**

Document common fields (`format`, `exported_at`, `schema_version`, `sessions`), JSON-only fields (`fixes`, `commands`, full session rows), and summary-only fields (`stats`, abbreviated session rows). State that `import_sessions.payload` accepts the full JSON backup object; the additional discriminator is harmless to validated import parsing.

- [x] **Step 3: Regenerate TypeDoc API output**

Run:

```bash
npm run docs:api
```

Expected: generated pages include the three exported schema variables and no TypeDoc errors.

- [x] **Step 4: Run the complete validation chain**

Run:

```bash
npm run ci:local
```

Expected: formatting, lint, dead-code, coverage, fuzz, build, e2e, audit, install-script policy, package, size, version, MCP metadata, and security policy checks all PASS.

- [x] **Step 5: Mark the plan complete and commit documentation**

Check every completed plan checkbox, then run:

```bash
git add README.md docs/usage.md docs/api docs/superpowers/plans/2026-07-20-export-output-schema-contract.md
git commit -m "docs: describe export response variants"
```

- [ ] **Step 6: Push and open the pull request**

```bash
git push -u origin fix/mcp-export-output-schema-61
```

Open a pull request against `main` with `Fixes #61`, the red/green evidence, final CI commands, compatibility notes, and the existing issue taxonomy labels.
