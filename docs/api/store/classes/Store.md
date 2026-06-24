[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [store](../README.md) / Store

# Class: Store

Defined in: [src/store.ts:157](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L157)

## Constructors

### Constructor

> **new Store**(`db`): `Store`

Defined in: [src/store.ts:158](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L158)

#### Parameters

##### db

`Database`

#### Returns

`Store`

## Methods

### addFix()

> **addFix**(`data`): `object`

Defined in: [src/store.ts:393](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L393)

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

Defined in: [src/store.ts:164](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L164)

#### Returns

`void`

***

### closeSession()

> **closeSession**(`data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:458](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L458)

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

Defined in: [src/store.ts:244](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L244)

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

Defined in: [src/store.ts:361](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L361)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### exportAll()

> **exportAll**(): `object`

Defined in: [src/store.ts:548](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L548)

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

Defined in: [src/store.ts:276](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L276)

#### Parameters

##### id

`string`

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### getSessionsByIds()

> **getSessionsByIds**(`ids`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:302](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L302)

#### Parameters

##### ids

`string`[]

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### getStats()

> **getStats**(): `object`

Defined in: [src/store.ts:488](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L488)

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

Defined in: [src/store.ts:563](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L563)

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

Defined in: [src/store.ts:215](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L215)

#### Returns

[`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)[]

***

### listSessions()

> **listSessions**(`options`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:366](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L366)

#### Parameters

##### options

[`SessionListOptions`](../type-aliases/SessionListOptions.md)

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### recordCommand()

> **recordCommand**(`data`): `object`

Defined in: [src/store.ts:429](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L429)

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

Defined in: [src/store.ts:225](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L225)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### saveSearchPreset()

> **saveSearchPreset**(`data`): [`SavedSearchPreset`](../../types/type-aliases/SavedSearchPreset.md)

Defined in: [src/store.ts:178](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L178)

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

Defined in: [src/store.ts:330](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L330)

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

Defined in: [src/store.ts:160](https://github.com/oaslananka/debug-recorder-mcp/blob/46c4a351259c4962c63c7d0b879764f0bddb48aa/src/store.ts#L160)

#### Parameters

##### dbPath?

`string`

#### Returns

`Store`
