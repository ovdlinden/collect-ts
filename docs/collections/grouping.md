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

For Split into N groups, see the [split](#split) method. For Create overlapping windows, see the [sliding](#sliding) method. For Group by key/callback, see the [groupBy](#groupby) method.

---

### chunkWhile()

The `chunkWhile` method breaks the collection into multiple, smaller collections
based on the evaluation of the given callback. The callback receives the current
item, its key, and the current chunk being built. A new chunk starts whenever
the callback returns `false`.

Grouping consecutive numbers

```typescript
collect([1, 2, 3, 5, 6])
    .chunkWhile((v, k, chunk) => v === chunk.last() + 1)
// → [
//   [1, 2, 3],
//   [5, 6],
// ]
```

For Split into fixed-size chunks, see the [chunk](#chunk) method. For Split into a specific number of groups, see the [split](#split) method. For Group by a key or callback result, see the [groupBy](#groupby) method.

---

### split()

The `split` method breaks a collection into the given number of groups,
distributing extra items across earlier groups to balance sizes as evenly
as possible.

Splitting into three groups

```typescript
collect([1, 2, 3, 4, 5])
    .split(3)
// → [
//   [1, 2],
//   [3, 4],
//   [5],
// ]
```

For Fill non-terminal groups completely first, see the [splitIn](#splitin) method. For Split into fixed-size chunks instead, see the [chunk](#chunk) method.

---

### splitIn()

The `splitIn` method breaks a collection into the given number of groups,
filling non-terminal groups completely before allocating the remainder to
the final group. Unlike `split`, which balances group sizes, `splitIn`
creates full-sized chunks until items run out.

Splitting into three groups

```typescript
collect([1, 2, 3, 4, 5, 6, 7])
    .splitIn(3)
// → [
//   [1, 2, 3],
//   [4, 5, 6],
//   [7],
// ]
```

For Distribute items evenly across groups, see the [split](#split) method. For Split into fixed-size chunks, see the [chunk](#chunk) method.

---

### countBy()

The `countBy` method counts the occurrences of values in the collection.
By default it counts by the value itself, but you can pass a callback or
property key to count by a derived grouping key.

Counting values

```typescript
collect([1, 2, 2, 3])
    .countBy()
// → {'1': 1, '2': 2, '3': 1}
```

Counting by email domain

```typescript
collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com'])
    .countBy(email => email.split('@')[1])
// → {'gmail.com': 2, 'yahoo.com': 1}
```

For Group items instead of counting them, see the [groupBy](#groupby) method. For Get total item count, see the [count](/collections/aggregating#count) method.

---

### groupBy()

Group items by a key or callback result.

By property

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

By callback

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

For Similar but keeps only the last item per key, see the [keyBy](#keyby) method. For Split into two groups by condition, see the [partition](#partition) method. For Split into groups of fixed size, see the [chunk](#chunk) method. For Count items per group instead of collecting, see the [countBy](#countby) method.

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

For Similar but keeps all items per key, see the [groupBy](#groupby) method. For Transform and key in one step, see the [mapWithKeys](/collections/transforming#mapwithkeys) method.

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

With key/value syntax

```typescript
const [admins, others] = collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
]).partition('role', 'admin')
// admins → [{ name: 'Taylor', role: 'admin' }]
// others → [{ name: 'Abigail', role: 'editor' }]
```

For Split into multiple groups, see the [groupBy](#groupby) method. For Keep only passing items, see the [filter](/collections/filtering#filter) method.

---

### sliding()

The `sliding` method returns a new collection of chunks representing a
"sliding window" view of the items. Each chunk contains `size` consecutive
items, and the window advances by `step` items between chunks.

Pairs of consecutive items

```typescript
collect([1, 2, 3, 4, 5])
    .sliding(2)
// → [[1, 2], [2, 3], [3, 4], [4, 5]]
```

Triplets with step of 2

```typescript
collect([1, 2, 3, 4, 5, 6])
    .sliding(3, 2)
// → [[1, 2, 3], [3, 4, 5]]
```

For Non-overlapping fixed-size chunks, see the [chunk](#chunk) method. For Conditional chunking, see the [chunkWhile](#chunkwhile) method.

---
