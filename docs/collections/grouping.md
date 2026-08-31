# Grouping

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

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

To split into N groups, use [`split`](#split). To create overlapping windows, use [`sliding`](#sliding).

---

### chunkWhile() <TryInPlayground code="collect([1, 2, 3, 5, 6, 10])&#10;    .chunkWhile((value, key, chunk) =>&#10;        chunk.last() === value - 1&#10;    )&#10;    .toArray()&#10;// → [[1, 2, 3], [5, 6], [10]]" />

The **chunkWhile** method breaks the collection into multiple, smaller collections
based on the evaluation of the given callback.

Group consecutive ascending numbers:

```typescript
collect([1, 2, 3, 5, 6, 10])
    .chunkWhile((value, key, chunk) =>
        chunk.last() === value - 1
    )
    .toArray()
// → [[1, 2, 3], [5, 6], [10]]
```

Group by first letter:

```typescript
collect(['apple', 'apricot', 'banana', 'berry'])
    .chunkWhile((value, key, chunk) =>
        chunk.first()?.[0] === value[0]
    )
    .toArray()
// → [['apple', 'apricot'], ['banana', 'berry']]
```

To fixed-size chunks, use [`chunk`](#chunk). To group by key/callback, use [`groupBy`](#groupby).

---

### split()

The **split** method breaks a collection into the given number of groups,
distributing extra items across earlier groups to balance sizes.

```typescript
collect([1, 2, 3, 4, 5])
    .split(3)
    .toArray()
// → [[1, 2], [3, 4], [5]]
```

With even division:

```typescript
collect([1, 2, 3, 4, 5, 6])
    .split(3)
    .toArray()
// → [[1, 2], [3, 4], [5, 6]]
```

To split with fewer groups allowed, use [`splitIn`](#splitin). To fixed-size chunks, use [`chunk`](#chunk).

---

### splitIn()

The **splitIn** method breaks a collection into the given number of groups,
filling non-terminal groups completely before allocating the remainder
to the final group.

```typescript
collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .splitIn(3)
    .toArray()
// → [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
```

To balanced distribution, use [`split`](#split). To fixed-size chunks, use [`chunk`](#chunk).

---

### countBy()

The **countBy** method counts the occurrences of values in the collection.
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

To group items instead of counting them, use [`groupBy`](#groupby). To get total item count, use [`count`](/collections/aggregating#count).

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

Pass a callback:

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

To similar but keeps only the last item per key, use [`keyBy`](#keyby). To split into two groups by condition, use [`partition`](#partition).

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

To similar but keeps all items per key, use [`groupBy`](#groupby). To transform and key in one step, use [`mapWithKeys`](/collections/transforming#mapwithkeys).

---

### partition() <TryInPlayground code="const [active, inactive] = collect([&#10;  { name: 'Taylor', active: true },&#10;  { name: 'Abigail', active: false },&#10;  { name: 'James', active: true },&#10;]).partition(u => u.active)&#10;// active  → [{ name: 'Taylor', ... }, { name: 'James', ... }]&#10;// inactive → [{ name: 'Abigail', ... }]" />

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

Also use key/value syntax:

```typescript
const [admins, others] = collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
]).partition('role', 'admin')
// admins → [{ name: 'Taylor', role: 'admin' }]
// others → [{ name: 'Abigail', role: 'editor' }]
```

To split into multiple groups, use [`groupBy`](#groupby). To keep only passing items, use [`filter`](/collections/filtering#filter).

---

### sliding()

The **sliding** method returns a new collection of chunks representing a
"sliding window" view of the items in the collection.

Default size=2, step=1:

```typescript
collect([1, 2, 3, 4, 5])
    .sliding()
    .toArray()
// → [[1, 2], [2, 3], [3, 4], [4, 5]]
```

With step=2:

```typescript
collect([1, 2, 3, 4, 5])
    .sliding(2, 2)
    .toArray()
// → [[1, 2], [3, 4]]
```

With size=3:

```typescript
collect([1, 2, 3, 4, 5])
    .sliding(3)
    .toArray()
// → [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
```

To fixed-size chunks without overlap, use [`chunk`](#chunk). To split into N groups, use [`split`](#split).

---
