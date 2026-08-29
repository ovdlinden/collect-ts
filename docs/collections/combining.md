# Combining

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### zip()

The `zip` method merges together the values of the given array with the values of
the original collection at their corresponding index. This is useful for pairing
related data from multiple sources, such as names with scores or dates with values.

To pair names with scores:

```typescript
collect(['Alice', 'Bob', 'Charlie'])
    .zip([85, 92, 78])
// → [['Alice', 85], ['Bob', 92], ['Charlie', 78]]
```

You may pass multiple arrays:

```typescript
collect([1, 2, 3])
    .zip(['a', 'b', 'c'], [true, false, true])
// → [[1, 'a', true], [2, 'b', false], [3, 'c', true]]
```

For Use values as keys paired with another array's values, use [`combine`](#combine). For Create cartesian product instead of pairing by index, use [`crossJoin`](#crossjoin).

---

### diff()

The `diff` method compares the collection against another array or collection
based on its values. This method returns the values in the original collection
that are not present in the given collection.

```typescript
collect([1, 2, 3, 4, 5])
    .diff([2, 4, 6])
// → [1, 3, 5]
```

To find missing items:

```typescript
const required = ['name', 'email', 'phone']
const provided = ['name', 'email']
collect(required).diff(provided)
// → ['phone']
```

