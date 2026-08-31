# Combining

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### zip()

The **zip** method merges together the values of the given array with the values
of the original collection at their corresponding index.

```typescript
collect(['a', 'b', 'c'])
    .zip([1, 2, 3])
    .all()
// → [['a', 1], ['b', 2], ['c', 3]]
```

With different lengths:

```typescript
collect(['a', 'b'])
    .zip([1, 2, 3])
    .all()
// → [['a', 1], ['b', 2]]
```

To use values as keys/values, use [`combine`](#combine).

---

### diff()

The **diff** method compares the collection against another array or collection
based on its values. This method returns the values in the original collection
that are not present in the given collection.

```typescript
collect([1, 2, 3, 4, 5])
    .diff([2, 4, 6])
    .all()
// → [1, 3, 5]
```

With strings:

```typescript
collect(['a', 'b', 'c'])
    .diff(['b', 'd'])
    .all()
// → ['a', 'c']
```

To compare by keys, use [`diffKeys`](#diffkeys). To compare by key and value, use [`diffAssoc`](#diffassoc).

---

### diffUsing()

The **diffUsing** method compares the collection against another array or collection
using a callback for comparison. The callback should return 0 when two values are
considered equal.

Case-insensitive diff:

```typescript
collect(['Apple', 'Banana', 'Cherry'])
    .diffUsing(['apple', 'cherry'], (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
    .all()
// → ['Banana']
```

To compare using default equality, use [`diff`](#diff).

---

### diffKeys()

The **diffKeys** method compares the collection against another array or collection
based on its keys. This method returns the key/value pairs in the original collection
that are not present in the given collection.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .diffKeys({ a: 10, c: 30, d: 40 })
    .all()
// → { b: 2 }
```

To compare by values, use [`diff`](#diff). To compare by key and value, use [`diffAssoc`](#diffassoc).

---

### diffKeysUsing()

The **diffKeysUsing** method compares the collection against another array or collection
based on its keys using a callback. The callback should return 0 when two keys are
considered equal.

Case-insensitive key comparison:

```typescript
collect({ Name: 'Alice', AGE: 30 })
    .diffKeysUsing({ name: '', age: 0 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
    .all()
// → {} (all keys match case-insensitively)
```

To compare keys using default equality, use [`diffKeys`](#diffkeys).

---

### diffAssoc()

The **diffAssoc** method compares the collection against another array or collection
based on its keys and values. This method returns the key/value pairs in the original
collection that are not present in the given collection.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .diffAssoc({ a: 1, b: 20, d: 4 })
    .all()
// → { b: 2, c: 3 }
```

To compare by values only, use [`diff`](#diff). To compare by keys only, use [`diffKeys`](#diffkeys).

---

### diffAssocUsing()

The **diffAssocUsing** method compares the collection against another array or collection
based on its keys and values, using a callback for key comparison. The callback should
return 0 when two keys are considered equal.

Case-insensitive key comparison:

```typescript
collect({ Name: 'Alice', Age: 30 })
    .diffAssocUsing({ name: 'Alice', age: 25 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
    .all()
// → { Age: 30 } (Name matches, Age differs in value)
```

To compare using default key equality, use [`diffAssoc`](#diffassoc). To compare values with a custom callback, use [`diffUsing`](#diffusing).

---

### intersect()

The **intersect** method removes any values from the original collection that are not
present in the given array or collection.

```typescript
collect([1, 2, 3, 4, 5])
    .intersect([2, 4, 6])
    .all()
// → [2, 4]
```

With strings:

```typescript
collect(['a', 'b', 'c'])
    .intersect(['b', 'c', 'd'])
    .all()
// → ['b', 'c']
```

To intersect by keys, use [`intersectByKeys`](#intersectbykeys). To get values NOT in the other collection, use [`diff`](#diff).

---

### intersectUsing()

The **intersectUsing** method removes values not present in the given array or collection,
using a callback for comparison. The callback should return 0 when two values are
considered equal.

Case-insensitive intersection:

```typescript
collect(['Apple', 'Banana', 'Cherry'])
    .intersectUsing(['apple', 'cherry'], (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
    .all()
// → ['Apple', 'Cherry']
```

To intersect using default equality, use [`intersect`](#intersect).

---

### intersectAssoc()

The **intersectAssoc** method compares the collection against another array or collection,
returning key/value pairs that are present in both. Unlike `intersect`, this method
considers both keys and values when determining matches.

Find matching key-value pairs:

```typescript
collect({ name: 'Alice', age: 30, city: 'NYC' })
    .intersectAssoc({ name: 'Alice', age: 25, city: 'NYC' })
    .all()
// → { name: 'Alice', city: 'NYC' }
```

To intersect by values only, use [`intersect`](#intersect). To intersect by keys only, use [`intersectByKeys`](#intersectbykeys).

---

### intersectAssocUsing()

The **intersectAssocUsing** method compares the collection against another array or collection
based on both keys and values, using a callback for key comparison. The callback should
return 0 when two keys are considered equal.

Case-insensitive key matching:

```typescript
collect({ Name: 'Alice', AGE: 30 })
    .intersectAssocUsing({ name: 'Alice', age: 30 }, (a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    )
    .all()
// → { Name: 'Alice', AGE: 30 }
```

To intersect using default key equality, use [`intersectAssoc`](#intersectassoc).

---

### intersectByKeys()

The **intersectByKeys** method removes any keys from the original collection that are
not present in the given array or collection.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .intersectByKeys({ a: 10, c: 30, d: 40 })
    .all()
// → { a: 1, c: 3 }
```

To intersect by values, use [`intersect`](#intersect). To get keys NOT in the other collection, use [`diffKeys`](#diffkeys).

---

### merge()

The **merge** method merges the given array or collection with the original collection.
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

To keeping original values for duplicate keys, use [`union`](#union). To merge nested objects recursively, use [`mergeRecursive`](#mergerecursive).

---

### mergeRecursive()

The **mergeRecursive** method merges the given array or collection recursively with
the original collection. If a string key in the given items matches a string key
in the original collection, then the values for these keys are merged together
into an array, and this is done recursively.

Deep merge of settings:

```typescript
collect({ user: { name: 'Alice', settings: { theme: 'dark' } } })
    .mergeRecursive({ user: { settings: { language: 'en' } } })
    .all()
// → { user: { name: 'Alice', settings: { theme: 'dark', language: 'en' } } }
```

Merging nested objects:

```typescript
collect({ a: { b: 1 } })
    .mergeRecursive({ a: { c: 2 } })
    .all()
// → { a: { b: 1, c: 2 } }
```

To shallow merge (overwrites nested objects), use [`merge`](#merge). To similar but overwrites instead of merging arrays, use [`replaceRecursive`](#replacerecursive).

---

### union()

The **union** method adds the given array to the collection. If the given array
contains keys that are already in the original collection, the original
collection's values will be preferred.

```typescript
collect({ a: 1, b: 2 })
    .union({ b: 3, c: 4 })
    .all()
// → { a: 1, b: 2, c: 4 }
```

To overwrites existing keys, use [`merge`](#merge). To use values as keys, use [`combine`](#combine).

---

### combine()

The **combine** method combines the values of the collection, as keys, with the
values of another array or collection.

```typescript
collect(['name', 'age'])
    .combine(['Taylor', 25])
    .all()
// → { name: 'Taylor', age: 25 }
```

With more keys than values:

```typescript
collect(['a', 'b', 'c'])
    .combine([1, 2])
    .all()
// → { a: 1, b: 2, c: undefined }
```

To merge collections element-by-element, use [`zip`](#zip). To create key/value pairs from callback, use [`mapWithKeys`](/collections/transforming#mapwithkeys).

---

### crossJoin()

The **crossJoin** method cross joins the collection's values among the given
arrays or collections, returning a Cartesian product with all possible permutations.

Two-way cross join:

```typescript
collect(['S', 'M', 'L'])
    .crossJoin(['red', 'blue'])
    .all()
// → [
//   ['S', 'red'], ['S', 'blue'],
//   ['M', 'red'], ['M', 'blue'],
//   ['L', 'red'], ['L', 'blue']
// ]
```

Three-way cross join:

```typescript
collect([1, 2])
    .crossJoin(['a', 'b'], [true, false])
    .all()
// → [[1, 'a', true], [1, 'a', false], [1, 'b', true], ...]
```

To pair by index instead of creating all combinations, use [`zip`](#zip).

---

### concat()

The **concat** method appends the given array or collection's values onto the end
of another collection. Unlike `merge`, this method does not consider keys and
simply appends all values to the end.

```typescript
collect([1, 2, 3])
    .concat([4, 5, 6])
// → [1, 2, 3, 4, 5, 6]
```

Chain multiple concatenations:

```typescript
collect(['a'])
    .concat(['b', 'c'])
    .concat(['d'])
// → ['a', 'b', 'c', 'd']
```

To merge with key consideration, use [`merge`](#merge). To append single items (mutates collection), use [`push`](/collections/transforming#push).

---

### replace()

The **replace** method replaces items in the collection by key. Existing keys will be
overwritten with the new values. This is useful for merging settings or configurations
where you want to ensure certain keys are updated.

Replace by numeric index:

```typescript
collect(['a', 'b', 'c'])
    .replace({ 1: 'B', 2: 'C' })
    .all()
// → ['a', 'B', 'C']
```

Replace object properties:

```typescript
collect({ name: 'Alice', age: 30 })
    .replace({ age: 31 })
    .all()
// → { name: 'Alice', age: 31 }
```

To merge without replacing by numeric key, use [`merge`](#merge). To replace nested objects recursively, use [`replaceRecursive`](#replacerecursive).

---

### replaceRecursive()

The **replaceRecursive** method works like `replace`, but it will recurse into
nested objects and apply the same replacement process to the inner values.

Recursive replacement:

```typescript
collect({
    user: { name: 'Alice', settings: { theme: 'dark', lang: 'en' } }
}).replaceRecursive({
    user: { settings: { theme: 'light' } }
}).all()
// → { user: { name: 'Alice', settings: { theme: 'light', lang: 'en' } } }
```

To shallow replacement, use [`replace`](#replace). To similar but merges arrays instead of replacing, use [`mergeRecursive`](#mergerecursive).

---

### with()

The **with** method pairs the collection with a related collection, creating a
WithCollection that allows ORM-style operations where each primary item can be
processed alongside filtered related items.

Pair users with their orders:

```typescript
const users = collect([{ id: 1, name: 'Alice' }]);
const orders = collect([{ userId: 1, total: 100 }]);
users.with(orders).map((user, related) => ({
  ...user,
  orderCount: related.count(),
}))
```

To create cartesian product of two collections, use [`crossJoin`](#crossjoin). To pair items by index, use [`zip`](#zip).

---
