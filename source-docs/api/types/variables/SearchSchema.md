[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / SearchSchema

# Variable: SearchSchema

> `const` **SearchSchema**: `ZodObject`\<\{ `framework`: `ZodOptional`\<`ZodString`\>; `include_related`: `ZodDefault`\<`ZodBoolean`\>; `language`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `markdown`: `ZodDefault`\<`ZodBoolean`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `query`: `ZodString`; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `framework?`: `string`; `include_related`: `boolean`; `language?`: `string`; `limit`: `number`; `markdown`: `boolean`; `offset`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}, \{ `framework?`: `string`; `include_related?`: `boolean`; `language?`: `string`; `limit?`: `number`; `markdown?`: `boolean`; `offset?`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

Defined in: [src/types.ts:147](https://github.com/oaslananka/debug-recorder-mcp/blob/a890b01b46a36799fece7957156737bcb5290523/src/types.ts#L147)
