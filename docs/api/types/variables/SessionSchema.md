[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / SessionSchema

# Variable: SessionSchema

> `const` **SessionSchema**: `ZodObject`\<`Omit`\<\{ `created_at`: `ZodNumber`; `description`: `ZodNullable`\<`ZodString`\>; `environment`: `ZodNullable`\<`ZodString`\>; `error_message`: `ZodNullable`\<`ZodString`\>; `error_type`: `ZodNullable`\<`ZodString`\>; `framework`: `ZodNullable`\<`ZodString`\>; `id`: `ZodString`; `language`: `ZodNullable`\<`ZodString`\>; `stack_trace`: `ZodNullable`\<`ZodString`\>; `status`: `ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>; `tags`: `ZodString`; `title`: `ZodString`; `updated_at`: `ZodNumber`; \}, `"tags"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `commands`: `object`[]; `created_at`: `number`; `description`: `string` \| `null`; `environment`: `string` \| `null`; `error_message`: `string` \| `null`; `error_type`: `string` \| `null`; `fixes`: `object`[]; `framework`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `stack_trace`: `string` \| `null`; `status`: `"open"` \| `"resolved"` \| `"abandoned"`; `tags`: `string`[]; `title`: `string`; `updated_at`: `number`; \}, \{ `commands`: `object`[]; `created_at`: `number`; `description`: `string` \| `null`; `environment`: `string` \| `null`; `error_message`: `string` \| `null`; `error_type`: `string` \| `null`; `fixes`: `object`[]; `framework`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `stack_trace`: `string` \| `null`; `status`: `"open"` \| `"resolved"` \| `"abandoned"`; `tags`: `string`[]; `title`: `string`; `updated_at`: `number`; \}\>

Defined in: [src/types.ts:303](https://github.com/oaslananka/debug-recorder-mcp/blob/20272cd1072b6aef857877584767083da479c64b/src/types.ts#L303)
