[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / StatsOutputSchema

# Variable: StatsOutputSchema

> `const` **StatsOutputSchema**: `ZodObject`\<\{ `abandoned`: `ZodNumber`; `byLanguage`: `ZodArray`\<`ZodObject`\<\{ `count`: `ZodNumber`; `language`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `count`: `number`; `language`: `string`; \}, \{ `count`: `number`; `language`: `string`; \}\>, `"many"`\>; `open`: `ZodNumber`; `resolutionRate`: `ZodNumber`; `resolved`: `ZodNumber`; `topErrorTypes`: `ZodArray`\<`ZodObject`\<\{ `count`: `ZodNumber`; `error_type`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `count`: `number`; `error_type`: `string`; \}, \{ `count`: `number`; `error_type`: `string`; \}\>, `"many"`\>; `total`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `abandoned`: `number`; `byLanguage`: `object`[]; `open`: `number`; `resolutionRate`: `number`; `resolved`: `number`; `topErrorTypes`: `object`[]; `total`: `number`; \}, \{ `abandoned`: `number`; `byLanguage`: `object`[]; `open`: `number`; `resolutionRate`: `number`; `resolved`: `number`; `topErrorTypes`: `object`[]; `total`: `number`; \}\>

Defined in: [src/types.ts:315](https://github.com/oaslananka/debug-recorder-mcp/blob/eaeaf2abae240f2833fa4c46001134355da6b484/src/types.ts#L315)
