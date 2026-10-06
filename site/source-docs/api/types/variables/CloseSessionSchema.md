[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / CloseSessionSchema

# Variable: CloseSessionSchema

> `const` **CloseSessionSchema**: `ZodObject`\<\{ `session_id`: `ZodString`; `status`: `ZodEnum`\<\[`"resolved"`, `"abandoned"`\]\>; `summary`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}, \{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

Defined in: [src/types.ts:225](https://github.com/oaslananka/debug-recorder-mcp/blob/a890b01b46a36799fece7957156737bcb5290523/src/types.ts#L225)