For Get items present in both collections, use [`intersect`](#intersect). For comparing by keys instead of values, use [`diffKeys`](#diffkeys).

---

### diffUsing()

The `diffUsing` method compares the collection against another array or collection
using a callback. The callback should return 0 when two values are considered equal,
a negative number when the first is less than the second, or a positive number otherwise.

For case-insensitive comparison:

```typescript
collect(['Apple', 'Banana'])
    .diffUsing(['apple', 'cherry'], (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → ['Banana']
```

For comparing using default equality, use [`diff`](#diff). For comparing keys and values with a callback, use [`diffAssocUsing`](#diffassocusing).

---

### diffKeys()

The `diffKeys` method compares the collection against another array or collection
based on its keys. This method returns the key/value pairs in the original
collection whose keys are not present in the given collection.

To find extra fields:

```typescript
collect({ name: 'Alice', age: 30, city: 'NYC' })
    .diffKeys({ name: '', age: 0 })
// → { city: 'NYC' }
```

For comparing by values instead of keys, use [`diff`](#diff). For comparing by both keys and values, use [`diffAssoc`](#diffassoc).

---

### diffKeysUsing()

The `diffKeysUsing` method compares the collection against another array or collection
based on its keys using a callback. The callback should return 0 when two keys are
considered equal.

For case-insensitive key comparison:

```typescript
collect({ Name: 'Alice', AGE: 30 })
    .diffKeysUsing({ name: '', age: 0 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → {} (all keys match case-insensitively)
```

For comparing keys using default equality, use [`diffKeys`](#diffkeys).

---

### diffAssoc()

The `diffAssoc` method compares the collection against another array or collection
based on both its keys and values. This method returns the key/value pairs in the
original collection that are not present in the given collection.

To compare key-value pairs:

```typescript
collect({ color: 'red', size: 'large', price: 100 })
    .diffAssoc({ color: 'red', size: 'medium' })
// → { size: 'large', price: 100 }
```

For comparing by values only, use [`diff`](#diff). For comparing by keys only, use [`diffKeys`](#diffkeys).

---

### diffAssocUsing()

The `diffAssocUsing` method compares the collection against another array or collection
based on its keys and values, using a callback for key comparison. The callback should
return 0 when two keys are considered equal.

For case-insensitive key comparison:

```typescript
collect({ Name: 'Alice', Age: 30 })
    .diffAssocUsing({ name: 'Alice', age: 25 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → { Age: 30 } (Name matches, Age differs in value)
```

For comparing using default key equality, use [`diffAssoc`](#diffassoc). For comparing values with a custom callback, use [`diffUsing`](#diffusing).

---

### intersect()

The `intersect` method removes any values from the original collection that are
not present in the given array or collection. The resulting collection will
preserve the original collection's keys.

To find common elements:

```typescript
collect([1, 2, 3, 4, 5])
    .intersect([2, 4, 6, 8])
// → [2, 4]
```

To check permissions:

```typescript
const userPermissions = ['read', 'write', 'delete']
const required = ['read', 'admin']
collect(userPermissions).intersect(required)
// → ['read']
```

For Get items NOT present in the other collection, use [`diff`](#diff). For Intersect by keys instead of values, use [`intersectByKeys`](#intersectbykeys).

---

### intersectUsing()

The `intersectUsing` method removes values not present in the given array or collection,
using a callback for comparison. The callback should return 0 when two values are
considered equal.

For case-insensitive intersection:

```typescript
collect(['Apple', 'Banana', 'Cherry'])
    .intersectUsing(['apple', 'cherry'], (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → ['Apple', 'Cherry']
```

For Intersect using default equality, use [`intersect`](#intersect).

---

### intersectAssoc()

The `intersectAssoc` method compares the collection against another array or collection,
returning key/value pairs that are present in both. Unlike `intersect`, this method
considers both keys and values when determining matches.

To find matching key-value pairs:

```typescript
collect({ name: 'Alice', age: 30, city: 'NYC' })
    .intersectAssoc({ name: 'Alice', age: 25, city: 'NYC' })
// → { name: 'Alice', city: 'NYC' }
```

For Intersect by values only, use [`intersect`](#intersect). For Intersect by keys only, use [`intersectByKeys`](#intersectbykeys).

---

### intersectAssocUsing()

The `intersectAssocUsing` method compares the collection against another array or collection
based on both keys and values, using a callback for key comparison. The callback should
return 0 when two keys are considered equal.

For case-insensitive key matching:

```typescript
collect({ Name: 'Alice', AGE: 30 })
    .intersectAssocUsing({ name: 'Alice', age: 30 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
// → { Name: 'Alice', AGE: 30 }
```

For Intersect using default key equality, use [`intersectAssoc`](#intersectassoc).

---

### intersectByKeys()

The `intersectByKeys` method removes any keys from the original collection that are
not present in the given array or collection. This is useful for filtering an object
to only include specific fields.

To filter to allowed fields:

```typescript
collect({ name: 'Alice', age: 30, password: 'secret' })
    .intersectByKeys({ name: '', age: '' })
// → { name: 'Alice', age: 30 }
```

For Intersect by values instead of keys, use [`intersect`](#intersect). For Intersect by both keys and values, use [`intersectAssoc`](#intersectassoc).

---

### merge()

The `merge` method merges the given array or collection with the original collection.
If a string key in the given items matches a string key in the original collection,
the given item's value will overwrite the value in the original collection.

To merge objects:

```typescript
collect({ name: 'Alice', age: 25 })
    .merge({ age: 30, city: 'NYC' })
// → { name: 'Alice', age: 30, city: 'NYC' }
```

For arrays, items are appended:

```typescript
collect([1, 2])
    .merge([3, 4])
// → [1, 2, 3, 4]
```

For keeping original values for duplicate keys, use [`union`](#union). For Merge nested objects recursively, use [`mergeRecursive`](#mergerecursive).

---

### mergeRecursive()

The `mergeRecursive` method merges the given array or collection recursively with
the original collection. If a string key in the given items matches a string key
in the original collection, the values for these keys are merged together into an
object, and this is done recursively for nested structures.

For recursive merge:

```typescript
collect({ user: { name: 'Alice', settings: { theme: 'dark' } } })
    .mergeRecursive({ user: { settings: { language: 'en' } } })
// → { user: { name: 'Alice', settings: { theme: 'dark', language: 'en' } } }
```

For Shallow merge (overwrites nested objects), use [`merge`](#merge). For Similar but overwrites instead of merging arrays, use [`replaceRecursive`](#replacerecursive).

---

### union()

The `union` method adds the given array to the collection. If the given array
contains keys that are already in the original collection, the original collection's
values will be preferred. This is the opposite of `merge` which prefers new values.

To prefer original values:

```typescript
collect({ a: 1, b: 2 })
    .union({ b: 3, c: 4 })
// → { a: 1, b: 2, c: 4 }
```

To fill in defaults:

```typescript
const userSettings = collect(user.settings)
    .union(defaultSettings)
// Original settings preserved, defaults fill gaps
```

For preferring new values for duplicate keys, use [`merge`](#merge).

---

### combine()

The `combine` method combines the values of the collection, as keys, with the
values of another array or collection. This is useful for creating key-value
pairs from two separate lists.

To create key-value mapping:

```typescript
collect(['name', 'age', 'city'])
    .combine(['Alice', 30, 'NYC'])
// → { name: 'Alice', age: 30, city: 'NYC' }
```

To build form data:

```typescript
collect(fieldNames)
    .combine(fieldValues)
// → { field1: value1, field2: value2, ... }
```

For Pair by index into nested arrays instead of key-value, use [`zip`](#zip). For Extract key-value pairs from objects, use [`pluck`](/collections/transforming#pluck).

---

### crossJoin()

The `crossJoin` method cross joins the collection's values among the given arrays
or collections, returning a Cartesian product with all possible permutations.

For a two-way cross join:

```typescript
collect(['S', 'M', 'L'])
    .crossJoin(['red', 'blue'])
// → [
//   ['S', 'red'], ['S', 'blue'],
//   ['M', 'red'], ['M', 'blue'],
//   ['L', 'red'], ['L', 'blue']
// ]
```

For a three-way cross join:

```typescript
collect([1, 2])
    .crossJoin(['a', 'b'], [true, false])
// → [[1, 'a', true], [1, 'a', false], [1, 'b', true], ...]
```

For Pair by index instead of creating all combinations, use [`zip`](#zip).

---

### concat()

The `concat` method appends the given array or collection's values onto the end
of another collection. Unlike `merge`, this method does not consider keys and
simply appends all values to the end.

```typescript
collect([1, 2, 3])
    .concat([4, 5, 6])
// → [1, 2, 3, 4, 5, 6]
```

You may chain multiple concatenations:

```typescript
collect(['a'])
    .concat(['b', 'c'])
    .concat(['d'])
// → ['a', 'b', 'c', 'd']
```

For Merge with key consideration, use [`merge`](#merge). For Append single items (mutates collection), use [`push`](#push).

---

### put()

The `put` method sets the given key and value in the collection. If the key
already exists, its value will be overwritten. This method mutates the collection.

```typescript
collect({ a: 1, b: 2 })
    .put('c', 3)
    .put('a', 10)
// → { a: 10, b: 2, c: 3 }
```

To build an object dynamically:

```typescript
collect({})
    .put('name', 'Alice')
    .put('age', 30)
// → { name: 'Alice', age: 30 }
```

For Append without specifying a key, use [`push`](#push). For Retrieve a value by key, use [`get`](/collections/finding#get).

---

### push()

The `push` method appends one or more items to the end of the collection.
This method mutates the collection and returns it for chaining.

To append a single item:

```typescript
collect([1, 2, 3])
    .push(4)
// → [1, 2, 3, 4]
```

To append multiple items:

```typescript
collect(['a', 'b'])
    .push('c', 'd', 'e')
// → ['a', 'b', 'c', 'd', 'e']
```

For Add to the beginning, use [`prepend`](#prepend). For Set by key, use [`put`](#put).

---

### prepend()

The `prepend` method adds an item to the beginning of the collection.
You may optionally pass a second argument to set the key of the prepended item.
This method mutates the collection.

To prepend a value:

```typescript
collect([2, 3, 4])
    .prepend(1)
// → [1, 2, 3, 4]
```

To prepend with a key:

```typescript
collect({ b: 2, c: 3 })
    .prepend(1, 'a')
// → { a: 1, b: 2, c: 3 }
```

For Add to the end, use [`push`](#push). For Prepend multiple values, use [`unshift`](#unshift).

---

### unshift()

The `unshift` method is an alias for the `prepend` method, but accepts multiple
values. It adds one or more items to the beginning of the collection, preserving
their order. This method mutates the collection.

To prepend multiple values:

```typescript
collect([4, 5, 6])
    .unshift(1, 2, 3)
// → [1, 2, 3, 4, 5, 6]
```

For Add single item with optional key, use [`prepend`](#prepend). For Add to the end, use [`push`](#push).

---

### add()

The `add` method is an alias for the `push` method. It appends a single item
to the end of the collection. This method mutates the collection.

To add an item:

```typescript
collect([1, 2, 3])
    .add(4)
// → [1, 2, 3, 4]
```

For Primary method (supports multiple items), use [`push`](#push).

---

### multiply()

The `multiply` method creates multiple copies of all items in the collection.
The resulting collection contains the original items repeated the specified
number of times.

To double the items:

```typescript
collect([1, 2, 3])
    .multiply(2)
// → [1, 2, 3, 1, 2, 3]
```

To repeat for display:

```typescript
collect(['*'])
    .multiply(5)
    .join('')
// → '*****'
```

For Pad to a specific size, use [`pad`](/collections/transforming#pad). For Generate a sequence of numbers, use [`range`](/collections/transforming#range).

---

### replace()

The `replace` method behaves similarly to `merge`; however, in addition to
overwriting matching items that have string keys, the `replace` method will
also overwrite items in the collection that have matching numeric keys.

```typescript
collect({ name: 'Alice', age: 25 })
    .replace({ age: 30, city: 'NYC' })
// → { name: 'Alice', age: 30, city: 'NYC' }
```

To replace array items by index:

```typescript
collect(['a', 'b', 'c'])
    .replace({ 1: 'B', 2: 'C' })
// → ['a', 'B', 'C']
```

For Merge without replacing by numeric key, use [`merge`](#merge). For Replace nested objects recursively, use [`replaceRecursive`](#replacerecursive).

---

### replaceRecursive()

The `replaceRecursive` method works like `replace`, but it will recurse into
nested objects and apply the same replacement process to the inner values.

For recursive replacement:

```typescript
collect({
    user: { name: 'Alice', settings: { theme: 'dark', lang: 'en' } }
}).replaceRecursive({
    user: { settings: { theme: 'light' } }
})
// → { user: { name: 'Alice', settings: { theme: 'light', lang: 'en' } } }
```

For Shallow replacement, use [`replace`](#replace). For Similar but merges arrays instead of replacing, use [`mergeRecursive`](#mergerecursive).

---

### with()

The `with` method joins the collection with a related collection, enabling
operations that correlate items between the two. This is useful for scenarios
similar to database joins where you need to work with related data sets.

To join users with orders:

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

For Create cartesian product of two collections, use [`crossJoin`](#crossjoin). For Pair items by index, use [`zip`](#zip).

---
