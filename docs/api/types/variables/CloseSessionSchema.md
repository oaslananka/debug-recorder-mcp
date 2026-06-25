[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / CloseSessionSchema

# Variable: CloseSessionSchema

> `const` **CloseSessionSchema**: `ZodObject`\<\{ `session_id`: `ZodString`; `status`: `ZodEnum`\<\[`"resolved"`, `"abandoned"`\]\>; `summary`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

Defined in: [src/types.ts:219](https://github.com/oaslananka/debug-recorder-mcp/blob/eaeaf2abae240f2833fa4c46001134355da6b484/src/types.ts#L219)
