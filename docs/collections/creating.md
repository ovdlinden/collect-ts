# Creating

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### make()

Creates a new collection instance from the given items.
This is equivalent to calling `new Collection()` or the `collect()` helper.

```typescript
Collection.make([1, 2, 3])
// → Collection [1, 2, 3]
```

From an object:

```typescript
Collection.make({ name: 'Taylor', role: 'admin' })
// → Collection { name: 'Taylor', role: 'admin' }
```

To wrapping non-collection values, use [`wrap`](#wrap). To creating an empty collection, use [`empty`](#empty).

---

### wrap()

Wraps the given value in a collection when applicable.
Arrays and iterables are converted directly, single values become a
one-element collection, and existing collections pass through unchanged.

For an array:

```typescript
Collection.wrap([1, 2, 3])
// → Collection [1, 2, 3]
```

For a single value:

```typescript
Collection.wrap('hello')
// → Collection ['hello']
```

An existing collection passes through unchanged:

```typescript
Collection.wrap(collect([1, 2]))
// → Collection [1, 2]
```

To extracting the underlying array, use [`unwrap`](#unwrap). To creating from items directly, use [`make`](#make).

---

### unwrap()

Returns the underlying array from the given value
when possible. If the value is already an array, it is returned as-is.
If the value is a collection, the underlying array is extracted.

To unwrap a collection:

```typescript
Collection.unwrap(collect([1, 2, 3]))
// → [1, 2, 3]
```

If already an array, it passes through:

```typescript
Collection.unwrap([1, 2, 3])
// → [1, 2, 3]
```

To wrapping a value in a collection, use [`wrap`](#wrap). To getting items from an instance, use [`all`](/collections/finding#all).

---

### empty()

Creates an empty collection. This is useful when you
need a typed empty collection as a starting point for building up items.

```typescript
Collection.empty()
// → Collection []
```

For a typed empty collection:

```typescript
Collection.empty<User>()
// → Collection<User> []
```

To creating with items, use [`make`](#make). To checking if a collection is empty, use [`isEmpty`](/collections/checking#isempty).

---

### fromJson()

Creates a collection from a JSON string. The string
must be valid JSON representing either an array or an object.

From JSON array:

```typescript
Collection.fromJson('[1, 2, 3]')
// → Collection [1, 2, 3]
```

From JSON object:

```typescript
Collection.fromJson('{"a": 1, "b": 2}')
// → Collection {a: 1, b: 2}
```

To converting collection to JSON, use [`toJson`](/collections/finding#tojson).

---
