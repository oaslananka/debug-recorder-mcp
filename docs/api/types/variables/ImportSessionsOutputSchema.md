[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ImportSessionsOutputSchema

# Variable: ImportSessionsOutputSchema

> `const` **ImportSessionsOutputSchema**: `ZodObject`\<\{ `errors`: `ZodArray`\<`ZodString`, `"many"`\>; `imported`: `ZodObject`\<\{ `commands`: `ZodNumber`; `fixes`: `ZodNumber`; `sessions`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}\>; `invalid`: `ZodObject`\<\{ `commands`: `ZodNumber`; `fixes`: `ZodNumber`; `sessions`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}\>; `schema_version`: `ZodNumber`; `skipped`: `ZodObject`\<\{ `commands`: `ZodNumber`; `fixes`: `ZodNumber`; `sessions`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}, \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}\>; `success`: `ZodBoolean`; \}, `"strip"`, `ZodTypeAny`, \{ `errors`: `string`[]; `imported`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `invalid`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `schema_version`: `number`; `skipped`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `success`: `boolean`; \}, \{ `errors`: `string`[]; `imported`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `invalid`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `schema_version`: `number`; `skipped`: \{ `commands`: `number`; `fixes`: `number`; `sessions`: `number`; \}; `success`: `boolean`; \}\>

Defined in: [src/types.ts:430](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/types.ts#L430)
