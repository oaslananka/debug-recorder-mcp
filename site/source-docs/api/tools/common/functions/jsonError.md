[**debug-recorder-mcp**](../../../README.md)

***

[debug-recorder-mcp](../../../README.md) / [tools/common](../README.md) / jsonError

# Function: jsonError()

> **jsonError**(`code`, `message`, `retryable`): [`JsonContentResponse`](../type-aliases/JsonContentResponse.md)

Defined in: [src/tools/common.ts:40](https://github.com/oaslananka/debug-recorder-mcp/blob/a890b01b46a36799fece7957156737bcb5290523/src/tools/common.ts#L40)

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
