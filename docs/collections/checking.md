# Checking

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### containsStrict()

The **containsStrict** method determines if the collection contains a given item
using strict comparison (`===`).

```typescript
collect([1, 2, 3])
    .containsStrict(2)
// → true
```

Strict comparison:

```typescript
collect([1, 2, 3])
    .containsStrict('2')
// → false (strict: 2 !== '2')
```

With key/value:

```typescript
collect([{ id: 1 }, { id: 2 }])
    .containsStrict('id', 1)
// → true
```

To loose equality, use [`contains`](/collections/filtering#contains). To negation, use [`doesntContain`](#doesntcontain).

---

### doesntContain()

The **doesntContain** method determines if the collection does not contain a given item.
This is the inverse of {@link contains}.

```typescript
collect([1, 2, 3])
    .doesntContain(4)
// → true
```

Item exists:

```typescript
collect([1, 2, 3])
    .doesntContain(2)
// → false
```

With key/value:

```typescript
collect([{ id: 1 }, { id: 2 }])
    .doesntContain('id', 3)
// → true
```

To check if item exists, use [`contains`](/collections/filtering#contains). To strict equality check, use [`containsStrict`](#containsstrict).

---

### doesntContainStrict()

The **doesntContainStrict** method determines if the collection does not contain
a given item using strict comparison.

```typescript
collect([1, 2, 3])
    .doesntContainStrict('1')
// → true (strict comparison: '1' !== 1)
```

To loose comparison, use [`doesntContain`](#doesntcontain). To inverse check, use [`containsStrict`](#containsstrict).

---

### has()

The **has** method determines if one or more keys exist in the collection.
When checking multiple keys, all must exist for the method to return true.

Single key:

```typescript
collect({ name: 'Taylor', age: 25 })
    .has('name')
// → true
```

Multiple keys (all must exist):

```typescript
collect({ name: 'Taylor', age: 25 })
    .has(['name', 'age'])
// → true
```

Missing key:

```typescript
collect({ name: 'Taylor' })
    .has('age')
// → false
```

With dot notation:

```typescript
collect({ user: { name: 'Taylor' } })
    .has('user.name')
// → true
```

To true if ANY key exists, use [`hasAny`](#hasany). To get value at key, use [`get`](/collections/finding#get).

---

### hasAny()

The **hasAny** method determines if any of the given keys exist in the collection.
Returns true if at least one key exists.

```typescript
collect({ name: 'Taylor', age: 25 })
    .hasAny(['name', 'email'])
// → true (name exists)
```

None exist:

```typescript
collect({ name: 'Taylor' })
    .hasAny(['age', 'email'])
// → false
```

To true only if ALL keys exist, use [`has`](#has). To check if value exists, use [`contains`](/collections/filtering#contains).

---

### isEmpty()

The **isEmpty** method returns `true` if the collection is empty; otherwise, `false` is returned.

```typescript
collect([])
    .isEmpty()
// → true
```

Non-empty:

```typescript
collect([1, 2, 3])
    .isEmpty()
// → false
```

With objects:

```typescript
collect({})
    .isEmpty()
// → true
```

To inverse check, use [`isNotEmpty`](#isnotempty). To get number of items, use [`count`](/collections/aggregating#count).

---

### isNotEmpty()

The **isNotEmpty** method returns `true` if the collection is not empty; otherwise, `false` is returned.

```typescript
collect([1, 2, 3])
    .isNotEmpty()
// → true
```

Empty:

```typescript
collect([])
    .isNotEmpty()
// → false
```

To inverse check, use [`isEmpty`](#isempty). To get number of items, use [`count`](/collections/aggregating#count).

---

### containsOneItem()

The **containsOneItem** method returns `true` if the collection contains exactly one item.

```typescript
collect([1])
    .containsOneItem()
// → true
```

Multiple items:

```typescript
collect([1, 2])
    .containsOneItem()
// → false
```

Empty:

```typescript
collect([])
    .containsOneItem()
// → false
```

To get number of items, use [`count`](/collections/aggregating#count). To check if empty, use [`isEmpty`](#isempty).

---

### hasMany()

The **hasMany** method determines if multiple items exist in the collection
that match the given criteria.

```typescript
collect([1, 2, 3, 4, 5])
    .hasMany()
// → true
```

With callback:

```typescript
collect([1, 2, 3, 4, 5])
    .hasMany(n => n > 3)
// → true (4 and 5)
```

With key/value:

```typescript
collect([
  { role: 'admin' },
  { role: 'user' },
  { role: 'user' },
])
  .hasMany('role', 'user')
// → true
```

To check for exactly one, use [`hasSole`](#hassole). To get exact count, use [`count`](/collections/aggregating#count).

---

### hasSole()

The **hasSole** method determines if exactly one item exists in the collection
that matches the given criteria.

```typescript
collect([1])
    .hasSole()
// → true
```

With callback:

```typescript
collect([1, 2, 3, 4, 5])
    .hasSole(n => n > 4)
// → true (only 5)
```

With key/value:

```typescript
collect([
  { role: 'admin' },
  { role: 'user' },
  { role: 'user' },
])
  .hasSole('role', 'admin')
// → true
```

To get the sole item (throws if not exactly one), use [`sole`](/collections/finding#sole). To check for more than one, use [`hasMany`](#hasmany).

---

### every()

The **every** method verifies that all elements of the collection pass a given truth test.

Returns `true` if the callback returns truthy for every item. If the collection is
empty, **every** returns `true` (vacuous truth).

Pass a callback:

```typescript
collect([1, 2, 3])
    .every(n => n < 10)
// → true
```

Pass a property key:

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

To checking if any item passes, use [`some`](#some). To check if a specific value exists, use [`contains`](/collections/filtering#contains).

---

### some()

The **some** method is an alias for the `contains` method.

It determines whether the collection contains any items that pass the given truth test.
This method is useful for developers coming from JavaScript's Array.some() convention.

```typescript
collect([1, 2, 3, 4, 5])
    .some(n => n > 4)
// → true
```

To primary method (identical behavior), use [`contains`](/collections/filtering#contains). To checking if all items pass, use [`every`](#every).

---

### offsetExists()

The **offsetExists** method determines if a key exists at the given offset.

This method implements the ArrayAccess interface pattern, allowing bracket-style
key existence checks. It is used internally for array-like access.

```typescript
collect({ a: 1, b: 2 })
    .offsetExists('a')
// → true
```

Check numeric index:

```typescript
collect(['x', 'y', 'z'])
    .offsetExists(1)
// → true
```

To primary method for key existence checks, use [`has`](#has). To get value at offset, use [`offsetGet`](/collections/finding#offsetget).

---

### ensure()

The **ensure** method may be used to verify that all elements of a collection
are of a given type or list of types. Otherwise, an exception will be thrown.

With primitive type:

```typescript
collect([1, 2, 3])
    .ensure('number')
    .all()
// → [1, 2, 3]
```

With class:

```typescript
class User {}
collect([new User(), new User()])
    .ensure(User)
    .all()
// → [User, User]
```

Multiple types:

```typescript
collect([1, 'hello', 2])
    .ensure(['number', 'string'])
    .all()
// → [1, 'hello', 2]
```

Throws on mismatch:

```typescript
collect([1, 'hello'])
    .ensure('number')
// throws UnexpectedValueException
```

---
