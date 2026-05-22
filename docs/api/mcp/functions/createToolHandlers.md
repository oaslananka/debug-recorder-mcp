[**mcp-debug-recorder**](../../README.md)

***

[mcp-debug-recorder](../../README.md) / [mcp](../README.md) / createToolHandlers

# Function: createToolHandlers()

> **createToolHandlers**(`runtime`): `object`

Defined in: mcp.ts:76

## Parameters

### runtime

[`DebugRecorderRuntime`](../type-aliases/DebugRecorderRuntime.md)

## Returns

`object`

### handleAddFix

> **handleAddFix**: `ToolHandler`\<\{ `code_snippet?`: `string`; `description`: `string`; `notes?`: `string`; `session_id`: `string`; `worked`: `boolean`; \}\>

### handleCloseSession

> **handleCloseSession**: `ToolHandler`\<\{ `session_id`: `string`; `status`: `"resolved"` \| `"abandoned"`; `summary?`: `string`; \}\>

### handleDeleteSession

> **handleDeleteSession**: `ToolHandler`\<\{ `confirm`: `boolean`; `session_id`: `string`; \}\>

### handleExportSessions

> **handleExportSessions**: `ToolHandler`\<\{ `format`: `"summary"` \| `"json"`; \}\>

### handleFindSimilarErrors

> **handleFindSimilarErrors**: `ToolHandler`\<\{ `error_message`: `string`; `limit`: `number`; \}\>

### handleGetSession

> **handleGetSession**: `ToolHandler`\<\{ `session_id`: `string`; \}\>

### handleGetSessionContext

> **handleGetSessionContext**: `ToolHandler`\<\{ `include_commands`: `boolean`; `include_fixes`: `boolean`; `session_id`: `string`; \}\>

### handleGetStats

> **handleGetStats**: `ToolHandler`\<\{ \}\>

### handleImportSessions

> **handleImportSessions**: `ToolHandler`\<\{ `payload`: \{ `commands`: `object`[]; `exported_at?`: `string`; `fixes`: `object`[]; `schema_version`: `number`; `sessions`: `object`[]; \}; `skip_existing`: `boolean`; \}\>

### handleListSessions

> **handleListSessions**: `ToolHandler`\<\{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleRecordCommand

> **handleRecordCommand**: `ToolHandler`\<\{ `command`: `string`; `exit_code?`: `number`; `output?`: `string`; `session_id`: `string`; \}\>

### handleSearchSessions

> **handleSearchSessions**: `ToolHandler`\<\{ `framework?`: `string`; `language?`: `string`; `limit`: `number`; `query`: `string`; `status?`: `"open"` \| `"resolved"` \| `"abandoned"`; \}\>

### handleStartDebugSession

> **handleStartDebugSession**: `ToolHandler`\<\{ `description?`: `string`; `environment?`: `string`; `error_message?`: `string`; `error_type?`: `string`; `framework?`: `string`; `language?`: `string`; `stack_trace?`: `string`; `tags`: `string`[]; `title`: `string`; \}\>

### handleUpdateSession

> **handleUpdateSession**: `ToolHandler`\<\{ `description?`: `string`; `session_id`: `string`; `tags?`: `string`[]; `title?`: `string`; \}\>
