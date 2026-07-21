[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / SessionRowSchema

# Variable: SessionRowSchema

> `const` **SessionRowSchema**: `ZodObject`\<\{ `closed_at`: `ZodNullable`\<`ZodNumber`\>; `created_at`: `ZodNumber`; `description`: `ZodNullable`\<`ZodString`\>; `environment`: `ZodNullable`\<`ZodString`\>; `error_message`: `ZodNullable`\<`ZodString`\>; `error_type`: `ZodNullable`\<`ZodString`\>; `framework`: `ZodNullable`\<`ZodString`\>; `id`: `ZodString`; `language`: `ZodNullable`\<`ZodString`\>; `stack_trace`: `ZodNullable`\<`ZodString`\>; `status`: `ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>; `tags`: `ZodString`; `title`: `ZodString`; `updated_at`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `closed_at`: `number` \| `null`; `created_at`: `number`; `description`: `string` \| `null`; `environment`: `string` \| `null`; `error_message`: `string` \| `null`; `error_type`: `string` \| `null`; `framework`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `stack_trace`: `string` \| `null`; `status`: `"open"` \| `"resolved"` \| `"abandoned"`; `tags`: `string`; `title`: `string`; `updated_at`: `number`; \}, \{ `closed_at`: `number` \| `null`; `created_at`: `number`; `description`: `string` \| `null`; `environment`: `string` \| `null`; `error_message`: `string` \| `null`; `error_type`: `string` \| `null`; `framework`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `stack_trace`: `string` \| `null`; `status`: `"open"` \| `"resolved"` \| `"abandoned"`; `tags`: `string`; `title`: `string`; `updated_at`: `number`; \}\>

Defined in: [src/types.ts:26](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L26)
