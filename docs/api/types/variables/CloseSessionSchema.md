[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / CloseSessionSchema

# Variable: CloseSessionSchema

> `const` **CloseSessionSchema**: `ZodObject`\<\{ `session_id`: `ZodString`; `status`: `ZodEnum`\<\[`"resolved"`, `"abandoned"`\]\>; `summary`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

Defined in: [src/types.ts:167](https://github.com/oaslananka/debug-recorder-mcp/blob/436dcb9a64584c03a54058180f18c25ae0e6c347/src/types.ts#L167)
