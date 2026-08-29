# Sorting

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### reverse()

The `reverse` method reverses the order of the collection's items, preserving the
original keys.

```typescript
collect([1, 2, 3, 4, 5])
    .reverse()
// → [5, 4, 3, 2, 1]
```

For Sort items, use [`sort`](#sort). For Sort in descending order, use [`sortDesc`](#sortdesc).

---

### shuffle()

The `shuffle` method randomly shuffles the items in the collection.

Uses the Fisher-Yates algorithm for unbiased shuffling.

```typescript
collect([1, 2, 3, 4, 5])
    .shuffle()
// → [3, 1, 4, 5, 2] (random order)
```

For Get random item(s), use [`random`](/collections/finding#random). For Sort items, use [`sort`](#sort).

---

### sort()

The `sort` method sorts the collection.

The sorted collection keeps the original keys, but the order of items changes. You may
pass a custom comparison callback for more control over sorting behavior.

```typescript
collect([5, 3, 1, 2, 4])
    .sort()
// → [1, 2, 3, 4, 5]
```

You may pass a custom comparator:

```typescript
collect([
  { name: 'Taylor', age: 32 },
  { name: 'Abigail', age: 28 },
])
  .sort((a, b) => a.age - b.age)
// → [
//     { name: 'Abigail', age: 28 },
//     { name: 'Taylor', age: 32 },
//   ]
```

For Sort in descending order, use [`sortDesc`](#sortdesc). For Sort by property or callback, use [`sortBy`](#sortby).

---

### sortDesc()

The `sortDesc` method sorts the collection in the opposite order as the `sort` method.

```typescript
collect([1, 2, 3, 4, 5])
    .sortDesc()
// → [5, 4, 3, 2, 1]
```

For Sort in ascending order, use [`sort`](#sort). For Sort by property in descending order, use [`sortByDesc`](#sortbydesc).

---

### sortBy()

The `sortBy` method sorts the collection by the given key.

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

You may also pass a callback:

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

For Sort in descending order, use [`sortByDesc`](#sortbydesc). For Sort with custom comparator, use [`sort`](#sort).

---

### sortByDesc()

The `sortByDesc` method sorts the collection in the opposite order as the `sortBy` method.

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

You may also pass a callback:

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

For Sort in ascending order, use [`sortBy`](#sortby). For Sort simple values descending, use [`sortDesc`](#sortdesc).

---

### sortKeys()

The `sortKeys` method sorts the collection by the keys of the underlying associative array.

Uses locale-aware string comparison for key ordering.

```typescript
collect({ b: 2, a: 1, c: 3 })
    .sortKeys()
// → { a: 1, b: 2, c: 3 }
```

For Sort keys in descending order, use [`sortKeysDesc`](#sortkeysdesc). For Sort keys with custom callback, use [`sortKeysUsing`](#sortkeysusing).

---

### sortKeysDesc()

The `sortKeysDesc` method sorts the collection by the keys in descending order.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .sortKeysDesc()
// → { c: 3, b: 2, a: 1 }
```

For Sort keys in ascending order, use [`sortKeys`](#sortkeys). For Sort keys with custom callback, use [`sortKeysUsing`](#sortkeysusing).

---

### sortKeysUsing()

The `sortKeysUsing` method sorts the collection by its keys using a callback.

The callback must be a comparison function returning a negative integer, zero, or
a positive integer to indicate sort order.

For natural sorting:

```typescript
collect({ 'item2': 'b', 'item10': 'c', 'item1': 'a' })
    .sortKeysUsing((a, b) => a.localeCompare(b, undefined, { numeric: true }))
// → { item1: 'a', item2: 'b', item10: 'c' }
```

For Sort keys alphabetically, use [`sortKeys`](#sortkeys). For Sort keys in descending order, use [`sortKeysDesc`](#sortkeysdesc).

---
