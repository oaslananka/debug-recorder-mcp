[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [store](../README.md) / Store

# Class: Store

Defined in: [src/store.ts:200](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L200)

## Constructors

### Constructor

> **new Store**(`db`, `runtimeConfig?`): `Store`

Defined in: [src/store.ts:201](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L201)

#### Parameters

##### db

`Database`

##### runtimeConfig?

`RuntimeConfig` = `...`

#### Returns

`Store`

## Methods

### addFix()

> **addFix**(`data`): `object`

Defined in: [src/store.ts:468](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L468)

#### Parameters

##### data

###### code_snippet?

`string` = `...`

###### description

`string` = `...`

###### notes?

`string` = `...`

###### session_id

`string` = `...`

###### worked

`boolean` = `...`

#### Returns

`object`

##### id

> **id**: `string`

***

### close()

> **close**(): `void`

Defined in: [src/store.ts:237](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L237)

#### Returns

`void`

***

### closeSession()

> **closeSession**(`data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:539](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L539)

#### Parameters

##### data

###### session_id

`string` = `...`

###### status

`"resolved"` \| `"abandoned"` = `...`

###### summary?

`string` = `...`

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### createSession()

> **createSession**(`data`): [`Session`](../../types/type-aliases/Session.md)

Defined in: [src/store.ts:317](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L317)

#### Parameters

##### data

###### description?

`string` = `...`

###### environment?

`string` = `...`

###### error_message?

`string` = `...`

###### error_type?

`string` = `...`

###### framework?

`string` = `...`

###### language?

`string` = `...`

###### stack_trace?

`string` = `...`

###### tags

`string`[] = `...`

###### title

`string` = `...`

#### Returns

[`Session`](../../types/type-aliases/Session.md)

***

### deleteSession()

> **deleteSession**(`id`): `boolean`

Defined in: [src/store.ts:436](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L436)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### exportAll()

> **exportAll**(): `object`

Defined in: [src/store.ts:633](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L633)

#### Returns

`object`

##### commands

> **commands**: `object`[]

##### exported\_at?

> `optional` **exported\_at?**: `string`

##### fixes

> **fixes**: `object`[]

##### format\_version?

> `optional` **format\_version?**: `number`

##### saved\_search\_presets?

> `optional` **saved\_search\_presets?**: `object`[]

##### schema\_version

> **schema\_version**: `number`

##### sessions

> **sessions**: `object`[]

***

### getRuntimeConfig()

> **getRuntimeConfig**(): `Readonly`\<`RuntimeConfig`\>

Defined in: [src/store.ts:206](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L206)

#### Returns

`Readonly`\<`RuntimeConfig`\>

***

### getSession()

> **getSession**(`id`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:351](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L351)

#### Parameters

##### id

`string`

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### getSessionsByIds()

> **getSessionsByIds**(`ids`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:377](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L377)

#### Parameters

##### ids

`string`[]

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### getStats()

> **getStats**(): `object`

Defined in: [src/store.ts:573](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L573)

#### Returns

`object`

##### abandoned

> **abandoned**: `number`

##### byLanguage

> **byLanguage**: `object`[]

##### open

> **open**: `number`

##### resolutionRate

> **resolutionRate**: `number`

##### resolved

> **resolved**: `number`

##### topErrorTypes

> **topErrorTypes**: `object`[]

##### total

> **total**: `number`

***

### importAll()

> **importAll**(`payload`, `options?`): [`ImportResult`](../../types/type-aliases/ImportResult.md)

Defined in: [src/store.ts:654](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L654)

#### Parameters

##### payload

`unknown`

##### options?

###### skipExisting?

`boolean`

#### Returns

[`ImportResult`](../../types/type-aliases/ImportResult.md)

***

### listSearchPresets()

> **listSearchPresets**(): [`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)[]

Defined in: [src/store.ts:288](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L288)

#### Returns

[`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)[]

***

### listSessions()

> **listSessions**(`options`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:441](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L441)

#### Parameters

##### options

[`SessionListOptions`](../type-aliases/SessionListOptions.md)

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### recordCommand()

> **recordCommand**(`data`): `object`

Defined in: [src/store.ts:510](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L510)

#### Parameters

##### data

###### command

`string` = `...`

###### exit_code?

`number` = `...`

###### output?

`string` = `...`

###### session_id

`string` = `...`

#### Returns

`object`

##### id

> **id**: `string`

***

### removeSearchPreset()

> **removeSearchPreset**(`name`): `boolean`

Defined in: [src/store.ts:298](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L298)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### saveSearchPreset()

> **saveSearchPreset**(`data`): [`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)

Defined in: [src/store.ts:251](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L251)

#### Parameters

##### data

###### framework?

`string` = `...`

###### language?

`string` = `...`

###### limit

`number` = `...`

###### name

`string` = `...`

###### query

`string` = `...`

###### status?

`"open"` \| `"resolved"` \| `"abandoned"` = `...`

#### Returns

[`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)

***

### setRemoteHttpEnabled()

> **setRemoteHttpEnabled**(`enabled`): `void`

Defined in: [src/store.ts:210](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L210)

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### updateSession()

> **updateSession**(`id`, `data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:405](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L405)

#### Parameters

##### id

`string`

##### data

`Pick`\<[`UpdateSession`](../../types/type-aliases/UpdateSession.md), `"title"` \| `"description"` \| `"tags"`\>

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### create()

> `static` **create**(`dbPath?`): `Store`

Defined in: [src/store.ts:233](https://github.com/oaslananka/debug-recorder-mcp/blob/74abd4e988b917f2d222f04dd5173d4dcc8d7a4d/src/store.ts#L233)

#### Parameters

##### dbPath?

`string`

#### Returns

`Store`
