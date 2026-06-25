[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [store](../README.md) / Store

# Class: Store

Defined in: [src/store.ts:158](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L158)

## Constructors

### Constructor

> **new Store**(`db`): `Store`

Defined in: [src/store.ts:159](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L159)

#### Parameters

##### db

`Database`

#### Returns

`Store`

## Methods

### addFix()

> **addFix**(`data`): `object`

Defined in: [src/store.ts:396](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L396)

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

Defined in: [src/store.ts:165](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L165)

#### Returns

`void`

***

### closeSession()

> **closeSession**(`data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:461](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L461)

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

Defined in: [src/store.ts:245](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L245)

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

Defined in: [src/store.ts:364](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L364)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### exportAll()

> **exportAll**(): `object`

Defined in: [src/store.ts:551](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L551)

#### Returns

`object`

##### commands

> **commands**: `object`[]

##### exported\_at?

> `optional` **exported\_at?**: `string`

##### fixes

> **fixes**: `object`[]

##### schema\_version

> **schema\_version**: `number`

##### sessions

> **sessions**: `object`[]

***

### getSession()

> **getSession**(`id`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:279](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L279)

#### Parameters

##### id

`string`

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### getSessionsByIds()

> **getSessionsByIds**(`ids`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:305](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L305)

#### Parameters

##### ids

`string`[]

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### getStats()

> **getStats**(): `object`

Defined in: [src/store.ts:491](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L491)

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

Defined in: [src/store.ts:568](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L568)

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

Defined in: [src/store.ts:216](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L216)

#### Returns

[`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)[]

***

### listSessions()

> **listSessions**(`options`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:369](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L369)

#### Parameters

##### options

[`SessionListOptions`](../type-aliases/SessionListOptions.md)

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### recordCommand()

> **recordCommand**(`data`): `object`

Defined in: [src/store.ts:432](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L432)

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

Defined in: [src/store.ts:226](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L226)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### saveSearchPreset()

> **saveSearchPreset**(`data`): [`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)

Defined in: [src/store.ts:179](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L179)

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

### updateSession()

> **updateSession**(`id`, `data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:333](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L333)

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

Defined in: [src/store.ts:161](https://github.com/oaslananka/debug-recorder-mcp/blob/bf8478621114629a7dfe49a90fef7201a15281f3/src/store.ts#L161)

#### Parameters

##### dbPath?

`string`

#### Returns

`Store`
