[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ListSearchPresetsOutputSchema

# Variable: ListSearchPresetsOutputSchema

> `const` **ListSearchPresetsOutputSchema**: `ZodObject`\<\{ `count`: `ZodNumber`; `presets`: `ZodArray`\<`ZodObject`\<`Omit`\<\{ `created_at`: `ZodNumber`; `framework`: `ZodNullable`\<`ZodString`\>; `language`: `ZodNullable`\<`ZodString`\>; `limit_value`: `ZodNumber`; `name`: `ZodString`; `query`: `ZodString`; `status`: `ZodNullable`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; `updated_at`: `ZodNumber`; \}, `"limit_value"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `created_at`: `number`; `framework`: `string` \| `null`; `language`: `string` \| `null`; `limit`: `number`; `name`: `string`; `query`: `string`; `status`: `"open"` \| `"resolved"` \| `"abandoned"` \| `null`; `updated_at`: `number`; \}, \{ `created_at`: `number`; `framework`: `string` \| `null`; `language`: `string` \| `null`; `limit`: `number`; `name`: `string`; `query`: `string`; `status`: `"open"` \| `"resolved"` \| `"abandoned"` \| `null`; `updated_at`: `number`; \}\>, `"many"`\>; \}, `"strip"`, `ZodTypeAny`, \{ `count`: `number`; `presets`: `object`[]; \}, \{ `count`: `number`; `presets`: `object`[]; \}\>

Defined in: [src/types.ts:381](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/types.ts#L381)
