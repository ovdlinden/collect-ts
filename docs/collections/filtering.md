# Filtering

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### filter()

Filters the collection using the given callback, keeping only
items that pass a given truth test. If no callback is supplied, all falsy values
(`false`, `null`, `undefined`, `0`, `''`) are removed.

```typescript
collect([1, 2, 3, 4])
    .filter(n => n > 2)
// → [3, 4]
```

To remove falsy values, call without arguments:

```typescript
collect([0, 1, '', 'hello', null])
    .filter()
// → [1, 'hello']
```

To the inverse (keeps items that fail), use [`reject`](#reject). To filter by key/value instead of callback, use [`where`](#where).

---

### reject()

Filters the collection using the given callback, removing
items that pass the truth test. It is the inverse of the `filter` method.

```typescript
collect([1, 2, 3, 4])
    .reject(n => n > 2)
// → [1, 2]
```

Pass a value directly to reject by loose equality:

```typescript
collect([1, null, 3])
    .reject(null)
// → [1, 3]
```

To the inverse (keeps items that pass), use [`filter`](#filter). To excluding items in an array, use [`whereNotIn`](#wherenotin).

---

### contains()

Determines whether the collection contains a given item.

Uses loose equality (`==`) to match Laravel behavior. Note that JS differs from PHP:
`0 == false`, `null == undefined`, `"" == 0`.

```typescript
collect([1, 2, 3])
    .contains(2)
// → true
```

Pass a callback to check for a matching item:

```typescript
collect([
  { name: 'Taylor', active: true },
  { name: 'Abigail', active: false },
])
  .contains(u => u.active)
// → true
```

Also use key/value syntax:

```typescript
collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
])
  .contains('role', 'admin')
// → true
```

To strict equality (`===`), use [`containsStrict`](/collections/checking#containsstrict). To the inverse (true if not found), use [`doesntContain`](/collections/checking#doesntcontain).

---

### duplicates()

Retrieves and returns duplicate values from the collection.

```typescript
collect(['a', 'b', 'a', 'c', 'b'])
    .duplicates()
    .all()
// → { '2': 'a', '4': 'b' }
```

With key:

```typescript
collect([
  { email: 'alice@example.com', name: 'Alice' },
  { email: 'bob@example.com', name: 'Bob' },
  { email: 'alice@example.com', name: 'Alice 2' },
])
  .duplicates('email')
  .all()
// → { '2': { email: 'alice@example.com', name: 'Alice 2' } }
```

To strict comparison, use [`duplicatesStrict`](#duplicatesstrict). To get unique items, use [`unique`](#unique).

---

### duplicatesStrict()

Retrieves duplicate values from the collection using strict
equality (`===`). Unlike `duplicates`, this method distinguishes between values like `1` and `'1'`.

```typescript
collect([1, 2, 2, '2', 3, 3])
    .duplicatesStrict()
    .all()
// → [2, 3]
```

With a key:

```typescript
collect([
  { id: 1, email: 'a@test.com' },
  { id: 2, email: 'b@test.com' },
  { id: 3, email: 'a@test.com' },
])
  .duplicatesStrict('email')
  .all()
// → [{ id: 3, email: 'a@test.com' }]
```

Strict vs loose comparison:
// duplicatesStrict: 1 !== '1'

```typescript
collect([1, '1', 1])
    .duplicatesStrict()
    .all()
// → [1]
// duplicates (loose): 1 == '1'
collect([1, '1', 1])
    .duplicates()
    .all()
// → ['1', 1]
```

To loose equality comparison, use [`duplicates`](#duplicates). To remove duplicates, use [`unique`](#unique).

---

### except()

Returns all items in the collection except for those with the specified keys.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .except(['a', 'c'])
// → Collection { b: 2 }
```

To include only specified keys, use [`only`](#only). To filter by custom callback, use [`filter`](#filter).

---

### only()

Returns the items in the collection with the specified keys.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .only(['a', 'c'])
// → Collection { a: 1, c: 3 }
```

To exclude specified keys, use [`except`](#except). To pick specific properties from each item, use [`select`](/collections/transforming#select).

---

### skip()

Returns a new collection without the first N items.

```typescript
collect([1, 2, 3, 4, 5])
    .skip(2)
// → [3, 4, 5]
```

To take the first N items, use [`take`](#take). To skip and take in one call, use [`slice`](/collections/finding#slice).

---

### skipUntil()

Skips items until the given callback returns true,
then returns the remaining items.

```typescript
collect([1, 2, 3, 4])
    .skipUntil(3)
    .all()
// → [3, 4]
```

With callback:

```typescript
collect([1, 2, 3, 4])
    .skipUntil(item => item >= 3)
    .all()
// → [3, 4]
```

To skip while condition is true, use [`skipWhile`](#skipwhile). To take until condition, use [`takeUntil`](#takeuntil).

---

### skipWhile()

Skips items while the given callback returns true,
then returns the remaining items.

```typescript
collect([1, 2, 3, 4])
    .skipWhile(item => item < 3)
    .all()
// → [3, 4]
```

To skip until condition is true, use [`skipUntil`](#skipuntil). To take while condition, use [`takeWhile`](#takewhile).

---

### take()

Returns a new collection with the specified number of
items. Pass a negative integer to take that many items from the
end of the collection.

```typescript
collect([1, 2, 3, 4, 5])
    .take(3)
// → [1, 2, 3]
```

With negative values, it takes from the end:

```typescript
collect([1, 2, 3, 4, 5])
    .take(-2)
// → [4, 5]
```

To skip the first N items, use [`skip`](#skip). To skip and take in one call, use [`slice`](/collections/finding#slice).

---

### takeUntil()

Returns items until the given callback returns true.

```typescript
collect([1, 2, 3, 4])
    .takeUntil(3)
    .all()
// → [1, 2]
```

With callback:

```typescript
collect([1, 2, 3, 4])
    .takeUntil(item => item >= 3)
    .all()
// → [1, 2]
```

To take while condition is true, use [`takeWhile`](#takewhile). To skip until condition, use [`skipUntil`](#skipuntil).

---

### takeWhile()

Returns items while the given callback returns true.
Once the callback returns false, it stops.

```typescript
collect([1, 2, 3, 4])
    .takeWhile(item => item < 3)
    .all()
// → [1, 2]
```

To take until condition is true, use [`takeUntil`](#takeuntil). To skip while condition, use [`skipWhile`](#skipwhile).

---

### unique()

Returns all of the unique items in the collection.

When dealing with nested objects, you may specify a key used to determine uniqueness.

```typescript
collect([1, 1, 2, 2, 3])
    .unique()
// → Collection [1, 2, 3]
```

By property:

```typescript
collect([
  { id: 1, email: 'taylor@example.com' },
  { id: 2, email: 'abigail@example.com' },
  { id: 3, email: 'taylor@example.com' },
])
  .unique('email')
// → [
//     { id: 1, email: 'taylor@example.com' },
//     { id: 2, email: 'abigail@example.com' },
//   ]
```

To strict equality (always), use [`uniqueStrict`](#uniquestrict). To get the duplicate items instead, use [`duplicates`](#duplicates).

---

### uniqueStrict()

Has the same signature as the `unique` method
but uses strict comparison (`===`) to filter unique values.

```typescript
collect([1, '1', 2, '2', 3])
    .uniqueStrict()
    .all()
// → [1, '1', 2, '2', 3]
```

Compare with loose unique:

```typescript
collect([1, '1', 2, '2', 3])
    .unique()
    .all()
// → [1, 2, 3] (loose comparison treats 1 and '1' as equal)
```

To loose equality comparison, use [`unique`](#unique). To find duplicates using strict comparison, use [`duplicatesStrict`](#duplicatesstrict).

---

### where()

Filters the collection by a given key/value pair.

The method uses "loose" comparisons when checking item values, meaning
a string with an integer value will be considered equal to an integer
of the same value. Use the `whereStrict` method for strict comparisons.

Optionally, pass a comparison operator as the second argument.
Supported operators: `=`, `==`, `!=`, `<>`, `<`, `>`, `<=`, `>=`.

```typescript
collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 100 },
    { product: 'Bookcase', price: 150 },
]).where('price', 100)
// → [{ product: 'Chair', price: 100 }]
```

Pass a comparison operator:

```typescript
collect([
  { id: 1, total: 150 },
  { id: 2, total: 50 },
  { id: 3, total: 200 },
])
  .where('total', '>', 100)
// → [{ id: 1, total: 150 }, { id: 3, total: 200 }]
```

To filter by nested property:

```typescript
collect([
  { name: 'Taylor', address: { city: 'Amsterdam' } },
  { name: 'Abigail', address: { city: 'London' } },
])
  .where('address.city', 'Amsterdam')
// → [{ name: 'Taylor', address: { city: 'Amsterdam' } }]
```

To strict type comparisons, use [`whereStrict`](#wherestrict). To matching against an array of values, use [`whereIn`](#wherein).

---

### whereStrict()

Filters the collection by a given key/value pair using strict
comparison (`===`). Unlike `where`, this method distinguishes between values like `1` and `'1'`.

```typescript
collect([
  { name: 'Jim', age: 27 },
  { name: 'Anna', age: '27' },
  { name: 'Mark', age: 27 },
])
  .whereStrict('age', 27)
  .pluck('name')
  .all()
// → ['Jim', 'Mark']
```

Distinguish between null and undefined:

```typescript
collect([
  { id: 1, value: null },
  { id: 2, value: undefined },
  { id: 3, value: 0 },
])
  .whereStrict('value', null)
  .all()
// → [{ id: 1, value: null }]
```

To loose equality comparison, use [`where`](#where). To match against array of values, use [`whereIn`](#wherein).

---

### whereIn()

Filters the collection by a given key/value contained within the given array.

```typescript
collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
  { name: 'James', role: 'user' },
])
  .whereIn('role', ['admin', 'editor'])
// → [
//     { name: 'Taylor', role: 'admin' },
//     { name: 'Abigail', role: 'editor' },
//   ]
```

To excluding items in an array, use [`whereNotIn`](#wherenotin). To match single value, use [`where`](#where).

---

### whereInStrict()

Filters the collection using strict comparison.

```typescript
collect([
  { id: 1, value: '1' },
  { id: 2, value: 1 },
])
  .whereInStrict('value', [1])
  .all()
// → [{ id: 2, value: 1 }]
```

To loose comparison, use [`whereIn`](#wherein). To inverse, use [`whereNotInStrict`](#wherenotinstrict).

---

### whereNotIn()

Filters the collection by a given key/value not contained within the given array.

```typescript
collect([
  { name: 'Taylor', status: 'active' },
  { name: 'Abigail', status: 'banned' },
  { name: 'James', status: 'active' },
])
  .whereNotIn('status', ['banned', 'suspended'])
// → [
//     { name: 'Taylor', status: 'active' },
//     { name: 'James', status: 'active' },
//   ]
```

To include items matching array, use [`whereIn`](#wherein). To exclude by callback, use [`reject`](#reject).

---

### whereNotInStrict()

Filters the collection using strict comparison.

```typescript
collect([
  { id: 1, value: '1' },
  { id: 2, value: 1 },
])
  .whereNotInStrict('value', [1])
  .all()
// → [{ id: 1, value: '1' }]
```

To loose comparison, use [`whereNotIn`](#wherenotin). To inverse, use [`whereInStrict`](#whereinstrict).

---

### whereBetween()

Filters the collection by determining if a specified
item value is within a given range (inclusive).

```typescript
collect([
  { product: 'Desk', price: 200 },
  { product: 'Chair', price: 80 },
  { product: 'Bookcase', price: 150 },
  { product: 'Pencil', price: 5 },
  { product: 'Monitor', price: 300 },
])
  .whereBetween('price', [100, 200])
  .all()
// → [
//     { product: 'Desk', price: 200 },
//     { product: 'Bookcase', price: 150 },
//   ]
```

Filter by age range:

```typescript
collect([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 17 },
  { name: 'Carol', age: 65 },
  { name: 'Dave', age: 40 },
])
  .whereBetween('age', [18, 64])
  .pluck('name')
  .all()
// → ['Alice', 'Dave']
```

To exclude items within a range, use [`whereNotBetween`](#wherenotbetween). To filter by key/value comparison, use [`where`](#where).

---

### whereNotBetween()

Filters the collection by determining if a specified item value
is outside of a given range.

```typescript
collect([
  { product: 'Desk', price: 200 },
  { product: 'Chair', price: 80 },
  { product: 'Bookcase', price: 150 },
  { product: 'Pencil', price: 5 },
  { product: 'Monitor', price: 300 },
])
  .whereNotBetween('price', [100, 200])
  .all()
// → [
//     { product: 'Chair', price: 80 },
//     { product: 'Pencil', price: 5 },
//     { product: 'Monitor', price: 300 },
//   ]
```

Filter ages outside working age:

```typescript
collect([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 17 },
  { name: 'Carol', age: 65 },
  { name: 'Dave', age: 40 },
])
  .whereNotBetween('age', [18, 64])
  .pluck('name')
  .all()
// → ['Bob', 'Carol']
```

To include items within a range, use [`whereBetween`](#wherebetween). To filter by key/value comparison, use [`where`](#where).

---

### whereNull()

Filters the collection by determining if a specified
item value is null or undefined.

```typescript
collect([
  { name: 'Taylor', email: 'taylor@example.com' },
  { name: 'James', email: null },
  { name: 'Victoria', email: undefined },
])
  .whereNull('email')
  .all()
// → [
//     { name: 'James', email: null },
//     { name: 'Victoria', email: undefined },
//   ]
```

Filter items that are null:

```typescript
collect([1, null, 3, undefined, 5])
    .whereNull()
    .all()
// → [null, undefined]
```

To filter items that are not null, use [`whereNotNull`](#wherenotnull). To filter by key/value comparison, use [`where`](#where).

---

### whereNotNull()

Filters the collection by determining if a specified
item value is not null and not undefined.

```typescript
collect([
  { name: 'Taylor', email: 'taylor@example.com' },
  { name: 'James', email: null },
  { name: 'Victoria', email: undefined },
])
  .whereNotNull('email')
  .all()
// → [{ name: 'Taylor', email: 'taylor@example.com' }]
```

Filter truthy items:

```typescript
collect([1, null, 3, undefined, 5])
    .whereNotNull()
    .all()
// → [1, 3, 5]
```

To filter items that are null, use [`whereNull`](#wherenull). To filter with custom callback, use [`filter`](#filter).

---

### whereInstanceOf()

Filters the collection by a given class type,
keeping only items that are instances of the specified class.

```typescript
class User {}
class Admin extends User {}
collect([new User(), new Admin(), { name: 'plain' }])
    .whereInstanceOf(User)
    .count()
// → 2 (User and Admin)
```

To filter with a custom callback, use [`filter`](#filter).

---

### forPage()

Returns a new collection containing the items that
would be present on a given page number.

```typescript
collect([1, 2, 3, 4, 5, 6, 7, 8, 9])
    .forPage(2, 3)
    .all()
// → [4, 5, 6]
```

First page:

```typescript
collect([1, 2, 3, 4, 5])
    .forPage(1, 2)
    .all()
// → [1, 2]
```

To split into fixed-size chunks, use [`chunk`](/collections/grouping#chunk). To take first N items, use [`take`](#take).

---
