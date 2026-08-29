# Combining

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### zip()

The `zip` method merges together the values of the given array with the values of
the original collection at their corresponding index. This is useful for pairing
related data from multiple sources, such as names with scores or dates with values.

Pair names with scores

```typescript
collect(['Alice', 'Bob', 'Charlie'])
    .zip([85, 92, 78])
// → [['Alice', 85], ['Bob', 92], ['Charlie', 78]]
```

Multiple arrays

```typescript
collect([1, 2, 3])
    .zip(['a', 'b', 'c'], [true, false, true])
// → [[1, 'a', true], [2, 'b', false], [3, 'c', true]]
```

For Use values as keys paired with another array's values, see the [combine](#combine) method. For Create cartesian product instead of pairing by index, see the [crossJoin](#crossjoin) method.

---

### diff()

The `diff` method compares the collection against another array or collection
based on its values. This method returns the values in the original collection
that are not present in the given collection.

Basic difference

```typescript
collect([1, 2, 3, 4, 5])
    .diff([2, 4, 6])
// → [1, 3, 5]
```

Find missing items

```typescript
const required = ['name', 'email', 'phone']
const provided = ['name', 'email']
collect(required).diff(provided)
// → ['phone']
```

For Get items present in both collections, see the [intersect](#intersect) method. For comparing by keys instead of values, see the [diffKeys](#diffkeys) method. For comparing by both keys and values, see the [diffAssoc](#diffassoc) method. For comparing with a custom callback, see the [diffUsing](#diffusing) method.

---

### diffUsing()

The `diffUsing` method compares the collection against another array or collection
using a callback. The callback should return 0 when two values are considered equal,
a negative number when the first is less than the second, or a positive number otherwise.

Case-insensitive comparison

```typescript
collect(['Apple', 'Banana'])
    .diffUsing(['apple', 'cherry'], (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → ['Banana']
```

For comparing using default equality, see the [diff](#diff) method. For comparing keys and values with a callback, see the [diffAssocUsing](#diffassocusing) method.

---

### diffKeys()

The `diffKeys` method compares the collection against another array or collection
based on its keys. This method returns the key/value pairs in the original
collection whose keys are not present in the given collection.

Find extra fields

```typescript
collect({ name: 'Alice', age: 30, city: 'NYC' })
    .diffKeys({ name: '', age: 0 })
// → { city: 'NYC' }
```

For comparing by values instead of keys, see the [diff](#diff) method. For comparing by both keys and values, see the [diffAssoc](#diffassoc) method. For comparing keys with a custom callback, see the [diffKeysUsing](#diffkeysusing) method.

---

### diffKeysUsing()

The `diffKeysUsing` method compares the collection against another array or collection
based on its keys using a callback. The callback should return 0 when two keys are
considered equal.

Case-insensitive key comparison

```typescript
collect({ Name: 'Alice', AGE: 30 })
    .diffKeysUsing({ name: '', age: 0 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → {} (all keys match case-insensitively)
```

For comparing keys using default equality, see the [diffKeys](#diffkeys) method.

---

### diffAssoc()

The `diffAssoc` method compares the collection against another array or collection
based on both its keys and values. This method returns the key/value pairs in the
original collection that are not present in the given collection.

Compare key-value pairs

```typescript
collect({ color: 'red', size: 'large', price: 100 })
    .diffAssoc({ color: 'red', size: 'medium' })
// → { size: 'large', price: 100 }
```

For comparing by values only, see the [diff](#diff) method. For comparing by keys only, see the [diffKeys](#diffkeys) method. For comparing with a custom key callback, see the [diffAssocUsing](#diffassocusing) method.

---

### diffAssocUsing()

The `diffAssocUsing` method compares the collection against another array or collection
based on its keys and values, using a callback for key comparison. The callback should
return 0 when two keys are considered equal.

Case-insensitive key comparison

```typescript
collect({ Name: 'Alice', Age: 30 })
    .diffAssocUsing({ name: 'Alice', age: 25 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → { Age: 30 } (Name matches, Age differs in value)
```

For comparing using default key equality, see the [diffAssoc](#diffassoc) method. For comparing values with a custom callback, see the [diffUsing](#diffusing) method.

---

### intersect()

The `intersect` method removes any values from the original collection that are
not present in the given array or collection. The resulting collection will
preserve the original collection's keys.

Find common elements

```typescript
collect([1, 2, 3, 4, 5])
    .intersect([2, 4, 6, 8])
// → [2, 4]
```

Check permissions

```typescript
const userPermissions = ['read', 'write', 'delete']
const required = ['read', 'admin']
collect(userPermissions).intersect(required)
// → ['read']
```

For Get items NOT present in the other collection, see the [diff](#diff) method. For Intersect by keys instead of values, see the [intersectByKeys](#intersectbykeys) method. For Intersect by both keys and values, see the [intersectAssoc](#intersectassoc) method. For Intersect with a custom callback, see the [intersectUsing](#intersectusing) method.

---

### intersectUsing()

The `intersectUsing` method removes values not present in the given array or collection,
using a callback for comparison. The callback should return 0 when two values are
considered equal.

Case-insensitive intersection

```typescript
collect(['Apple', 'Banana', 'Cherry'])
    .intersectUsing(['apple', 'cherry'], (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → ['Apple', 'Cherry']
```

For Intersect using default equality, see the [intersect](#intersect) method.

---

### intersectAssoc()

The `intersectAssoc` method compares the collection against another array or collection,
returning key/value pairs that are present in both. Unlike `intersect`, this method
considers both keys and values when determining matches.

Find matching key-value pairs

```typescript
collect({ name: 'Alice', age: 30, city: 'NYC' })
    .intersectAssoc({ name: 'Alice', age: 25, city: 'NYC' })
// → { name: 'Alice', city: 'NYC' }
```

For Intersect by values only, see the [intersect](#intersect) method. For Intersect by keys only, see the [intersectByKeys](#intersectbykeys) method. For Intersect with a custom key callback, see the [intersectAssocUsing](#intersectassocusing) method.

---

### intersectAssocUsing()

The `intersectAssocUsing` method compares the collection against another array or collection
based on both keys and values, using a callback for key comparison. The callback should
return 0 when two keys are considered equal.

Case-insensitive key matching

```typescript
collect({ Name: 'Alice', AGE: 30 })
    .intersectAssocUsing({ name: 'Alice', age: 30 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → { Name: 'Alice', AGE: 30 }
```

For Intersect using default key equality, see the [intersectAssoc](#intersectassoc) method.

---

### intersectByKeys()

The `intersectByKeys` method removes any keys from the original collection that are
not present in the given array or collection. This is useful for filtering an object
to only include specific fields.

Filter to allowed fields

```typescript
collect({ name: 'Alice', age: 30, password: 'secret' })
    .intersectByKeys({ name: '', age: '' })
// → { name: 'Alice', age: 30 }
```

For Intersect by values instead of keys, see the [intersect](#intersect) method. For Intersect by both keys and values, see the [intersectAssoc](#intersectassoc) method. For Similar but accepts key names as arguments, see the [only](/collections/filtering#only) method.

---

### merge()

The `merge` method merges the given array or collection with the original collection.
If a string key in the given items matches a string key in the original collection,
the given item's value will overwrite the value in the original collection.

Merge objects

```typescript
collect({ name: 'Alice', age: 25 })
    .merge({ age: 30, city: 'NYC' })
// → { name: 'Alice', age: 30, city: 'NYC' }
```

Merge arrays (appends with numeric keys)

```typescript
collect([1, 2])
    .merge([3, 4])
// → [1, 2, 3, 4]
```

For keeping original values for duplicate keys, see the [union](#union) method. For Merge nested objects recursively, see the [mergeRecursive](#mergerecursive) method. For always appending without key consideration, see the [concat](#concat) method.

---

### mergeRecursive()

The `mergeRecursive` method merges the given array or collection recursively with
the original collection. If a string key in the given items matches a string key
in the original collection, the values for these keys are merged together into an
object, and this is done recursively for nested structures.

Recursive merge

```typescript
collect({ user: { name: 'Alice', settings: { theme: 'dark' } } })
    .mergeRecursive({ user: { settings: { language: 'en' } } })
// → { user: { name: 'Alice', settings: { theme: 'dark', language: 'en' } } }
```

For Shallow merge (overwrites nested objects), see the [merge](#merge) method. For Similar but overwrites instead of merging arrays, see the [replaceRecursive](#replacerecursive) method.

---

### union()

The `union` method adds the given array to the collection. If the given array
contains keys that are already in the original collection, the original collection's
values will be preferred. This is the opposite of `merge` which prefers new values.

Prefer original values

```typescript
collect({ a: 1, b: 2 })
    .union({ b: 3, c: 4 })
// → { a: 1, b: 2, c: 4 }
```

Fill in defaults

```typescript
const userSettings = collect(user.settings)
    .union(defaultSettings)
// Original settings preserved, defaults fill gaps
```

For preferring new values for duplicate keys, see the [merge](#merge) method.

---

### combine()

The `combine` method combines the values of the collection, as keys, with the
values of another array or collection. This is useful for creating key-value
pairs from two separate lists.

Create key-value mapping

```typescript
collect(['name', 'age', 'city'])
    .combine(['Alice', 30, 'NYC'])
// → { name: 'Alice', age: 30, city: 'NYC' }
```

Build form data

```typescript
collect(fieldNames)
    .combine(fieldValues)
// → { field1: value1, field2: value2, ... }
```

For Pair by index into nested arrays instead of key-value, see the [zip](#zip) method. For Extract key-value pairs from objects, see the [pluck](/collections/transforming#pluck) method.

---

### crossJoin()

The `crossJoin` method cross joins the collection's values among the given arrays
or collections, returning a Cartesian product with all possible permutations.

Two-way cross join

```typescript
collect(['S', 'M', 'L'])
    .crossJoin(['red', 'blue'])
// → [
//   ['S', 'red'], ['S', 'blue'],
//   ['M', 'red'], ['M', 'blue'],
//   ['L', 'red'], ['L', 'blue']
// ]
```

Three-way cross join

```typescript
collect([1, 2])
    .crossJoin(['a', 'b'], [true, false])
// → [[1, 'a', true], [1, 'a', false], [1, 'b', true], ...]
```

For Pair by index instead of creating all combinations, see the [zip](#zip) method.

---

### concat()

The `concat` method appends the given array or collection's values onto the end
of another collection. Unlike `merge`, this method does not consider keys and
simply appends all values to the end.

Concatenate arrays

```typescript
collect([1, 2, 3])
    .concat([4, 5, 6])
// → [1, 2, 3, 4, 5, 6]
```

Chain multiple concatenations

```typescript
collect(['a'])
    .concat(['b', 'c'])
    .concat(['d'])
// → ['a', 'b', 'c', 'd']
```

For Merge with key consideration, see the [merge](#merge) method. For Append single items (mutates collection), see the [push](#push) method.

---

### put()

The `put` method sets the given key and value in the collection. If the key
already exists, its value will be overwritten. This method mutates the collection.

Add or update item

```typescript
collect({ a: 1, b: 2 })
    .put('c', 3)
    .put('a', 10)
// → { a: 10, b: 2, c: 3 }
```

Build object dynamically

```typescript
collect({})
    .put('name', 'Alice')
    .put('age', 30)
// → { name: 'Alice', age: 30 }
```

For Append without specifying a key, see the [push](#push) method. For Retrieve a value by key, see the [get](/collections/finding#get) method. For Get and remove by key, see the [pull](/collections/finding#pull) method.

---

### push()

The `push` method appends one or more items to the end of the collection.
This method mutates the collection and returns it for chaining.

Append single item

```typescript
collect([1, 2, 3])
    .push(4)
// → [1, 2, 3, 4]
```

Append multiple items

```typescript
collect(['a', 'b'])
    .push('c', 'd', 'e')
// → ['a', 'b', 'c', 'd', 'e']
```

For Add to the beginning, see the [prepend](#prepend) method. For Set by key, see the [put](#put) method. For Append without mutation, see the [concat](#concat) method. For push alias, see the [add](#add) method.

---

### prepend()

The `prepend` method adds an item to the beginning of the collection.
You may optionally pass a second argument to set the key of the prepended item.
This method mutates the collection.

Prepend value

```typescript
collect([2, 3, 4])
    .prepend(1)
// → [1, 2, 3, 4]
```

Prepend with key

```typescript
collect({ b: 2, c: 3 })
    .prepend(1, 'a')
// → { a: 1, b: 2, c: 3 }
```

For Add to the end, see the [push](#push) method. For Prepend multiple values, see the [unshift](#unshift) method.

---

### unshift()

The `unshift` method is an alias for the `prepend` method, but accepts multiple
values. It adds one or more items to the beginning of the collection, preserving
their order. This method mutates the collection.

Prepend multiple values

```typescript
collect([4, 5, 6])
    .unshift(1, 2, 3)
// → [1, 2, 3, 4, 5, 6]
```

For Add single item with optional key, see the [prepend](#prepend) method. For Add to the end, see the [push](#push) method.

---

### add()

The `add` method is an alias for the `push` method. It appends a single item
to the end of the collection. This method mutates the collection.

Add item

```typescript
collect([1, 2, 3])
    .add(4)
// → [1, 2, 3, 4]
```

For Primary method (supports multiple items), see the [push](#push) method.

---

### multiply()

The `multiply` method creates multiple copies of all items in the collection.
The resulting collection contains the original items repeated the specified
number of times.

Double the items

```typescript
collect([1, 2, 3])
    .multiply(2)
// → [1, 2, 3, 1, 2, 3]
```

Repeat for display

```typescript
collect(['*'])
    .multiply(5)
    .join('')
// → '*****'
```

For Pad to a specific size, see the [pad](/collections/transforming#pad) method. For Generate a sequence of numbers, see the [range](/collections/transforming#range) method.

---

### replace()

The `replace` method behaves similarly to `merge`; however, in addition to
overwriting matching items that have string keys, the `replace` method will
also overwrite items in the collection that have matching numeric keys.

Replace by key

```typescript
collect({ name: 'Alice', age: 25 })
    .replace({ age: 30, city: 'NYC' })
// → { name: 'Alice', age: 30, city: 'NYC' }
```

Replace array items by index

```typescript
collect(['a', 'b', 'c'])
    .replace({ 1: 'B', 2: 'C' })
// → ['a', 'B', 'C']
```

For Merge without replacing by numeric key, see the [merge](#merge) method. For Replace nested objects recursively, see the [replaceRecursive](#replacerecursive) method.

---

### replaceRecursive()

The `replaceRecursive` method works like `replace`, but it will recurse into
nested objects and apply the same replacement process to the inner values.

Recursive replacement

```typescript
collect({
    user: { name: 'Alice', settings: { theme: 'dark', lang: 'en' } }
}).replaceRecursive({
    user: { settings: { theme: 'light' } }
})
// → { user: { name: 'Alice', settings: { theme: 'light', lang: 'en' } } }
```

For Shallow replacement, see the [replace](#replace) method. For Similar but merges arrays instead of replacing, see the [mergeRecursive](#mergerecursive) method.

---

### with()

The `with` method joins the collection with a related collection, enabling
operations that correlate items between the two. This is useful for scenarios
similar to database joins where you need to work with related data sets.

Join users with orders

```typescript
const users = collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
const orders = collect([
  { userId: 1, total: 100 },
  { userId: 1, total: 200 },
])
users.with(orders).map((user, related) => ({
  ...user,
  orderCount: related.count(),
}))
```

For Create cartesian product of two collections, see the [crossJoin](#crossjoin) method. For Pair items by index, see the [zip](#zip) method.

---
