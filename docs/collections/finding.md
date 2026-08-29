# Finding

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### all()

The `all` method returns the underlying array or object represented by
the collection. Array-backed collections return an array, while
associative collections return a plain object.

Array collection

```typescript
collect([1, 2, 3]).all()
// → [1, 2, 3]
```

Associative collection

```typescript
collect({ name: 'Taylor', role: 'admin' }).all()
// → { name: 'Taylor', role: 'admin' }
```

For always getting an array, see the [toArray](/collections/aggregating#toarray) method. For Static version, see the [unwrap](/collections/creating#unwrap) method.

---

### get()

The `get` method returns the item at a given key. If the key does not
exist, `undefined` is returned. You may optionally pass a default value
as the second argument, or a callback that returns the default.

Basic usage

```typescript
collect({ name: 'Taylor', role: 'admin' }).get('name')
// → 'Taylor'
```

With default value

```typescript
collect({ name: 'Taylor' }).get('role', 'guest')
// → 'guest'
```

With default callback

```typescript
collect({ name: 'Taylor' }).get('role', () => computeDefault())
// → result of computeDefault()
```

For Get or store a default value, see the [getOrPut](#getorput) method. For Remove and return an item by key, see the [pull](#pull) method.

---

### getOrPut()

The `getOrPut` method retrieves an item by key. If the key does not exist,
the default value is stored in the collection and returned. This is useful
for lazily populating collection values.

Basic usage

```typescript
const data = collect({ a: 1 })
data.getOrPut('b', 2)
// → 2
data.all()
// → { a: 1, b: 2 }
```

With factory function

```typescript
data.getOrPut('expensive', () => computeExpensiveValue())
// → computed value (only computed if key missing)
```

For Get without storing a default, see the [get](#get) method. For Store a value at a key, see the [put](/collections/combining#put) method.

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

With callback

```typescript
collect([1, 2, 3, 4])
    .first(n => n > 2)
// → 3
```

With default

```typescript
collect([])
    .first(null, 'default')
// → 'default'
```

For Get the last item instead, see the [last](#last) method. For throwing when no item found, see the [firstOrFail](#firstorfail) method. For Get the only item, throws if not exactly one, see the [sole](#sole) method. For Find by key/value pair, see the [firstWhere](#firstwhere) method.

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

With callback

```typescript
collect([1, 2, 3, 4])
    .last(n => n < 3)
// → 2
```

For Get the first item instead, see the [first](#first) method. For Remove and return the last item, see the [pop](#pop) method.

---

### keys()

The `keys` method returns all of the collection's keys as a new collection.
For array-backed collections, this returns the numeric indices as strings.

Associative collection

```typescript
collect({ a: 1, b: 2 }).keys()
// → Collection ['a', 'b']
```

Array collection

```typescript
collect([10, 20, 30]).keys()
// → Collection ['0', '1', '2']
```

For Get all values, see the [values](#values) method. For Check if a key exists, see the [has](/collections/checking#has) method.

---

### values()

The `values` method returns all of the collection's values as a new
collection with reset, sequential integer keys.

Associative collection

```typescript
collect({ a: 1, b: 2, c: 3 }).values()
// → Collection [1, 2, 3]
```

Resetting keys after filtering

```typescript
collect([1, 2, 3, 4, 5])
    .filter(n => n > 2)
    .values()
// → Collection [3, 4, 5] with keys 0, 1, 2
```

For Get all keys, see the [keys](#keys) method. For Get the raw underlying data, see the [all](#all) method.

---

### slice()

The `slice` method returns a slice of the collection starting at the
given index. You may pass a second argument to limit the size of the
returned slice.

Basic usage

```typescript
collect([1, 2, 3, 4, 5]).slice(2)
// → Collection [3, 4, 5]
```

With length limit

```typescript
collect([1, 2, 3, 4, 5]).slice(1, 2)
// → Collection [2, 3]
```

Negative offset

```typescript
collect([1, 2, 3, 4, 5]).slice(-2)
// → Collection [4, 5]
```

For Take items from beginning or end, see the [take](/collections/filtering#take) method. For Skip items from the beginning, see the [skip](/collections/filtering#skip) method. For Paginate the collection, see the [forPage](/collections/filtering#forpage) method.

---

### pull()

The `pull` method removes and returns an item from the collection by its
key. If the key does not exist, the default value is returned. This method
mutates the collection.

Basic usage

```typescript
const data = collect({ name: 'Taylor', role: 'admin' })
data.pull('name')
// → 'Taylor'
data.all()
// → { role: 'admin' }
```

With default value

```typescript
collect({ a: 1 }).pull('missing', 'default')
// → 'default'
```

For Get without removing, see the [get](#get) method. For Remove and return the last item, see the [pop](#pop) method. For Remove and return the first item, see the [shift](#shift) method. For Remove without returning, see the [forget](/collections/transforming#forget) method.

---

### pop()

The `pop` method removes and returns the last item from the collection.
You may pass a count to remove and return multiple items from the end.
If the collection is empty, `null` is returned.

Single item

```typescript
const data = collect([1, 2, 3, 4, 5])
data.pop()
// → 5
data.all()
// → [1, 2, 3, 4]
```

Multiple items

```typescript
collect([1, 2, 3, 4, 5]).pop(2)
// → Collection [4, 5]
```

Empty collection

```typescript
collect([]).pop()
// → null
```

For Remove from the beginning, see the [shift](#shift) method. For Remove by key, see the [pull](#pull) method. For Get last without removing, see the [last](#last) method.

---

### shift()

The `shift` method removes and returns the first item from the collection.
You may pass a count to remove and return multiple items from the beginning.
If the collection is empty, `null` is returned.

Single item

```typescript
const data = collect([1, 2, 3, 4, 5])
data.shift()
// → 1
data.all()
// → [2, 3, 4, 5]
```

Multiple items

```typescript
collect([1, 2, 3, 4, 5]).shift(2)
// → Collection [1, 2]
```

Empty collection

```typescript
collect([]).shift()
// → null
```

For Remove from the end, see the [pop](#pop) method. For Remove by key, see the [pull](#pull) method. For Get first without removing, see the [first](#first) method.

---

### select()

The `select` method selects the given keys from each item in the
collection, similar to a SQL SELECT statement. This is useful for
extracting only the properties you need from complex objects.

Basic usage

```typescript
const users = collect([
    { id: 1, name: 'Taylor', email: 'taylor@example.com', role: 'admin' },
    { id: 2, name: 'Abigail', email: 'abigail@example.com', role: 'user' }
])
users.select(['name', 'email'])
// → Collection [{ name: 'Taylor', email: '...' }, { name: 'Abigail', email: '...' }]
```

Nested properties

```typescript
collect([{ user: { name: 'Taylor' }, meta: { active: true } }])
    .select(['user.name'])
// → Collection [{ 'user.name': 'Taylor' }]
```

For Extract a single property as values, see the [pluck](/collections/transforming#pluck) method. For Select keys from the collection itself, see the [only](/collections/filtering#only) method. For Transform items with full control, see the [map](/collections/transforming#map) method.

---

### search()

The `search` method searches the collection for the given value and
returns its key if found. If the item is not found, `false` is returned.
By default, comparison uses loose equality. Pass `true` as the second
argument for strict comparison.

Basic search

```typescript
collect([2, 4, 6, 8]).search(4)
// → '1'
```

With callback

```typescript
collect([2, 4, 6, 8]).search(item => item > 5)
// → '2'
```

Strict comparison

```typescript
collect([2, 4, '6', 8]).search('6', true)
// → '2'
```

For Check if a value exists, see the [contains](/collections/filtering#contains) method. For Get the first matching item, see the [first](#first) method. For Find by key/value pair, see the [firstWhere](#firstwhere) method.

---

### sole()

The `sole` method returns the first element in the collection that passes a given truth test,
but only if the truth test matches exactly one element.

If no elements match or more than one element matches, an exception is thrown.

---

### firstOrFail()

The `firstOrFail` method returns the first element in the collection, or throws an
ItemNotFoundException if the collection is empty or no matching element is found.

---

### random()

The `random` method returns a random item from the collection. You may
optionally pass an integer to specify how many items you would like to
retrieve. If the collection is empty, an exception is thrown.

Single random item

```typescript
collect([1, 2, 3, 4, 5]).random()
// → 3 (random)
```

Multiple random items

```typescript
collect([1, 2, 3, 4, 5]).random(2)
// → Collection [4, 1] (random)
```

With callback for count

```typescript
collect([1, 2, 3, 4, 5]).random(items => items.count() - 2)
// → Collection of 3 random items
```

For Randomize the entire collection, see the [shuffle](/collections/sorting#shuffle) method. For Get the first item, see the [first](#first) method.

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

With comparison operator

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

Basic usage

```typescript
collect([
    { name: 'Taylor', role: 'admin' },
    { name: 'Abigail', role: 'user' }
]).value('name')
// → 'Taylor'
```

With default

```typescript
collect([]).value('name', 'Unknown')
// → 'Unknown'
```

For Get the first item, see the [first](#first) method. For Extract a property from all items, see the [pluck](/collections/transforming#pluck) method. For Get by collection key, see the [get](#get) method.

---

### offsetGet()

Get the value at a given offset.

---
