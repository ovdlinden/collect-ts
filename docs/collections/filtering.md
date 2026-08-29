# Filtering

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### filter()

The `filter` method filters the collection using the given callback, keeping only
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

For the inverse (keeps items that fail), use [`reject`](#reject). For Filter by key/value instead of callback, use [`where`](#where).

---

### reject()

The `reject` method filters the collection using the given callback, removing
items that pass the truth test. It is the inverse of the `filter` method.

```typescript
collect([1, 2, 3, 4])
    .reject(n => n > 2)
// → [1, 2]
```

You may also pass a value directly to reject by loose equality:

```typescript
collect([1, null, 3])
    .reject(null)
// → [1, 3]
```

For the inverse (keeps items that pass), use [`filter`](#filter). For excluding items in an array, use [`whereNotIn`](#wherenotin).

---

### contains()

The `contains` method determines whether the collection contains a given item.

Uses loose equality (`==`) to match Laravel behavior. Note that JS differs from PHP:
`0 == false`, `null == undefined`, `"" == 0`.

```typescript
collect([1, 2, 3])
    .contains(2)
// → true
```

You may pass a callback to check for a matching item:

```typescript
collect([
  { name: 'Taylor', active: true },
  { name: 'Abigail', active: false },
])
  .contains(u => u.active)
// → true
```

You may also use key/value syntax:

```typescript
collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
])
  .contains('role', 'admin')
// → true
```

For strict equality (`===`), use [`containsStrict`](/collections/checking#containsstrict). For the inverse (true if not found), use [`doesntContain`](/collections/checking#doesntcontain).

---

### duplicates()

The `duplicates` method retrieves and returns duplicate values from the collection.
By default, the method uses loose comparison.

```typescript
collect([1, 2, 2, 3, 3, 3])
    .duplicates()
// → [2, 3, 3]
```

You may also pass a key to compare by a derived value:

```typescript
collect([{ email: 'a@b.com' }, { email: 'c@d.com' }, { email: 'a@b.com' }])
    .duplicates('email')
// → [{ email: 'a@b.com' }]
```

For strict equality (`===`), use [`duplicatesStrict`](#duplicatesstrict). For get unique items instead, use [`unique`](#unique).

---

### duplicatesStrict()

The `duplicatesStrict` method retrieves duplicate values using strict equality (`===`).

For loose equality (`==`), use [`duplicates`](#duplicates).

---

### except()

The `except` method returns all items in the collection except for those with the specified keys.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .except(['a', 'c'])
// → Collection { b: 2 }
```

For Include only specified keys, use [`only`](#only). For Filter by custom callback, use [`filter`](#filter).

---

### only()

The `only` method returns the items in the collection with the specified keys.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .only(['a', 'c'])
// → Collection { a: 1, c: 3 }
```

For Exclude specified keys, use [`except`](#except). For Pick specific properties from each item, use [`select`](/collections/finding#select).

---

### skip()

The `skip` method returns a new collection without the first N items.

```typescript
collect([1, 2, 3, 4, 5])
    .skip(2)
// → [3, 4, 5]
```

For Take the first N items, use [`take`](#take). For Skip and take in one call, use [`slice`](/collections/finding#slice).

---

### skipUntil()

The `skipUntil` method skips items until the given callback returns true.
The matching item and all remaining items are returned as a new collection.
You may also pass a value instead of a callback.

```typescript
collect([1, 2, 3, 4])
    .skipUntil(number => number >= 3)
// → [3, 4]
```

You may also pass a value:

```typescript
collect(['a', 'b', 'c', 'd'])
    .skipUntil('c')
// → ['c', 'd']
```

For Skip while condition is true, use [`skipWhile`](#skipwhile). For Take items until condition is met, use [`takeUntil`](#takeuntil).

---

### skipWhile()

The `skipWhile` method skips items while the given callback returns true.
Once the callback returns false, all remaining items are returned as a
new collection.

```typescript
collect([1, 1, 2, 3, 1])
    .skipWhile(number => number < 2)
// → [2, 3, 1]
```

For Skip until condition becomes true, use [`skipUntil`](#skipuntil). For Take while condition is true, use [`takeWhile`](#takewhile).

---

### take()

The `take` method returns a new collection with the specified number of
items. You may pass a negative integer to take that many items from the
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

For Skip the first N items, use [`skip`](#skip). For Skip and take in one call, use [`slice`](/collections/finding#slice).

---

### takeUntil()

The `takeUntil` method returns items until the given callback returns true.
The item that matches is not included in the result. You may also pass a
value instead of a callback.

```typescript
collect([1, 2, 3, 4])
    .takeUntil(number => number >= 3)
// → [1, 2]
```

You may also pass a value:

```typescript
collect(['a', 'b', 'c', 'd'])
    .takeUntil('c')
// → ['a', 'b']
```

For Take while condition is true, use [`takeWhile`](#takewhile). For Skip items until condition is met, use [`skipUntil`](#skipuntil).

---

### takeWhile()

The `takeWhile` method returns items while the given callback returns true.
Once the callback returns false, the method stops and returns what it
collected so far.

```typescript
collect([1, 2, 3, 4])
    .takeWhile(number => number < 3)
// → [1, 2]
```

For Take until condition becomes true, use [`takeUntil`](#takeuntil). For Skip while condition is true, use [`skipWhile`](#skipwhile).

---

### nth()

The `nth` method creates a new collection containing every n-th element.
You may optionally pass an offset as the second argument.

```typescript
collect(['a', 'b', 'c', 'd', 'e', 'f'])
    .nth(2)
// → ['a', 'c', 'e']
```

You may also pass an offset:

```typescript
collect(['a', 'b', 'c', 'd', 'e', 'f'])
    .nth(2, 1)
// → ['b', 'd', 'f']
```

For filtering with a custom callback, use [`filter`](#filter).

---

### unique()

The `unique` method returns all of the unique items in the collection.

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

For strict equality (always), use [`uniqueStrict`](#uniquestrict). For Get the duplicate items instead, use [`duplicates`](#duplicates).

---

### uniqueStrict()

The `uniqueStrict` method removes duplicate items using strict equality (`===`).
Unlike `unique`, which uses loose comparison, this method distinguishes between
values like `1` and `'1'`.

```typescript
collect([1, '1', 2, '2', 2])
    .uniqueStrict()
// → [1, '1', 2, '2']
```

For loose equality, use [`unique`](#unique). For Get duplicates using strict equality, use [`duplicatesStrict`](#duplicatesstrict).

---

### where()

The `where` method filters the collection by a given key/value pair.

The method uses "loose" comparisons when checking item values, meaning
a string with an integer value will be considered equal to an integer
of the same value. Use the `whereStrict` method for strict comparisons.

You may optionally pass a comparison operator as the second argument.
Supported operators: `=`, `==`, `!=`, `<>`, `<`, `>`, `<=`, `>=`.

```typescript
collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 100 },
    { product: 'Bookcase', price: 150 },
]).where('price', 100)
// → [{ product: 'Chair', price: 100 }]
```

You may also pass a comparison operator:

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

For strict type comparisons, use [`whereStrict`](#wherestrict). For matching against an array of values, use [`whereIn`](#wherein).

---

### whereStrict()

The `whereStrict` method filters the collection by a given key/value pair using strict
comparison (`===`). Unlike `where`, this method distinguishes between values like `1` and `'1'`.

For loose equality, use [`where`](#where).

---

### whereIn()

The `whereIn` method filters the collection by a given key/value contained within the given array.

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

For excluding items in an array, use [`whereNotIn`](#wherenotin). For Match single value, use [`where`](#where).

---

### whereInStrict()

The `whereInStrict` method filters the collection by a given key/value contained
within the given array using strict comparison (`===`). Unlike `whereIn`, this
method distinguishes between values like `1` and `'1'`.

```typescript
collect([{ id: 1 }, { id: '1' }, { id: 2 }])
    .whereInStrict('id', [1])
// → [{ id: 1 }]
```

For loose equality, use [`whereIn`](#wherein). For Exclude using strict equality, use [`whereNotInStrict`](#wherenotinstrict).

---

### whereNotIn()

The `whereNotIn` method filters the collection by a given key/value not contained within the given array.

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

For Include items matching array, use [`whereIn`](#wherein). For Exclude by callback, use [`reject`](#reject).

---

### whereNotInStrict()

The `whereNotInStrict` method filters the collection by a given key/value not
contained within the given array using strict comparison (`===`). Unlike `whereNotIn`,
this method distinguishes between values like `1` and `'1'`.

```typescript
collect([{ id: 1 }, { id: '1' }, { id: 2 }])
    .whereNotInStrict('id', [1])
// → [{ id: '1' }, { id: 2 }]
```

For loose equality, use [`whereNotIn`](#wherenotin). For Include using strict equality, use [`whereInStrict`](#whereinstrict).

---

### whereBetween()

The `whereBetween` method filters the collection by determining if a specified item value is within a given range.

```typescript
collect([
  { name: 'Chair', price: 100 },
  { name: 'Desk', price: 200 },
  { name: 'Lamp', price: 30 },
])
  .whereBetween('price', [50, 150])
// → [{ name: 'Chair', price: 100 }]
```

For excluding items outside a range, use [`whereNotBetween`](#wherenotbetween). For Filter with operators, use [`where`](#where).

---

### whereNotBetween()

The `whereNotBetween` method filters the collection by determining if a specified item value
is outside of a given range.

For Include items in range, use [`whereBetween`](#wherebetween).

---

### whereNull()

The `whereNull` method filters the collection by determining if a specified item value is null or undefined.

```typescript
collect([
  { name: 'Taylor', email: 'taylor@example.com' },
  { name: 'Abigail', email: null },
])
  .whereNull('email')
// → [{ name: 'Abigail', email: null }]
```

For Exclude null/undefined values, use [`whereNotNull`](#wherenotnull).

---

### whereNotNull()

The `whereNotNull` method filters the collection by determining if a specified item value
is not null or undefined.

```typescript
collect([
  { name: 'Taylor', verifiedAt: '2024-01-15' },
  { name: 'Abigail', verifiedAt: null },
])
  .whereNotNull('verifiedAt')
// → [{ name: 'Taylor', verifiedAt: '2024-01-15' }]
```

For Include null/undefined values, use [`whereNull`](#wherenull).

---

### whereInstanceOf()

The `whereInstanceOf` method filters the collection by a given class type,
keeping only items that are instances of the specified class. This is useful
for filtering mixed collections to a specific type.

```typescript
class User {}
class Admin extends User {}
collect([new User(), new Admin(), { name: 'plain' }])
    .whereInstanceOf(User)
// → [User, Admin]
```

For filtering with a custom callback, use [`filter`](#filter).

---

### forPage()

The `forPage` method returns a new collection containing the items that would
be present on a given page number. The method accepts the page number as its
first argument and the number of items to show per page as its second argument.

```typescript
collect([1, 2, 3, 4, 5, 6, 7, 8, 9])
    .forPage(2, 3)
// → [4, 5, 6]
```

For the first page:

```typescript
collect(['a', 'b', 'c', 'd', 'e'])
    .forPage(1, 2)
// → ['a', 'b']
```

For Get items by offset and length, use [`slice`](/collections/finding#slice). For Take the first N items, use [`take`](#take).

---
