[**mcp-debug-recorder**](../../README.md)

***

[mcp-debug-recorder](../../README.md) / [store](../README.md) / Store

# Class: Store

Defined in: store.ts:81

## Constructors

### Constructor

> **new Store**(`db`): `Store`

Defined in: store.ts:82

#### Parameters

##### db

`Database`

#### Returns

`Store`

## Methods

### addFix()

> **addFix**(`data`): `object`

Defined in: store.ts:239

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

Defined in: store.ts:88

#### Returns

`void`

***

### closeSession()

> **closeSession**(`data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: store.ts:300

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

Defined in: store.ts:92

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

Defined in: store.ts:207

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### exportAll()

> **exportAll**(): `object`

Defined in: store.ts:382

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

Defined in: store.ts:124

#### Parameters

##### id

`string`

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### getSessionsByIds()

> **getSessionsByIds**(`ids`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: store.ts:150

#### Parameters

##### ids

`string`[]

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### getStats()

> **getStats**(): `object`

Defined in: store.ts:322

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

Defined in: store.ts:397

#### Parameters

##### payload

`unknown`

##### options?

###### skipExisting?

`boolean`

#### Returns

[`ImportResult`](../../types/type-aliases/ImportResult.md)

***

### listSessions()

> **listSessions**(`options`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: store.ts:212

#### Parameters

##### options

`SessionListOptions`

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### recordCommand()

> **recordCommand**(`data`): `object`

Defined in: store.ts:273

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

### updateSession()

> **updateSession**(`id`, `data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: store.ts:178

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

Defined in: store.ts:84

#### Parameters

##### dbPath?

`string`

#### Returns

`Store`
