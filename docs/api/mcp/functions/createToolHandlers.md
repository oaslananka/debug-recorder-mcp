[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [mcp](../README.md) / createToolHandlers

# Function: createToolHandlers()

> **createToolHandlers**(`runtime`): `object`

Defined in: [src/mcp.ts:96](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/mcp.ts#L96)

## Parameters

### runtime

[`DebugRecorderRuntime`](../type-aliases/DebugRecorderRuntime.md)

## Returns

`object`

### handleAddFix

> **handleAddFix**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `code_snippet?`: `string`; `description`: `string`; `notes?`: `string`; `session_id`: `string`; `worked`: `boolean`; \}\>

### handleCloseSession

> **handleCloseSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

### handleDeleteSearchPreset

> **handleDeleteSearchPreset**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `name`: `string`; \}\>

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

### handleListSearchPresets

> **handleListSearchPresets**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ \}\>

### handleListSessions

> **handleListSessions**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleRecordCommand

> **handleRecordCommand**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `command`: `string`; `exit_code?`: `number`; `output?`: `string`; `session_id`: `string`; \}\>

### handleSaveSearchPreset

> **handleSaveSearchPreset**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `name`: `string`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleSearchSessions

> **handleSearchSessions**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `framework?`: `string`; `include_related`: `boolean`; `language?`: `string`; `limit`: `number`; `markdown`: `boolean`; `offset`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleStartDebugSession

> **handleStartDebugSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `description?`: `string`; `environment?`: `string`; `error_message?`: `string`; `error_type?`: `string`; `framework?`: `string`; `language?`: `string`; `stack_trace?`: `string`; `tags`: `string`[]; `title`: `string`; \}\>

### handleUpdateSession

> **handleUpdateSession**: [`ToolHandler`](../../tools/common/type-aliases/ToolHandler.md)\<\{ `description?`: `string`; `session_id`: `string`; `tags?`: `string`[]; `title?`: `string`; \}\>
