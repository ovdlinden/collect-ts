# Finding

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### all()

The **all** method returns the underlying array or object represented by the collection:

```typescript
collect([1, 2, 3])
    .all()
// → [1, 2, 3]
```

```typescript
collect({ name: 'Taylor', role: 'Developer' })
    .all()
// → { name: 'Taylor', role: 'Developer' }
```

---

### get()

The **get** method returns the item at a given key. If the key does not exist,
`null` is returned. Optionally, pass a default value as the second argument.

```typescript
collect({ name: 'Taylor', role: 'Developer' })
    .get('name')
// → 'Taylor'
```

With default value:

```typescript
collect({ name: 'Taylor' })
    .get('age', 25)
// → 25
```

With callback default:

```typescript
collect({ name: 'Taylor' })
    .get('age', () => Date.now())
// → current timestamp
```

Nested key with dot notation:

```typescript
collect({ user: { name: 'Taylor' } })
    .get('user.name')
// → 'Taylor'
```

To to get and remove from collection, use [`pull`](#pull). To to get first item, use [`first`](#first).

---

### getOrPut()

The **getOrPut** method retrieves the value for the given key. If the key does not
exist, the default value is stored in the collection and returned.

```typescript
const collection = collect({ name: 'Taylor' })
collection.getOrPut('age', 25)
// → 25 (and collection now contains { name: 'Taylor', age: 25 })
```

With callback:

```typescript
const collection = collect({ name: 'Taylor' })
collection.getOrPut('timestamp', () => Date.now())
// → current timestamp (computed only if key doesn't exist)
```

To get without setting default, use [`get`](#get). To set value by key, use [`put`](/collections/transforming#put).

---

### first()

The **first** method returns the first element in the collection that passes a given truth test.

You may also call the method with no arguments to get the first element. If the collection
is empty, the default value or undefined is returned.

```typescript
collect([1, 2, 3])
    .first()
// → 1
```

Pass a callback:

```typescript
collect([1, 2, 3, 4])
    .first(n => n > 2)
// → 3
```

Pass a default:

```typescript
collect([])
    .first(null, 'default')
// → 'default'
```

To get the last item instead, use [`last`](#last). To throwing when no item found, use [`firstOrFail`](#firstorfail).

---

### last()

The **last** method returns the last element in the collection that passes a given truth test.

You may also call the method with no arguments to get the last element. If the collection
is empty, the default value or undefined is returned.

```typescript
collect([1, 2, 3])
    .last()
// → 3
```

Pass a callback:

```typescript
collect([1, 2, 3, 4])
    .last(n => n < 3)
// → 2
```

To get the first item instead, use [`first`](#first). To remove and return the last item, use [`pop`](/collections/transforming#pop).

---

### keys()

The **keys** method returns all of the collection's keys as a new collection.
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

To get all values, use [`values`](#values). To check if a key exists, use [`has`](/collections/checking#has).

---

### values()

The **values** method returns all of the collection's values as a new
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

To get all keys, use [`keys`](#keys). To get the raw underlying data, use [`all`](#all).

---

### slice()

The **slice** method returns a slice of the collection starting at the
given index. You may pass a second argument to limit the size of the
returned slice.

```typescript
collect([1, 2, 3, 4, 5]).slice(2)
// → Collection [3, 4, 5]
```

Pass a length limit:

```typescript
collect([1, 2, 3, 4, 5]).slice(1, 2)
// → Collection [2, 3]
```

With a negative offset, it counts from the end:

```typescript
collect([1, 2, 3, 4, 5]).slice(-2)
// → Collection [4, 5]
```

To take items from beginning or end, use [`take`](/collections/filtering#take). To skip items from the beginning, use [`skip`](/collections/filtering#skip).

---

### pull()

The **pull** method removes and returns an item from the collection by its key.
This method modifies the collection in place.

```typescript
const collection = collect({ name: 'Taylor', role: 'Developer' })
collection.pull('role')
// → 'Developer'
collection.all()
// → { name: 'Taylor' }
```

With default value:

```typescript
const collection = collect({ name: 'Taylor' })
collection.pull('age', 25)
// → 25
```

To get without removing, use [`get`](#get). To remove without returning, use [`forget`](/collections/transforming#forget).

---

### search()

The **search** method searches the collection for the given value and returns
its key if found. If the item is not found, `false` is returned.

```typescript
collect([2, 4, 6, 8])
    .search(4)
// → 1
```

Not found:

```typescript
collect([2, 4, 6, 8])
    .search(5)
// → false
```

With callback:

```typescript
collect([
  { name: 'Taylor', age: 25 },
  { name: 'Abigail', age: 28 },
])
  .search(user => user.name === 'Abigail')
// → 1
```

To check if value exists, use [`contains`](/collections/filtering#contains). To get first matching item, use [`firstWhere`](#firstwhere).

---

### toString()

The **toString** method returns the collection as a string representation.
For arrays, items are joined with commas. For objects, returns JSON.

With array:

```typescript
collect([1, 2, 3])
    .toString()
// → '1,2,3'
```

With object:

```typescript
collect({ a: 1, b: 2 })
    .toString()
// → '{"a":1,"b":2}'
```

To join with custom separator, use [`join`](/collections/aggregating#join). To jSON serialization, use [`toJson`](#tojson).

---

### sole()

The **sole** method returns the first element in the collection that passes
a given truth test, but only if exactly one element matches. If no elements
match or more than one element matches, an exception is thrown.

```typescript
collect([1, 2, 3])
    .sole(n => n === 2)
// → 2
```

Throws on multiple matches:

```typescript
collect([1, 2, 2, 3])
    .sole(n => n === 2)
// throws MultipleItemsFoundException
```

With key/value:

```typescript
collect([{ id: 1 }, { id: 2 }])
    .sole('id', 1)
// → { id: 1 }
```

To get first without uniqueness check, use [`first`](#first). To get first, throw if empty, use [`firstOrFail`](#firstorfail).

---

### firstOrFail()

The **firstOrFail** method returns the first element in the collection, or throws
an exception if the collection is empty.

```typescript
collect([1, 2, 3])
    .firstOrFail()
// → 1
```

With callback:

```typescript
collect([1, 2, 3])
    .firstOrFail(n => n > 1)
// → 2
```

Empty collection throws:

```typescript
collect([])
    .firstOrFail()
// throws ItemNotFoundException
```

To returns undefined instead of throwing, use [`first`](#first). To requires exactly one match, use [`sole`](#sole).

---

### nth()

The **nth** method returns every n-th element of the collection.

```typescript
collect([1, 2, 3, 4, 5, 6])
    .nth(2)
    .all()
// → [1, 3, 5]
```

With offset:

```typescript
collect([1, 2, 3, 4, 5, 6])
    .nth(2, 1)
    .all()
// → [2, 4, 6]
```

To filter with custom callback, use [`filter`](/collections/filtering#filter). To take first n items, use [`take`](/collections/filtering#take).

---

### random()

The **random** method returns a random item from the collection.

```typescript
collect([1, 2, 3, 4, 5])
    .random()
// → 3 (random)
```

Multiple random items:

```typescript
collect([1, 2, 3, 4, 5])
    .random(2)
// → [2, 5] (random pair)
```

To randomize entire collection, use [`shuffle`](/collections/sorting#shuffle). To get first item, use [`first`](#first).

---

### firstWhere()

The **firstWhere** method returns the first element in the collection with the
given key/value pair.

```typescript
collect([
  { name: 'Taylor', age: 25 },
  { name: 'Abigail', age: 28 },
  { name: 'James', age: 25 },
])
  .firstWhere('age', 25)
// → { name: 'Taylor', age: 25 }
```

With operator:

```typescript
collect([
  { name: 'Taylor', age: 25 },
  { name: 'Abigail', age: 28 },
])
  .firstWhere('age', '>', 26)
// → { name: 'Abigail', age: 28 }
```

To get first item with callback, use [`first`](#first). To get all matching items, use [`where`](/collections/filtering#where).

---

### toArray()

The **toArray** method converts the collection into a plain array. For
associative collections, only the values are returned:

```typescript
collect([1, 2, 3])
    .toArray()
// → [1, 2, 3]
```

```typescript
collect({ a: 1, b: 2, c: 3 })
    .toArray()
// → [1, 2, 3]
```

---

### toJson()

The **toJson** method converts the collection into a JSON serialized string.

```typescript
collect({ name: 'Taylor', age: 25 })
    .toJson()
// → '{"name":"Taylor","age":25}'
```

With array:

```typescript
collect([1, 2, 3])
    .toJson()
// → '[1,2,3]'
```

To format with indentation, use [`toPrettyJson`](#toprettyjson). To get raw items, use [`all`](#all).

---

### toPrettyJson()

The **toPrettyJson** method converts the collection into a formatted JSON string
with indentation for readability.

```typescript
collect({ name: 'Taylor', age: 25 })
    .toPrettyJson()
// → '{\n  "name": "Taylor",\n  "age": 25\n}'
```

Custom indentation:

```typescript
collect([1, 2, 3])
    .toPrettyJson(4)
// → '[\n    1,\n    2,\n    3\n]'
```

To compact JSON, use [`toJson`](#tojson).

---

### value()

The **value** method retrieves a given value from the first element of the collection.

```typescript
collect([
  { name: 'Taylor', role: 'Developer' },
  { name: 'Abigail', role: 'Designer' },
])
  .value('name')
// → 'Taylor'
```

With default:

```typescript
collect([])
    .value('name', 'Unknown')
// → 'Unknown'
```

To get values from all items, use [`pluck`](/collections/transforming#pluck). To get first item, use [`first`](#first).

---

### offsetGet()

The **offsetGet** method returns the value at a given offset.

Part of the ArrayAccess interface for bracket-style access. Unlike
`get()`, this method does not support default values and returns
`undefined` for missing keys.

```typescript
collect({ name: 'Taylor', role: 'Developer' })
    .offsetGet('name')
// → 'Taylor'
```

With numeric index:

```typescript
collect(['a', 'b', 'c'])
    .offsetGet(1)
// → 'b'
```

To primary method with default value support, use [`get`](#get). To check if key exists, use [`offsetExists`](/collections/checking#offsetexists).

---

### after()

The **after** method returns the item after the given item.
Returns null if the item is not found or is the last item.

```typescript
collect([1, 2, 3, 4, 5])
    .after(3)
// → 4
```

With callback:

```typescript
collect([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
])
  .after(item => item.name === 'Bob')
// → { id: 3, name: 'Carol' }
```

Last item returns null:

```typescript
collect([1, 2, 3])
    .after(3)
// → null
```

To get the item before, use [`before`](#before). To find item's key, use [`search`](#search).

---

### before()

The **before** method returns the item before the given item.
Returns null if the item is not found or is the first item.

```typescript
collect([1, 2, 3, 4, 5])
    .before(3)
// → 2
```

With callback:

```typescript
collect([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
])
  .before(item => item.name === 'Bob')
// → { id: 1, name: 'Alice' }
```

First item returns null:

```typescript
collect([1, 2, 3])
    .before(1)
// → null
```

To get the item after, use [`after`](#after). To find item's key, use [`search`](#search).

---
