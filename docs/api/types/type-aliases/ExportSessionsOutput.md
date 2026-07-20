[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [types](../README.md) / ExportSessionsOutput

# Type Alias: ExportSessionsOutput

> **ExportSessionsOutput** = `object`

Defined in: [src/types.ts:478](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L478)

## Properties

### commands?

> `optional` **commands?**: [`CommandRow`](CommandRow.md)[]

Defined in: [src/types.ts:484](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L484)

***

### exported\_at

> **exported\_at**: `string`

Defined in: [src/types.ts:480](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L480)

***

### fixes?

> `optional` **fixes?**: [`FixRow`](FixRow.md)[]

Defined in: [src/types.ts:483](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L483)

***

### format

> **format**: `"json"` \| `"summary"`

Defined in: [src/types.ts:479](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L479)

***

### schema\_version

> **schema\_version**: `number`

Defined in: [src/types.ts:481](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L481)

***

### sessions

> **sessions**: [`SessionRow`](SessionRow.md)[] \| [`ExportSummarySession`](ExportSummarySession.md)[]

Defined in: [src/types.ts:482](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L482)

***

### stats?

> `optional` **stats?**: `z.infer`\<*typeof* [`StatsOutputSchema`](../variables/StatsOutputSchema.md)\>

Defined in: [src/types.ts:485](https://github.com/oaslananka/debug-recorder-mcp/blob/37f22a0ac98a3eb900098f4736a152fad3d1c609/src/types.ts#L485)
