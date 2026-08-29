# Finding

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### all()

The `all` method returns the underlying array or object represented by
the collection. Array-backed collections return an array, while
associative collections return a plain object.

For an array collection:

```typescript
collect([1, 2, 3]).all()
// → [1, 2, 3]
```

For an associative collection:

```typescript
collect({ name: 'Taylor', role: 'admin' }).all()
// → { name: 'Taylor', role: 'admin' }
```

For always getting an array, use [`toArray`](/collections/aggregating#toarray). For Static version, use [`unwrap`](/collections/creating#unwrap).

---

### get()

The `get` method returns the item at a given key. If the key does not
exist, `undefined` is returned. You may optionally pass a default value
as the second argument, or a callback that returns the default.

```typescript
collect({ name: 'Taylor', role: 'admin' }).get('name')
// → 'Taylor'
```

You may pass a default value:

```typescript
collect({ name: 'Taylor' }).get('role', 'guest')
// → 'guest'
```

Or pass a callback that returns the default:

```typescript
collect({ name: 'Taylor' }).get('role', () => computeDefault())
// → result of computeDefault()
```

For Get or store a default value, use [`getOrPut`](#getorput). For Remove and return an item by key, use [`pull`](#pull).

---

### getOrPut()

The `getOrPut` method retrieves an item by key. If the key does not exist,
the default value is stored in the collection and returned. This is useful
for lazily populating collection values.

```typescript
const data = collect({ a: 1 })
data.getOrPut('b', 2)
// → 2
data.all()
// → { a: 1, b: 2 }
```

You may also pass a factory function:

```typescript
data.getOrPut('expensive', () => computeExpensiveValue())
// → computed value (only computed if key missing)
```

For Get without storing a default, use [`get`](#get). For Store a value at a key, use [`put`](/collections/combining#put).

---

### first()

The `first` method returns the first element in the collection that passes a given truth test.

You may also call the method with no arguments to get the first element. If the collection
is empty, the default value or undefined is returned.

```typescript
collect([1, 2, 3])
    .first()
// → 1
```

You may also pass a callback:

```typescript
collect([1, 2, 3, 4])
    .first(n => n > 2)
// → 3
```

You may also pass a default:

```typescript
collect([])
    .first(null, 'default')
// → 'default'
```

For Get the last item instead, use [`last`](#last). For throwing when no item found, use [`firstOrFail`](#firstorfail).

---

### last()

The `last` method returns the last element in the collection that passes a given truth test.

You may also call the method with no arguments to get the last element. If the collection
is empty, the default value or undefined is returned.

```typescript
collect([1, 2, 3])
    .last()
// → 3
```

You may also pass a callback:

```typescript
collect([1, 2, 3, 4])
    .last(n => n < 3)
// → 2
```

For Get the first item instead, use [`first`](#first). For Remove and return the last item, use [`pop`](#pop).

---

### keys()

The `keys` method returns all of the collection's keys as a new collection.
For array-backed collections, this returns the numeric indices as strings.

For an associative collection:

```typescript
collect({ a: 1, b: 2 }).keys()
// → Collection ['a', 'b']
```

For an array collection:

```typescript
collect([10, 20, 30]).keys()
// → Collection ['0', '1', '2']
```

For Get all values, use [`values`](#values). For Check if a key exists, use [`has`](/collections/checking#has).

---

### values()

The `values` method returns all of the collection's values as a new
collection with reset, sequential integer keys.

For an associative collection:

```typescript
collect({ a: 1, b: 2, c: 3 }).values()
// → Collection [1, 2, 3]
```

To reset keys after filtering:

```typescript
collect([1, 2, 3, 4, 5])
    .filter(n => n > 2)
    .values()
// → Collection [3, 4, 5] with keys 0, 1, 2
```

For Get all keys, use [`keys`](#keys). For Get the raw underlying data, use [`all`](#all).

---

### slice()

The `slice` method returns a slice of the collection starting at the
given index. You may pass a second argument to limit the size of the
returned slice.

```typescript
collect([1, 2, 3, 4, 5]).slice(2)
// → Collection [3, 4, 5]
```

You may also pass a length limit:

```typescript
collect([1, 2, 3, 4, 5]).slice(1, 2)
// → Collection [2, 3]
```

With a negative offset, it counts from the end:

```typescript
collect([1, 2, 3, 4, 5]).slice(-2)
// → Collection [4, 5]
```

For Take items from beginning or end, use [`take`](/collections/filtering#take). For Skip items from the beginning, use [`skip`](/collections/filtering#skip).

---

### pull()

The `pull` method removes and returns an item from the collection by its
key. If the key does not exist, the default value is returned. This method
mutates the collection.

```typescript
const data = collect({ name: 'Taylor', role: 'admin' })
data.pull('name')
// → 'Taylor'
data.all()
// → { role: 'admin' }
```

You may pass a default value:

```typescript
collect({ a: 1 }).pull('missing', 'default')
// → 'default'
```

For Get without removing, use [`get`](#get). For Remove and return the last item, use [`pop`](#pop).

---

### pop()

The `pop` method removes and returns the last item from the collection.
You may pass a count to remove and return multiple items from the end.
If the collection is empty, `null` is returned.

For a single item:

```typescript
const data = collect([1, 2, 3, 4, 5])
data.pop()
// → 5
data.all()
// → [1, 2, 3, 4]
```

For multiple items:

```typescript
collect([1, 2, 3, 4, 5]).pop(2)
// → Collection [4, 5]
```

For an empty collection:

```typescript
collect([]).pop()
// → null
```

For Remove from the beginning, use [`shift`](#shift). For Remove by key, use [`pull`](#pull).

---

### shift()

The `shift` method removes and returns the first item from the collection.
You may pass a count to remove and return multiple items from the beginning.
If the collection is empty, `null` is returned.

For a single item:

```typescript
const data = collect([1, 2, 3, 4, 5])
data.shift()
// → 1
data.all()
// → [2, 3, 4, 5]
```

For multiple items:

```typescript
collect([1, 2, 3, 4, 5]).shift(2)
// → Collection [1, 2]
```

For an empty collection:

```typescript
collect([]).shift()
// → null
```

For Remove from the end, use [`pop`](#pop). For Remove by key, use [`pull`](#pull).

---

### select()

The `select` method selects the given keys from each item in the
collection, similar to a SQL SELECT statement. This is useful for
extracting only the properties you need from complex objects.

```typescript
const users = collect([
    { id: 1, name: 'Taylor', email: 'taylor@example.com', role: 'admin' },
    { id: 2, name: 'Abigail', email: 'abigail@example.com', role: 'user' }
])
users.select(['name', 'email'])
// → Collection [{ name: 'Taylor', email: '...' }, { name: 'Abigail', email: '...' }]
```

For nested properties:

```typescript
collect([{ user: { name: 'Taylor' }, meta: { active: true } }])
    .select(['user.name'])
// → Collection [{ 'user.name': 'Taylor' }]
```

For Extract a single property as values, use [`pluck`](/collections/transforming#pluck). For Select keys from the collection itself, use [`only`](/collections/filtering#only).

---

### search()

The `search` method searches the collection for the given value and
returns its key if found. If the item is not found, `false` is returned.
By default, comparison uses loose equality. Pass `true` as the second
argument for strict comparison.

```typescript
collect([2, 4, 6, 8]).search(4)
// → '1'
```

You may also pass a callback:

```typescript
collect([2, 4, 6, 8]).search(item => item > 5)
// → '2'
```

For strict comparison:

```typescript
collect([2, 4, '6', 8]).search('6', true)
// → '2'
```

For Check if a value exists, use [`contains`](/collections/filtering#contains). For Get the first matching item, use [`first`](#first).

---

### sole()

The `sole` method returns the first element in the collection that passes a given truth test,
but only if the truth test matches exactly one element.

```typescript
collect([1, 2, 3, 4])
    .sole(n => n === 2)
// → 2
```

You may also use key/value syntax:

```typescript
collect([{ id: 1, active: true }, { id: 2, active: false }])
    .sole('active', true)
// → { id: 1, active: true }
```

For Get first matching item without throwing, use [`first`](#first). For Check without throwing, use [`hasSole`](/collections/checking#hassole).

---

### firstOrFail()

The `firstOrFail` method returns the first element in the collection, or throws an
`ItemNotFoundException` if the collection is empty or no matching element is found.

```typescript
collect([1, 2, 3])
    .firstOrFail(n => n > 2)
// → 3
```

You may also use key/value syntax:

```typescript
collect([{ id: 1 }, { id: 2 }])
    .firstOrFail('id', 2)
// → { id: 2 }
```

For Get first matching item without throwing, use [`first`](#first). For Get item only if exactly one matches, use [`sole`](#sole).

---

### random()

The `random` method returns a random item from the collection. You may
optionally pass an integer to specify how many items you would like to
retrieve. If the collection is empty, an exception is thrown.

```typescript
collect([1, 2, 3, 4, 5]).random()
// → 3 (random)
```

For multiple random items:

```typescript
collect([1, 2, 3, 4, 5]).random(2)
// → Collection [4, 1] (random)
```

You may also pass a callback for count:

```typescript
collect([1, 2, 3, 4, 5]).random(items => items.count() - 2)
// → Collection of 3 random items
```

For Randomize the entire collection, use [`shuffle`](/collections/sorting#shuffle). For Get the first item, use [`first`](#first).

---

### firstWhere()

The `firstWhere` method returns the first element in the collection with the given key/value pair.

```typescript
collect([
  { id: 1, name: 'Taylor', role: 'admin' },
  { id: 2, name: 'Abigail', role: 'editor' },
])
  .firstWhere('role', 'admin')
// → { id: 1, name: 'Taylor', role: 'admin' }
```

You may also pass a comparison operator:

```typescript
collect([
  { id: 1, total: 50 },
  { id: 2, total: 150 },
])
  .firstWhere('total', '>', 100)
// → { id: 2, total: 150 }
```

---

### value()

The `value` method retrieves a given value from the first element of the
collection. This is useful for quickly extracting a single property from
the first item without having to call `first()` separately.

```typescript
collect([
    { name: 'Taylor', role: 'admin' },
    { name: 'Abigail', role: 'user' }
]).value('name')
// → 'Taylor'
```

You may pass a default:

```typescript
collect([]).value('name', 'Unknown')
// → 'Unknown'
```

For Get the first item, use [`first`](#first). For Extract a property from all items, use [`pluck`](/collections/transforming#pluck).

---

### offsetGet()

Get the value at a given offset.

Part of the ArrayAccess interface for bracket-style access. Unlike
`get()`, this method does not support default values and returns
`undefined` for missing keys.

```typescript
collect({ name: 'Taylor', role: 'Developer' })
    .offsetGet('name')
// → 'Taylor'
```

For Primary method with default value support, use [`get`](#get). For Check if key exists, use [`offsetExists`](/collections/checking#offsetexists).

---
