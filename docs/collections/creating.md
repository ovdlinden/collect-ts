# Creating

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### make()

The **make** method creates a new collection instance from the given items.
You may pass an array, an object, or an existing collection:

```typescript
Collection.make([1, 2, 3])
// → Collection [1, 2, 3]
```

```typescript
Collection.make({ name: 'Taylor', role: 'admin' })
// → Collection { name: 'Taylor', role: 'admin' }
```

---

### wrap()

The **wrap** method will wrap the given value in a collection. If the given
value is already a collection, it will be returned unchanged:

```typescript
Collection.wrap([1, 2, 3])
// → Collection [1, 2, 3]
```

If the given value is a single item, it becomes a one-element collection:

```typescript
Collection.wrap('hello')
// → Collection ['hello']
```

If the value is already a collection, it is returned unchanged:

```typescript
Collection.wrap(collect([1, 2]))
// → Collection [1, 2]
```

---

### unwrap()

The **unwrap** method returns the underlying items from the given value.
If the value is a collection, the underlying array is returned. If the
value is already an array, it is returned unchanged:

```typescript
Collection.unwrap(collect([1, 2, 3]))
// → [1, 2, 3]
```

```typescript
Collection.unwrap([1, 2, 3])
// → [1, 2, 3]
```

---

### empty()

The **empty** method returns an empty collection. This is useful when you
need a typed empty collection as a starting point:

```typescript
Collection.empty()
// → Collection []
```

Specify a type parameter for type safety:

```typescript
Collection.empty<User>()
// → Collection<User> []
```

---

### fromJson()

The **fromJson** method creates a collection from a JSON string:

```typescript
Collection.fromJson('[1, 2, 3]')
// → Collection [1, 2, 3]
```

```typescript
Collection.fromJson('{"a": 1, "b": 2}')
// → Collection {a: 1, b: 2}
```

---
