# Sorting

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### reverse()

The **reverse** method reverses the order of the collection's items, preserving the
original keys.

```typescript
collect([1, 2, 3, 4, 5])
    .reverse()
// → [5, 4, 3, 2, 1]
```

To sort items, use [`sort`](#sort). To sort in descending order, use [`sortDesc`](#sortdesc).

---

### shuffle()

The **shuffle** method randomly shuffles the items in the collection.

Uses the Fisher-Yates algorithm for unbiased shuffling.

```typescript
collect([1, 2, 3, 4, 5])
    .shuffle()
// → [3, 1, 4, 5, 2] (random order)
```

To get random item(s), use [`random`](/collections/finding#random). To sort items, use [`sort`](#sort).

---

### sort()

The **sort** method sorts the collection. The sorted collection keeps the original
array keys for associative collections, but resets numeric keys for array collections.

```typescript
collect([3, 1, 4, 1, 5])
    .sort()
    .all()
// → [1, 1, 3, 4, 5]
```

With custom comparator:

```typescript
collect(['banana', 'apple', 'cherry'])
    .sort((a, b) => a.length - b.length)
    .all()
// → ['apple', 'banana', 'cherry']
```

Descending order:

```typescript
collect([1, 2, 3])
    .sort((a, b) => b - a)
    .all()
// → [3, 2, 1]
```

To sort in descending order, use [`sortDesc`](#sortdesc). To sort by a key or callback, use [`sortBy`](#sortby).

---

### sortDesc()

The **sortDesc** method sorts the collection in descending order.

```typescript
collect([1, 3, 2, 5, 4])
    .sortDesc()
    .all()
// → [5, 4, 3, 2, 1]
```

With strings:

```typescript
collect(['apple', 'cherry', 'banana'])
    .sortDesc()
    .all()
// → ['cherry', 'banana', 'apple']
```

To sort in ascending order, use [`sort`](#sort). To sort by key in descending order, use [`sortByDesc`](#sortbydesc).

---

### sortBy()

The **sortBy** method sorts the collection by the given key.

The sorted collection keeps the original array keys, so in the following example
we will use the `values` method to reset the keys to consecutively numbered indexes.

```typescript
collect([
  { name: 'Taylor', age: 32 },
  { name: 'Abigail', age: 28 },
])
  .sortBy('name')
// → [
//     { name: 'Abigail', age: 28 },
//     { name: 'Taylor', age: 32 },
//   ]
```

Pass a callback:

```typescript
collect([
  { name: 'Taylor', age: 32 },
  { name: 'Abigail', age: 28 },
])
  .sortBy(u => u.age)
// → [
//     { name: 'Abigail', age: 28 },
//     { name: 'Taylor', age: 32 },
//   ]
```

To sort in descending order, use [`sortByDesc`](#sortbydesc). To sort with custom comparator, use [`sort`](#sort).

---

### sortByDesc()

The **sortByDesc** method sorts the collection in the opposite order as the `sortBy` method.

This method has the same signature as `sortBy`, but will sort in descending order.

```typescript
collect([
  { name: 'Taylor', age: 32 },
  { name: 'Abigail', age: 28 },
])
  .sortByDesc('age')
// → [
//     { name: 'Taylor', age: 32 },
//     { name: 'Abigail', age: 28 },
//   ]
```

Pass a callback:

```typescript
collect([
  { name: 'Chair', price: 100 },
  { name: 'Desk', price: 200 },
])
  .sortByDesc(p => p.price)
// → [
//     { name: 'Desk', price: 200 },
//     { name: 'Chair', price: 100 },
//   ]
```

To sort in ascending order, use [`sortBy`](#sortby). To sort simple values descending, use [`sortDesc`](#sortdesc).

---

### sortKeys()

The **sortKeys** method sorts the collection by its keys.

```typescript
collect({ b: 2, a: 1, c: 3 })
    .sortKeys()
    .all()
// → { a: 1, b: 2, c: 3 }
```

To sort keys in descending order, use [`sortKeysDesc`](#sortkeysdesc). To sort by values, use [`sort`](#sort).

---

### sortKeysDesc()

The **sortKeysDesc** method sorts the collection by its keys in descending order.

```typescript
collect({ a: 1, c: 3, b: 2 })
    .sortKeysDesc()
    .all()
// → { c: 3, b: 2, a: 1 }
```

To sort keys in ascending order, use [`sortKeys`](#sortkeys). To sort values in descending order, use [`sortDesc`](#sortdesc).

---

### sortKeysUsing()

The **sortKeysUsing** method sorts the collection by its keys using a callback.
The callback should return a negative, zero, or positive integer based on comparison.

Numeric string sorting:

```typescript
collect({ '10': 'ten', '2': 'two', '1': 'one' })
    .sortKeysUsing((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .all()
// → { '1': 'one', '2': 'two', '10': 'ten' }
```

Case-insensitive sorting:

```typescript
collect({ B: 2, a: 1, C: 3 })
    .sortKeysUsing((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .all()
// → { a: 1, B: 2, C: 3 }
```

To sort keys with default comparison, use [`sortKeys`](#sortkeys). To sort keys in descending order, use [`sortKeysDesc`](#sortkeysdesc).

---
