[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / SearchSchema

# Variable: SearchSchema

> `const` **SearchSchema**: `ZodObject`\<\{ `framework`: `ZodOptional`\<`ZodString`\>; `include_related`: `ZodDefault`\<`ZodBoolean`\>; `language`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `markdown`: `ZodDefault`\<`ZodBoolean`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `query`: `ZodString`; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `framework?`: `string`; `include_related`: `boolean`; `language?`: `string`; `limit`: `number`; `markdown`: `boolean`; `offset`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}, \{ `framework?`: `string`; `include_related?`: `boolean`; `language?`: `string`; `limit?`: `number`; `markdown?`: `boolean`; `offset?`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

Defined in: [src/types.ts:141](https://github.com/oaslananka/debug-recorder-mcp/blob/db069172722fcdb669db6000d02e911ac45c5911/src/types.ts#L141)
