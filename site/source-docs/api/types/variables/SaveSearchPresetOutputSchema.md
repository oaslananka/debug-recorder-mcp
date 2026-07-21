[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / SaveSearchPresetOutputSchema

# Variable: SaveSearchPresetOutputSchema

> `const` **SaveSearchPresetOutputSchema**: `ZodObject`\<\{ `preset`: `ZodObject`\<`Omit`\<\{ `created_at`: `ZodNumber`; `framework`: `ZodNullable`\<`ZodString`\>; `language`: `ZodNullable`\<`ZodString`\>; `limit_value`: `ZodNumber`; `name`: `ZodString`; `query`: `ZodString`; `status`: `ZodNullable`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; `updated_at`: `ZodNumber`; \}, `"limit_value"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `created_at`: `number`; `framework`: `string` \| `null`; `language`: `string` \| `null`; `limit`: `number`; `name`: `string`; `query`: `string`; `status`: `"open"` \| `"resolved"` \| `"abandoned"` \| `null`; `updated_at`: `number`; \}, \{ `created_at`: `number`; `framework`: `string` \| `null`; `language`: `string` \| `null`; `limit`: `number`; `name`: `string`; `query`: `string`; `status`: `"open"` \| `"resolved"` \| `"abandoned"` \| `null`; `updated_at`: `number`; \}\>; `success`: `ZodBoolean`; \}, `"strip"`, `ZodTypeAny`, \{ `preset`: \{ `created_at`: `number`; `framework`: `string` \| `null`; `language`: `string` \| `null`; `limit`: `number`; `name`: `string`; `query`: `string`; `status`: `"open"` \| `"resolved"` \| `"abandoned"` \| `null`; `updated_at`: `number`; \}; `success`: `boolean`; \}, \{ `preset`: \{ `created_at`: `number`; `framework`: `string` \| `null`; `language`: `string` \| `null`; `limit`: `number`; `name`: `string`; `query`: `string`; `status`: `"open"` \| `"resolved"` \| `"abandoned"` \| `null`; `updated_at`: `number`; \}; `success`: `boolean`; \}\>

Defined in: [src/types.ts:429](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L429)
