[**debug-recorder-mcp**](../../README.md)

***

[debug-recorder-mcp](../../README.md) / [store](../README.md) / Store

# Class: Store

Defined in: [src/store.ts:141](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L141)

## Constructors

### Constructor

> **new Store**(`db`): `Store`

Defined in: [src/store.ts:142](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L142)

#### Parameters

##### db

`Database`

#### Returns

`Store`

## Methods

### addFix()

> **addFix**(`data`): `object`

Defined in: [src/store.ts:311](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L311)

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

Defined in: [src/store.ts:148](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L148)

#### Returns

`void`

***

### closeSession()

> **closeSession**(`data`): [`Session`](../../types/type-aliases/Session.md) \| `null`

Defined in: [src/store.ts:376](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L376)

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

Defined in: [src/store.ts:162](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L162)

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

Defined in: [src/store.ts:279](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L279)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### exportAll()

> **exportAll**(): `object`

Defined in: [src/store.ts:466](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L466)

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

Defined in: [src/store.ts:194](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L194)

#### Parameters

##### id

`string`

#### Returns

[`Session`](../../types/type-aliases/Session.md) \| `null`

***

### getSessionsByIds()

> **getSessionsByIds**(`ids`): [`Session`](../../types/type-aliases/Session.md)[]

Defined in: [src/store.ts:220](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L220)

#### Parameters

##### ids

`string`[]

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### getStats()

> **getStats**(): `object`

Defined in: [src/store.ts:406](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L406)

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

Defined in: [src/store.ts:481](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L481)

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

Defined in: [src/store.ts:284](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L284)

#### Parameters

##### options

[`SessionListOptions`](../type-aliases/SessionListOptions.md)

#### Returns

[`Session`](../../types/type-aliases/Session.md)[]

***

### recordCommand()

> **recordCommand**(`data`): `object`

Defined in: [src/store.ts:347](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L347)

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

Defined in: [src/store.ts:248](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L248)

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

Defined in: [src/store.ts:144](https://github.com/oaslananka/debug-recorder-mcp/blob/c44ef35e21165f8448f11e1853bea59f1948a373/src/store.ts#L144)

#### Parameters

##### dbPath?

`string`

#### Returns

`Store`
