[**mcp-debug-recorder**](../../README.md)

***

[mcp-debug-recorder](../../README.md) / [types](../README.md) / ListSessionsSchema

# Variable: ListSessionsSchema

> `const` **ListSessionsSchema**: `ZodObject`\<\{ `framework`: `ZodOptional`\<`ZodString`\>; `language`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}, \{ `framework?`: `string`; `language?`: `string`; `limit?`: `number`; `offset?`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

Defined in: types.ts:129
