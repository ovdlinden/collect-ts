# Grouping

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### chunk()

Split the collection into chunks of the given size.

```typescript
collect([1, 2, 3, 4, 5])
    .chunk(2)
// → [
//   Collection [1, 2],
//   Collection [3, 4],
//   Collection [5],
// ]
```

For Split into N groups, use [`split`](#split). For Create overlapping windows, use [`sliding`](#sliding).

---

### chunkWhile()

The `chunkWhile` method breaks the collection into multiple, smaller collections
based on the evaluation of the given callback. The callback receives the current
item, its key, and the current chunk being built. A new chunk starts whenever
the callback returns `false`.

To group consecutive numbers:

```typescript
collect([1, 2, 3, 5, 6])
    .chunkWhile((v, k, chunk) => v === chunk.last() + 1)
// → [
//   [1, 2, 3],
//   [5, 6],
// ]
```

For Split into fixed-size chunks, use [`chunk`](#chunk). For Split into a specific number of groups, use [`split`](#split).

---

### split()

The `split` method breaks a collection into the given number of groups,
distributing extra items across earlier groups to balance sizes as evenly
as possible.

To split into three groups:

```typescript
collect([1, 2, 3, 4, 5])
    .split(3)
// → [
//   [1, 2],
//   [3, 4],
//   [5],
// ]
```

For Fill non-terminal groups completely first, use [`splitIn`](#splitin). For Split into fixed-size chunks instead, use [`chunk`](#chunk).

---

### splitIn()

The `splitIn` method breaks a collection into the given number of groups,
filling non-terminal groups completely before allocating the remainder to
the final group. Unlike `split`, which balances group sizes, `splitIn`
creates full-sized chunks until items run out.

To split into three groups:

```typescript
collect([1, 2, 3, 4, 5, 6, 7])
    .splitIn(3)
// → [
//   [1, 2, 3],
//   [4, 5, 6],
//   [7],
// ]
```

For Distribute items evenly across groups, use [`split`](#split). For Split into fixed-size chunks, use [`chunk`](#chunk).

---

### countBy()

The `countBy` method counts the occurrences of values in the collection.
By default it counts by the value itself, but you can pass a callback or
property key to count by a derived grouping key.

```typescript
collect([1, 2, 2, 3])
    .countBy()
// → {'1': 1, '2': 2, '3': 1}
```

To count by email domain:

```typescript
collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com'])
    .countBy(email => email.split('@')[1])
// → {'gmail.com': 2, 'yahoo.com': 1}
```

For Group items instead of counting them, use [`groupBy`](#groupby). For Get total item count, use [`count`](/collections/aggregating#count).

---

### groupBy()

Group items by a key or callback result.

By property:

```typescript
collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
  { name: 'James', role: 'editor' },
])
  .groupBy('role')
// → {
//     admin: [{ name: 'Taylor', role: 'admin' }],
//     editor: [
//       { name: 'Abigail', role: 'editor' },
//       { name: 'James', role: 'editor' },
//     ],
//   }
```

You may also pass a callback:

```typescript
collect([
  { id: 1, total: 150 },
  { id: 2, total: 50 },
  { id: 3, total: 200 },
])
  .groupBy(o => o.total > 100 ? 'large' : 'small')
// → {
//     large: [{ id: 1, total: 150 }, { id: 3, total: 200 }],
//     small: [{ id: 2, total: 50 }],
//   }
```

For Similar but keeps only the last item per key, use [`keyBy`](#keyby). For Split into two groups by condition, use [`partition`](#partition).

---

### keyBy()

Key the collection by a field or callback result.

If multiple items have the same key, only the last one is kept.

```typescript
collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
  .keyBy('id')
// → {
//     1: { id: 1, name: 'Taylor' },
//     2: { id: 2, name: 'Abigail' },
//   }
```

For Similar but keeps all items per key, use [`groupBy`](#groupby). For Transform and key in one step, use [`mapWithKeys`](/collections/transforming#mapwithkeys).

---

### partition()

Split the collection into two groups: items passing the test and items failing.

```typescript
const [active, inactive] = collect([
  { name: 'Taylor', active: true },
  { name: 'Abigail', active: false },
  { name: 'James', active: true },
]).partition(u => u.active)
// active  → [{ name: 'Taylor', ... }, { name: 'James', ... }]
// inactive → [{ name: 'Abigail', ... }]
```

You may also use key/value syntax:

```typescript
const [admins, others] = collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
]).partition('role', 'admin')
// admins → [{ name: 'Taylor', role: 'admin' }]
// others → [{ name: 'Abigail', role: 'editor' }]
```

For Split into multiple groups, use [`groupBy`](#groupby). For Keep only passing items, use [`filter`](/collections/filtering#filter).

---

### sliding()

The `sliding` method returns a new collection of chunks representing a
"sliding window" view of the items. Each chunk contains `size` consecutive
items, and the window advances by `step` items between chunks.

For pairs of consecutive items:

```typescript
collect([1, 2, 3, 4, 5])
    .sliding(2)
// → [[1, 2], [2, 3], [3, 4], [4, 5]]
```

For triplets with a step of 2:

```typescript
collect([1, 2, 3, 4, 5, 6])
    .sliding(3, 2)
// → [[1, 2, 3], [3, 4, 5]]
```

For Non-overlapping fixed-size chunks, use [`chunk`](#chunk). For Conditional chunking, use [`chunkWhile`](#chunkwhile).

---
