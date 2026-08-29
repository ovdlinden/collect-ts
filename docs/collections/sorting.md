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

For Sort items, see the [sort](#sort) method. For Sort in descending order, see the [sortDesc](#sortdesc) method. For Randomize order, see the [shuffle](#shuffle) method.

---

### shuffle()

The `shuffle` method randomly shuffles the items in the collection.

Uses the Fisher-Yates algorithm for unbiased shuffling.

```typescript
collect([1, 2, 3, 4, 5])
    .shuffle()
// → [3, 1, 4, 5, 2] (random order)
```

For Get random item(s), see the [random](/collections/finding#random) method. For Sort items, see the [sort](#sort) method. For Reverse order, see the [reverse](#reverse) method.

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

Custom comparator

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

For Sort in descending order, see the [sortDesc](#sortdesc) method. For Sort by property or callback, see the [sortBy](#sortby) method. For Sort by keys instead of values, see the [sortKeys](#sortkeys) method. For Reverse the order, see the [reverse](#reverse) method.

---

### sortDesc()

The `sortDesc` method sorts the collection in the opposite order as the `sort` method.

```typescript
collect([1, 2, 3, 4, 5])
    .sortDesc()
// → [5, 4, 3, 2, 1]
```

For Sort in ascending order, see the [sort](#sort) method. For Sort by property in descending order, see the [sortByDesc](#sortbydesc) method.

---

### sortBy()

The `sortBy` method sorts the collection by the given key.

The sorted collection keeps the original array keys, so in the following example
we will use the `values` method to reset the keys to consecutively numbered indexes.

By property

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

By callback

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

For Sort in descending order, see the [sortByDesc](#sortbydesc) method. For Sort with custom comparator, see the [sort](#sort) method. For Sort by keys instead of values, see the [sortKeys](#sortkeys) method. For Reverse the order, see the [reverse](#reverse) method.

---

### sortByDesc()

The `sortByDesc` method sorts the collection in the opposite order as the `sortBy` method.

This method has the same signature as `sortBy`, but will sort in descending order.

By property

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

By callback

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

For Sort in ascending order, see the [sortBy](#sortby) method. For Sort simple values descending, see the [sortDesc](#sortdesc) method.

---

### sortKeys()

The `sortKeys` method sorts the collection by the keys of the underlying associative array.

Uses locale-aware string comparison for key ordering.

```typescript
collect({ b: 2, a: 1, c: 3 })
    .sortKeys()
// → { a: 1, b: 2, c: 3 }
```

For Sort keys in descending order, see the [sortKeysDesc](#sortkeysdesc) method. For Sort keys with custom callback, see the [sortKeysUsing](#sortkeysusing) method. For Sort by values, see the [sortBy](#sortby) method.

---

### sortKeysDesc()

The `sortKeysDesc` method sorts the collection by the keys in descending order.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .sortKeysDesc()
// → { c: 3, b: 2, a: 1 }
```

For Sort keys in ascending order, see the [sortKeys](#sortkeys) method. For Sort keys with custom callback, see the [sortKeysUsing](#sortkeysusing) method.

---

### sortKeysUsing()

The `sortKeysUsing` method sorts the collection by its keys using a callback.

The callback must be a comparison function returning a negative integer, zero, or
a positive integer to indicate sort order.

Natural sort

```typescript
collect({ 'item2': 'b', 'item10': 'c', 'item1': 'a' })
    .sortKeysUsing((a, b) => a.localeCompare(b, undefined, { numeric: true }))
// → { item1: 'a', item2: 'b', item10: 'c' }
```

For Sort keys alphabetically, see the [sortKeys](#sortkeys) method. For Sort keys in descending order, see the [sortKeysDesc](#sortkeysdesc) method.

---
