[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ImportSessionsOutputSchema

# Variable: ImportSessionsOutputSchema

> `const` **ImportSessionsOutputSchema**: `ZodObject`\<\{ `errors`: `ZodArray`\<`ZodString`, `"many"`\>; `imported`: `ZodObject`\<\{ `commands`: `ZodNumber`; `fixes`: `ZodNumber`; `sessions`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}\>; `invalid`: `ZodObject`\<\{ `commands`: `ZodNumber`; `fixes`: `ZodNumber`; `sessions`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}\>; `schema_version`: `ZodNumber`; `skipped`: `ZodObject`\<\{ `commands`: `ZodNumber`; `fixes`: `ZodNumber`; `sessions`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}\>; `success`: `ZodBoolean`; \}, `"strip"`, `ZodTypeAny`, \{ `errors`: `string`[]; `imported`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `invalid`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `schema_version`: `number`; `skipped`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `success`: `boolean`; \}, \{ `errors`: `string`[]; `imported`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `invalid`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `schema_version`: `number`; `skipped`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `success`: `boolean`; \}\>

Defined in: [src/types.ts:463](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/types.ts#L463)
