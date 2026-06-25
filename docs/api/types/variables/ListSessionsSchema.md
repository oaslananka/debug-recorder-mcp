[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ListSessionsSchema

# Variable: ListSessionsSchema

> `const` **ListSessionsSchema**: `ZodObject`\<\{ `framework`: `ZodOptional`\<`ZodString`\>; `language`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}, \{ `framework?`: `string`; `language?`: `string`; `limit?`: `number`; `offset?`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

Defined in: [src/types.ts:255](https://github.com/oaslananka/debug-recorder-mcp/blob/db069172722fcdb669db6000d02e911ac45c5911/src/types.ts#L255)
