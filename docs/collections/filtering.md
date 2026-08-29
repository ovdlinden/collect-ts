# Filtering

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### filter()

The `filter` method filters the collection using the given callback, keeping only
items that pass a given truth test. If no callback is supplied, all falsy values
(false, null, undefined, 0, '') are removed.

Keep items greater than 2

```typescript
collect([1, 2, 3, 4])
    .filter(n => n > 2)
// → [3, 4]
```

Remove falsy values

```typescript
collect([0, 1, '', 'hello', null])
    .filter()
// → [1, 'hello']
```

For the inverse (keeps items that fail), see the [reject](#reject) method. For Filter by key/value instead of callback, see the [where](#where) method. For Filter where key matches array of values, see the [whereIn](#wherein) method.

---

### reject()

The `reject` method filters the collection using the given callback, removing
items that pass the truth test. It is the inverse of the `filter` method.
You may also pass a value directly to reject items by loose equality.

Reject items greater than 2

```typescript
collect([1, 2, 3, 4])
    .reject(n => n > 2)
// → [1, 2]
```

Reject by value

```typescript
collect([1, null, 3])
    .reject(null)
// → [1, 3]
```

For the inverse (keeps items that pass), see the [filter](#filter) method. For excluding items in an array, see the [whereNotIn](#wherenotin) method.

---

### contains()

The `contains` method determines whether the collection contains a given item.

You may pass a closure to determine if an element exists matching a given truth test.
Uses loose equality (==) to match Laravel behavior. JS differs from PHP:
0==false, null==undefined, ""==0.

Check value exists

```typescript
collect([1, 2, 3])
    .contains(2)
// → true
```

With callback

```typescript
collect([
  { name: 'Taylor', active: true },
  { name: 'Abigail', active: false },
])
  .contains(u => u.active)
// → true
```

Key/value syntax

```typescript
collect([
  { name: 'Taylor', role: 'admin' },
  { name: 'Abigail', role: 'editor' },
])
  .contains('role', 'admin')
// → true
```

For strict equality (===), see the [containsStrict](/collections/checking#containsstrict) method. For the inverse (true if not found), see the [doesntContain](/collections/checking#doesntcontain) method. For contains alias, see the [some](/collections/checking#some) method.

---

### duplicates()

The `duplicates` method retrieves and returns duplicate values from the collection.
By default, the method uses loose comparison. Pass a callback or key to compare
by a derived value instead of the item itself.

Find duplicates

```typescript
collect([1, 2, 2, 3, 3, 3])
    .duplicates()
// → [2, 3, 3]
```

Duplicates by key

```typescript
collect([{ email: 'a@b.com' }, { email: 'c@d.com' }, { email: 'a@b.com' }])
    .duplicates('email')
// → [{ email: 'a@b.com' }]
```

For strict equality, see the [duplicatesStrict](#duplicatesstrict) method. For Get unique items instead, see the [unique](#unique) method.

---

### duplicatesStrict()

The `duplicatesStrict` method retrieves duplicate values using strict equality (===).

For loose equality, see the [duplicates](#duplicates) method.

---

### except()

The `except` method returns all items in the collection except for those with the specified keys.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .except(['a', 'c'])
// → Collection { b: 2 }
```

For Include only specified keys, see the [only](#only) method. For Filter by custom callback, see the [filter](#filter) method.

---

### only()

The `only` method returns the items in the collection with the specified keys.

```typescript
collect({ a: 1, b: 2, c: 3 })
    .only(['a', 'c'])
// → Collection { a: 1, c: 3 }
```

For Exclude specified keys, see the [except](#except) method. For Pick specific properties from each item, see the [select](/collections/finding#select) method.

---

### skip()

The `skip` method returns a new collection without the first N items.

```typescript
collect([1, 2, 3, 4, 5])
    .skip(2)
// → [3, 4, 5]
```

For Take the first N items, see the [take](#take) method. For Skip and take in one call, see the [slice](/collections/finding#slice) method. For Skip until a condition is met, see the [skipUntil](#skipuntil) method. For Skip while a condition is true, see the [skipWhile](#skipwhile) method.

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

With a value

```typescript
collect(['a', 'b', 'c', 'd'])
    .skipUntil('c')
// → ['c', 'd']
```

For Skip while condition is true, see the [skipWhile](#skipwhile) method. For Take items until condition is met, see the [takeUntil](#takeuntil) method.

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

For Skip until condition becomes true, see the [skipUntil](#skipuntil) method. For Take while condition is true, see the [takeWhile](#takewhile) method.

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

Negative values take from the end

```typescript
collect([1, 2, 3, 4, 5])
    .take(-2)
// → [4, 5]
```

For Skip the first N items, see the [skip](#skip) method. For Skip and take in one call, see the [slice](/collections/finding#slice) method. For Get just the first item, see the [first](/collections/finding#first) method. For Take until a condition is met, see the [takeUntil](#takeuntil) method. For Take while a condition is true, see the [takeWhile](#takewhile) method.

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

With a value

```typescript
collect(['a', 'b', 'c', 'd'])
    .takeUntil('c')
// → ['a', 'b']
```

For Take while condition is true, see the [takeWhile](#takewhile) method. For Skip items until condition is met, see the [skipUntil](#skipuntil) method.

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

For Take until condition becomes true, see the [takeUntil](#takeuntil) method. For Skip while condition is true, see the [skipWhile](#skipwhile) method.

---

### nth()

The `nth` method creates a new collection containing every n-th element.
You may optionally pass an offset as the second argument.

```typescript
collect(['a', 'b', 'c', 'd', 'e', 'f'])
    .nth(2)
// → ['a', 'c', 'e']
```

With offset

```typescript
collect(['a', 'b', 'c', 'd', 'e', 'f'])
    .nth(2, 1)
// → ['b', 'd', 'f']
```

For filtering with a custom callback, see the [filter](#filter) method.

---

### unique()

The `unique` method returns all of the unique items in the collection.

When dealing with nested objects, you may specify a key used to determine uniqueness.

```typescript
collect([1, 1, 2, 2, 3])
    .unique()
// → Collection [1, 2, 3]
```

By property

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

For strict equality (always), see the [uniqueStrict](#uniquestrict) method. For Get the duplicate items instead, see the [duplicates](#duplicates) method.

---

### uniqueStrict()

The `uniqueStrict` method removes duplicate items using strict equality (===).
Unlike `unique`, which uses loose comparison, this method distinguishes between
values like `1` and `'1'`.

```typescript
collect([1, '1', 2, '2', 2])
    .uniqueStrict()
// → [1, '1', 2, '2']
```

For loose equality, see the [unique](#unique) method. For Get duplicates using strict equality, see the [duplicatesStrict](#duplicatesstrict) method.

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

With comparison operator

```typescript
collect([
  { id: 1, total: 150 },
  { id: 2, total: 50 },
  { id: 3, total: 200 },
])
  .where('total', '>', 100)
// → [{ id: 1, total: 150 }, { id: 3, total: 200 }]
```

Filter by nested property

```typescript
collect([
  { name: 'Taylor', address: { city: 'Amsterdam' } },
  { name: 'Abigail', address: { city: 'London' } },
])
  .where('address.city', 'Amsterdam')
// → [{ name: 'Taylor', address: { city: 'Amsterdam' } }]
```

For strict type comparisons, see the [whereStrict](#wherestrict) method. For matching against an array of values, see the [whereIn](#wherein) method. For excluding items in an array, see the [whereNotIn](#wherenotin) method. For matching values in a range, see the [whereBetween](#wherebetween) method. For matching null values, see the [whereNull](#wherenull) method. For filtering with a custom callback, see the [filter](#filter) method.

---

### whereStrict()

The `whereStrict` method filters the collection by a given key/value pair using strict
comparison (===). Unlike `where`, this method distinguishes between values like `1` and `'1'`.

For loose equality, see the [where](#where) method.

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

For excluding items in an array, see the [whereNotIn](#wherenotin) method. For Match single value, see the [where](#where) method.

---

### whereInStrict()

The `whereInStrict` method filters the collection by a given key/value contained
within the given array using strict comparison (===). Unlike `whereIn`, this
method distinguishes between values like `1` and `'1'`.

```typescript
collect([{ id: 1 }, { id: '1' }, { id: 2 }])
    .whereInStrict('id', [1])
// → [{ id: 1 }]
```

For loose equality, see the [whereIn](#wherein) method. For Exclude using strict equality, see the [whereNotInStrict](#wherenotinstrict) method.

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

For Include items matching array, see the [whereIn](#wherein) method. For Exclude by callback, see the [reject](#reject) method.

---

### whereNotInStrict()

The `whereNotInStrict` method filters the collection by a given key/value not
contained within the given array using strict comparison (===). Unlike `whereNotIn`,
this method distinguishes between values like `1` and `'1'`.

```typescript
collect([{ id: 1 }, { id: '1' }, { id: 2 }])
    .whereNotInStrict('id', [1])
// → [{ id: '1' }, { id: 2 }]
```

For loose equality, see the [whereNotIn](#wherenotin) method. For Include using strict equality, see the [whereInStrict](#whereinstrict) method.

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

For excluding items outside a range, see the [whereNotBetween](#wherenotbetween) method. For Filter with operators, see the [where](#where) method.

---

### whereNotBetween()

The `whereNotBetween` method filters the collection by determining if a specified item value
is outside of a given range.

For Include items in range, see the [whereBetween](#wherebetween) method.

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

For Exclude null/undefined values, see the [whereNotNull](#wherenotnull) method.

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

For Include null/undefined values, see the [whereNull](#wherenull) method.

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

For filtering with a custom callback, see the [filter](#filter) method.

---

### forPage()

The `forPage` method returns a new collection containing the items that would
be present on a given page number. The method accepts the page number as its
first argument and the number of items to show per page as its second argument.

Paginate results

```typescript
collect([1, 2, 3, 4, 5, 6, 7, 8, 9])
    .forPage(2, 3)
// → [4, 5, 6]
```

First page

```typescript
collect(['a', 'b', 'c', 'd', 'e'])
    .forPage(1, 2)
// → ['a', 'b']
```

For Get items by offset and length, see the [slice](/collections/finding#slice) method. For Take the first N items, see the [take](#take) method. For Split into chunks of a given size, see the [chunk](/collections/grouping#chunk) method.

---
