[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [mcp](../README.md) / createToolHandlers

# Function: createToolHandlers()

> **createToolHandlers**(`runtime`): `object`

Defined in: [src/mcp.ts:76](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/mcp.ts#L76)

## Parameters

### runtime

[`DebugRecorderRuntime`](../type-aliases/DebugRecorderRuntime.md)

## Returns

`object`

### handleAddFix

> **handleAddFix**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `code_snippet?`: `string`; `description`: `string`; `notes?`: `string`; `session_id`: `string`; `worked`: `boolean`; \}\>

### handleCloseSession

> **handleCloseSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

### handleDeleteSession

> **handleDeleteSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `confirm`: `boolean`; `session_id`: `string`; \}\>

### handleExportSessions

> **handleExportSessions**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `format`: `"summary"` \| `"json"`; \}\>

### handleFindSimilarErrors

> **handleFindSimilarErrors**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `error_message`: `string`; `limit`: `number`; \}\>

### handleGetSession

> **handleGetSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `session_id`: `string`; \}\>

### handleGetSessionContext

> **handleGetSessionContext**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `include_commands`: `boolean`; `include_fixes`: `boolean`; `session_id`: `string`; \}\>

### handleGetStats

> **handleGetStats**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ \}\>

### handleImportSessions

> **handleImportSessions**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `payload`: \{ `commands`: `object`[]; `exported_at?`: `string`; `fixes`: `object`[]; `schema_version`: `number`; `sessions`: `object`[]; \}; `skip_existing`: `boolean`; \}\>

### handleListSessions

> **handleListSessions**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleRecordCommand

> **handleRecordCommand**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `command`: `string`; `exit_code?`: `number`; `output?`: `string`; `session_id`: `string`; \}\>

### handleSearchSessions

> **handleSearchSessions**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleStartDebugSession

> **handleStartDebugSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `description?`: `string`; `environment?`: `string`; `error_message?`: `string`; `error_type?`: `string`; `framework?`: `string`; `language?`: `string`; `stack_trace?`: `string`; `tags`: `string`[]; `title`: `string`; \}\>

### handleUpdateSession

> **handleUpdateSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `description?`: `string`; `session_id`: `string`; `tags?`: `string`[]; `title?`: `string`; \}\>
