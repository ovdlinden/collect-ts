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

Key/value with strict comparison

```typescript
collect([{ id: 1 }, { id: '1' }])
    .containsStrict('id', 1)
// → true (first item matches, second does not)
```

For loose equality (==), see the [contains](/collections/filtering#contains) method. For the inverse (true if not found), see the [doesntContainStrict](#doesntcontainstrict) method.

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

With callback

```typescript
collect([
  { name: 'Taylor', role: 'editor' },
  { name: 'Abigail', role: 'editor' },
])
  .doesntContain(u => u.role === 'admin')
// → true
```

For the inverse (true if found), see the [contains](/collections/filtering#contains) method. For strict equality (===), see the [doesntContainStrict](#doesntcontainstrict) method.

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

For the inverse with strict equality, see the [containsStrict](#containsstrict) method. For loose equality (==), see the [doesntContain](#doesntcontain) method.

---

### has()

The `has` method determines if a given key exists in the collection.

When an array of keys is passed, returns `true` only if ALL keys exist.

Single key

```typescript
collect({ a: 1, b: 2 })
    .has('a')
// → true
```

Multiple keys (all must exist)

```typescript
collect({ a: 1, b: 2 })
    .has(['a', 'c'])
// → false (c does not exist)
```

For checking if any key exists, see the [hasAny](#hasany) method. For Check if a value exists, see the [contains](/collections/filtering#contains) method.

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

No matches

```typescript
collect({ a: 1, b: 2 })
    .hasAny(['c', 'd'])
// → false
```

For checking if all keys exist, see the [has](#has) method. For Check if a value exists, see the [contains](/collections/filtering#contains) method.

---

### isEmpty()

The `isEmpty` method returns `true` if the collection is empty.

```typescript
collect([])
    .isEmpty()
// → true
```

Non-empty collection

```typescript
collect([1, 2, 3])
    .isEmpty()
// → false
```

For the inverse (true if has items), see the [isNotEmpty](#isnotempty) method. For Get the number of items, see the [count](/collections/aggregating#count) method.

---

### isNotEmpty()

The `isNotEmpty` method returns `true` if the collection is not empty.

```typescript
collect([1, 2, 3])
    .isNotEmpty()
// → true
```

Empty collection

```typescript
collect([])
    .isNotEmpty()
// → false
```

For the inverse (true if empty), see the [isEmpty](#isempty) method. For Get the number of items, see the [count](/collections/aggregating#count) method.

---

### containsOneItem()

The `containsOneItem` method returns `true` if the collection contains exactly one item.

When a callback is provided, returns `true` only if exactly one item passes the test.

```typescript
collect(['a'])
    .containsOneItem()
// → true
```

With callback

```typescript
collect([1, 2, 3, 4, 5])
    .containsOneItem(n => n > 4)
// → true (only 5 passes)
```

For checking if more than one item, see the [hasMany](#hasmany) method. For Similar but throws if not exactly one, see the [hasSole](#hassole) method. For Get the number of items, see the [count](/collections/aggregating#count) method.

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

With callback

```typescript
collect([1, 2, 3, 4, 5])
    .hasMany(n => n > 3)
// → true (4 and 5 pass)
```

For checking if exactly one item, see the [containsOneItem](#containsoneitem) method. For checking if exactly one matching item, see the [hasSole](#hassole) method.

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

Multiple matches

```typescript
collect([1, 2, 3, 4, 5])
    .hasSole(n => n > 3)
// → false (4 and 5 both pass)
```

For getting the item (throws if not exactly one), see the [sole](/collections/finding#sole) method. For Check without filter, see the [containsOneItem](#containsoneitem) method. For checking if more than one item, see the [hasMany](#hasmany) method.

---

### every()

The `every` method verifies that all elements of the collection pass a given truth test.

Returns `true` if the callback returns truthy for every item. If the collection is
empty, `every` returns `true` (vacuous truth).

With callback

```typescript
collect([1, 2, 3])
    .every(n => n < 10)
// → true
```

With property key

```typescript
collect([{ active: true }, { active: true }])
    .every('active')
// → true
```

Key/operator/value syntax

```typescript
collect([{ qty: 5 }, { qty: 10 }])
    .every('qty', '>=', 5)
// → true
```

For checking if any item passes, see the [some](#some) method. For Check if a specific value exists, see the [contains](/collections/filtering#contains) method.

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

For Primary method (identical behavior), see the [contains](/collections/filtering#contains) method. For checking if all items pass, see the [every](#every) method.

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

For Primary method for key existence checks, see the [has](#has) method. For Get value at offset, see the [offsetGet](/collections/finding#offsetget) method.

---
