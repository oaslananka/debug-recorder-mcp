[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ListSessionsOutputSchema

# Variable: ListSessionsOutputSchema

> `const` **ListSessionsOutputSchema**: `ZodObject`\<\{ `count`: `ZodNumber`; `sessions`: `ZodArray`\<`ZodObject`\<`Omit`\<\{ `created_at`: `ZodNumber`; `description`: `ZodNullable`\<`ZodString`\>; `environment`: `ZodNullable`\<`ZodString`\>; `error_message`: `ZodNullable`\<`ZodString`\>; `error_type`: `ZodNullable`\<`ZodString`\>; `framework`: `ZodNullable`\<`ZodString`\>; `id`: `ZodString`; `language`: `ZodNullable`\<`ZodString`\>; `stack_trace`: `ZodNullable`\<`ZodString`\>; `status`: `ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>; `tags`: `ZodString`; `title`: `ZodString`; `updated_at`: `ZodNumber`; \}, `"tags"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `commands`: `object`[]; `created_at`: `number`; `description`: `string` \| `null`; `environment`: `string` \| `null`; `error_message`: `string` \| `null`; `error_type`: `string` \| `null`; `fixes`: `object`[]; `framework`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `stack_trace`: `string` \| `null`; `status`: `"open"` \| `"resolved"` \| `"abandoned"`; `tags`: `string`[]; `title`: `string`; `updated_at`: `number`; \}, \{ `commands`: `object`[]; `created_at`: `number`; `description`: `string` \| `null`; `environment`: `string` \| `null`; `error_message`: `string` \| `null`; `error_type`: `string` \| `null`; `fixes`: `object`[]; `framework`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `stack_trace`: `string` \| `null`; `status`: `"open"` \| `"resolved"` \| `"abandoned"`; `tags`: `string`[]; `title`: `string`; `updated_at`: `number`; \}\>, `"many"`\>; \}, `"strip"`, `ZodTypeAny`, \{ `count`: `number`; `sessions`: `object`[]; \}, \{ `count`: `number`; `sessions`: `object`[]; \}\>

Defined in: [src/types.ts:447](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/types.ts#L447)
