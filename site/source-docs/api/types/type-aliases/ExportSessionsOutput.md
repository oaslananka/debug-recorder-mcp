[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ExportSessionsOutput

# Type Alias: ExportSessionsOutput

> **ExportSessionsOutput** = `object`

Defined in: [src/types.ts:501](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L501)

## Properties

### commands?

> `optional` **commands?**: [`CommandRow`](CommandRow.md)[]

Defined in: [src/types.ts:508](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L508)

***

### exported\_at

> **exported\_at**: `string`

Defined in: [src/types.ts:503](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L503)

***

### fixes?

> `optional` **fixes?**: [`FixRow`](FixRow.md)[]

Defined in: [src/types.ts:507](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L507)

***

### format

> **format**: `"json"` \| `"summary"`

Defined in: [src/types.ts:502](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L502)

***

### format\_version

> **format\_version**: *typeof* [`BACKUP_FORMAT_VERSION`](../variables/BACKUP_FORMAT_VERSION.md)

Defined in: [src/types.ts:504](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L504)

***

### saved\_search\_presets?

> `optional` **saved\_search\_presets?**: [`SavedSearchPresetRow`](SavedSearchPresetRow.md)[]

Defined in: [src/types.ts:509](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L509)

***

### schema\_version

> **schema\_version**: `number`

Defined in: [src/types.ts:505](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L505)

***

### sessions

> **sessions**: [`SessionRow`](SessionRow.md)[] \| [`ExportSummarySession`](ExportSummarySession.md)[]

Defined in: [src/types.ts:506](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L506)

***

### stats?

> `optional` **stats?**: `z.infer`\<*typeof* [`StatsOutputSchema`](../variables/StatsOutputSchema.md)\>

Defined in: [src/types.ts:510](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/types.ts#L510)
