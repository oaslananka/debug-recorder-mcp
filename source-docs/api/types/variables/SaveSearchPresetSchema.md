[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / SaveSearchPresetSchema

# Variable: SaveSearchPresetSchema

> `const` **SaveSearchPresetSchema**: `ZodObject`\<`Omit`\<\{ `framework`: `ZodOptional`\<`ZodString`\>; `include_related`: `ZodDefault`\<`ZodBoolean`\>; `language`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `markdown`: `ZodDefault`\<`ZodBoolean`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `query`: `ZodString`; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"resolved"`, `"abandoned"`\]\>\>; \}, `"offset"` \| `"include_related"` \| `"markdown"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `name`: `string`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}, \{ `framework?`: `string`; `language?`: `string`; `limit?`: `number`; `name`: `string`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

Defined in: [src/types.ts:178](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/types.ts#L178)
