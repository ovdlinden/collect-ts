# Checking

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### containsStrict()

The `containsStrict` method determines whether the collection contains a given item
using strict comparison (`===`).

Unlike `contains` which uses loose equality, this method distinguishes between types.
For example, `1` and `'1'` are not equal under strict comparison.

```typescript
collect([1, '1'])
    .containsStrict(1)
// → true
```

You may also use key/value with strict comparison:

```typescript
collect([{ id: 1 }, { id: '1' }])
    .containsStrict('id', 1)
// → true (first item matches, second does not)
```

For loose equality (`==`), use [`contains`](/collections/filtering#contains). For the inverse (true if not found), use [`doesntContainStrict`](#doesntcontainstrict).

---

### doesntContain()

The `doesntContain` method determines whether the collection does not contain a given item.

This method is the inverse of `contains` and uses loose equality (`==`) for comparison.
It returns `true` when the item is NOT found in the collection.

```typescript
collect([1, 2, 3])
    .doesntContain(4)
// → true
```

You may also pass a callback:

```typescript
collect([
  { name: 'Taylor', role: 'editor' },
  { name: 'Abigail', role: 'editor' },
])
  .doesntContain(u => u.role === 'admin')
// → true
```

For the inverse (true if found), use [`contains`](/collections/filtering#contains). For strict equality (`===`), use [`doesntContainStrict`](#doesntcontainstrict).

---

### doesntContainStrict()

The `doesntContainStrict` method determines whether the collection does not contain a given
item using strict comparison (`===`).

This method is the inverse of `containsStrict` and returns `true` when the item is NOT found.

```typescript
collect([1, 2, 3])
    .doesntContainStrict('1')
// → true (string '1' is not strictly equal to number 1)
```

For the inverse with strict equality, use [`containsStrict`](#containsstrict). For loose equality (`==`), use [`doesntContain`](#doesntcontain).

---

### has()

The `has` method determines if a given key exists in the collection.

When an array of keys is passed, returns `true` only if ALL keys exist.

For a single key:

```typescript
collect({ a: 1, b: 2 })
    .has('a')
// → true
```

For multiple keys (all must exist):

```typescript
collect({ a: 1, b: 2 })
    .has(['a', 'c'])
// → false (c does not exist)
```

For checking if any key exists, use [`hasAny`](#hasany). For Check if a value exists, use [`contains`](/collections/filtering#contains).

---

### hasAny()

The `hasAny` method determines if any of the given keys exist in the collection.

Returns `true` if at least one of the provided keys exists. Returns `false` for
empty collections regardless of the keys provided.

```typescript
collect({ a: 1, b: 2 })
    .hasAny(['b', 'c', 'd'])
// → true (b exists)
```

If no keys match:

```typescript
collect({ a: 1, b: 2 })
    .hasAny(['c', 'd'])
// → false
```

For checking if all keys exist, use [`has`](#has). For Check if a value exists, use [`contains`](/collections/filtering#contains).

---

### isEmpty()

The `isEmpty` method returns `true` if the collection is empty.

```typescript
collect([])
    .isEmpty()
// → true
```

For a non-empty collection:

```typescript
collect([1, 2, 3])
    .isEmpty()
// → false
```

For the inverse (true if has items), use [`isNotEmpty`](#isnotempty). For Get the number of items, use [`count`](/collections/aggregating#count).

---

### isNotEmpty()

The `isNotEmpty` method returns `true` if the collection is not empty.

```typescript
collect([1, 2, 3])
    .isNotEmpty()
// → true
```

For an empty collection:

```typescript
collect([])
    .isNotEmpty()
// → false
```

For the inverse (true if empty), use [`isEmpty`](#isempty). For Get the number of items, use [`count`](/collections/aggregating#count).

---

### containsOneItem()

The `containsOneItem` method returns `true` if the collection contains exactly one item.

When a callback is provided, returns `true` only if exactly one item passes the test.

```typescript
collect(['a'])
    .containsOneItem()
// → true
```

You may also pass a callback:

```typescript
collect([1, 2, 3, 4, 5])
    .containsOneItem(n => n > 4)
// → true (only 5 passes)
```

For checking if more than one item, use [`hasMany`](#hasmany). For Similar but throws if not exactly one, use [`hasSole`](#hassole).

---

### hasMany()

The `hasMany` method returns `true` if the collection contains more than one item.

When a callback or key/value pair is provided, returns `true` only if more than one
item passes the test.

```typescript
collect([1, 2, 3])
    .hasMany()
// → true
```

You may also pass a callback:

```typescript
collect([1, 2, 3, 4, 5])
    .hasMany(n => n > 3)
// → true (4 and 5 pass)
```

For checking if exactly one item, use [`containsOneItem`](#containsoneitem). For checking if exactly one matching item, use [`hasSole`](#hassole).

---

### hasSole()

The `hasSole` method returns `true` if the collection contains exactly one item
that passes the given truth test.

Unlike `sole`, this method returns a boolean instead of throwing an exception
when zero or multiple items match.

```typescript
collect([1, 2, 3, 4, 5])
    .hasSole(n => n > 4)
// → true (only 5 passes)
```

For multiple matches:

```typescript
collect([1, 2, 3, 4, 5])
    .hasSole(n => n > 3)
// → false (4 and 5 both pass)
```

For getting the item (throws if not exactly one), use [`sole`](/collections/finding#sole). For Check without filter, use [`containsOneItem`](#containsoneitem).

---

### every()

The `every` method verifies that all elements of the collection pass a given truth test.

Returns `true` if the callback returns truthy for every item. If the collection is
empty, `every` returns `true` (vacuous truth).

You may also pass a callback:

```typescript
collect([1, 2, 3])
    .every(n => n < 10)
// → true
```

You may also pass a property key:

```typescript
collect([{ active: true }, { active: true }])
    .every('active')
// → true
```

Or use key/operator/value syntax:

```typescript
collect([{ qty: 5 }, { qty: 10 }])
    .every('qty', '>=', 5)
// → true
```

For checking if any item passes, use [`some`](#some). For Check if a specific value exists, use [`contains`](/collections/filtering#contains).

---

### some()

The `some` method is an alias for the `contains` method.

It determines whether the collection contains any items that pass the given truth test.
This method is useful for developers coming from JavaScript's Array.some() convention.

```typescript
collect([1, 2, 3, 4, 5])
    .some(n => n > 4)
// → true
```

For Primary method (identical behavior), use [`contains`](/collections/filtering#contains). For checking if all items pass, use [`every`](#every).

---

### offsetExists()

The `offsetExists` method determines if a key exists at the given offset.

This method implements the ArrayAccess interface pattern, allowing bracket-style
key existence checks. It is used internally for array-like access.

```typescript
collect({ a: 1, b: 2 })
    .offsetExists('a')
// → true
```

For Primary method for key existence checks, use [`has`](#has). For Get value at offset, use [`offsetGet`](/collections/finding#offsetget).

---
