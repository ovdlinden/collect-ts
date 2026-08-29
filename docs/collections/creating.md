# Creating

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### make()

The `make` method creates a new collection instance from the given items.
This is equivalent to calling `new Collection()` or the `collect()` helper.

Basic usage

```typescript
Collection.make([1, 2, 3])
// → Collection [1, 2, 3]
```

From an object

```typescript
Collection.make({ name: 'Taylor', role: 'admin' })
// → Collection { name: 'Taylor', role: 'admin' }
```

For wrapping non-collection values, see the [wrap](#wrap) method. For creating an empty collection, see the [empty](#empty) method.

---

### wrap()

The `wrap` method wraps the given value in a collection when applicable.
Arrays and iterables are converted directly, single values become a
one-element collection, and existing collections pass through unchanged.

Array

```typescript
Collection.wrap([1, 2, 3])
// → Collection [1, 2, 3]
```

Single value

```typescript
Collection.wrap('hello')
// → Collection ['hello']
```

Existing collection passes through

```typescript
Collection.wrap(collect([1, 2]))
// → Collection [1, 2]
```

For extracting the underlying array, see the [unwrap](#unwrap) method. For creating from items directly, see the [make](#make) method.

---

### unwrap()

The `unwrap` method returns the underlying array from the given value
when possible. If the value is already an array, it is returned as-is.
If the value is a collection, the underlying array is extracted.

Unwrapping a collection

```typescript
Collection.unwrap(collect([1, 2, 3]))
// → [1, 2, 3]
```

Already an array

```typescript
Collection.unwrap([1, 2, 3])
// → [1, 2, 3]
```

For wrapping a value in a collection, see the [wrap](#wrap) method. For getting items from an instance, see the [all](/collections/finding#all) method.

---

### empty()

The `empty` method creates an empty collection. This is useful when you
need a typed empty collection as a starting point for building up items.

Basic usage

```typescript
Collection.empty()
// → Collection []
```

Typed empty collection

```typescript
Collection.empty<User>()
// → Collection<User> []
```

For creating with items, see the [make](#make) method. For checking if a collection is empty, see the [isEmpty](/collections/checking#isempty) method.

---

### fromJson()

The `fromJson` method creates a collection from a JSON string. The string
must be valid JSON representing either an array or an object.

From JSON array

```typescript
Collection.fromJson('[1, 2, 3]')
// → Collection [1, 2, 3]
```

From JSON object

```typescript
Collection.fromJson('{"a": 1, "b": 2}')
// → Collection {a: 1, b: 2}
```

For converting collection to JSON, see the [toJson](/collections/aggregating#tojson) method.

---
