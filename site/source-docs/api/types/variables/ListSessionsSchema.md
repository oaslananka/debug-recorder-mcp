[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ListSessionsSchema

# Variable: ListSessionsSchema

> `const` **ListSessionsSchema**: `ZodObject`\<\{ `framework`: `ZodOptional`\<`ZodString`\>; `language`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}, \{ `framework?`: `string`; `language?`: `string`; `limit?`: `number`; `offset?`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

Defined in: [src/types.ts:255](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/types.ts#L255)
