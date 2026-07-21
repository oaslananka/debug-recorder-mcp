[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / CloseSessionSchema

# Variable: CloseSessionSchema

> `const` **CloseSessionSchema**: `ZodObject`\<\{ `session_id`: `ZodString`; `status`: `ZodEnum`\<\[`"resolved"`, `"abandoned"`\]\>; `summary`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

Defined in: [src/types.ts:225](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L225)
