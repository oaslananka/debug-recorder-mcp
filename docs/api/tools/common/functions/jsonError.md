[**debug-recorder-mcp**](../../../README.md)

***

[debug-recorder-mcp](../../../README.md) / [tools/common](../README.md) / jsonError

# Function: jsonError()

> **jsonError**(`code`, `message`, `retryable`): [`JsonContentResponse`](../type-aliases/JsonContentResponse.md)

Defined in: [src/tools/common.ts:40](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/tools/common.ts#L40)

Returns a stable MCP tool execution error without escalating to a protocol error.

## Parameters

### code

`string`

### message

`string`

### retryable

`boolean`

## Returns

[`JsonContentResponse`](../type-aliases/JsonContentResponse.md)
