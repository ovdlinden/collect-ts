# Aggregating

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### median()

The `median` method returns the median value of a given key.

The median is the middle value when all values are sorted in order. For collections with
an even number of items, it returns the average of the two middle values.

```typescript
collect([1, 3, 3, 6, 7, 8, 9])
    .median()
// → 6
```

For an even count, it returns the average of two middle values:

```typescript
collect([1, 2, 3, 4])
    .median()
// → 2.5
```

By property:

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
  { name: 'Lamp', price: 50 },
])
  .median('price')
// → 100
```

For Get the arithmetic mean, use [`avg`](#avg). For Get the most frequent value(s), use [`mode`](#mode).

---

### mode()

The `mode` method returns the mode value of a given key, which is the value that appears
most frequently in the collection.

If multiple values share the highest frequency, all of them are returned. Returns null
if the collection is empty.

```typescript
collect([1, 1, 2, 4])
    .mode()
// → [1]
```

For multiple modes, all are returned:

```typescript
collect([1, 1, 2, 2, 3])
    .mode()
// → [1, 2]
```

By property:

```typescript
collect([
  { name: 'Desk', category: 'furniture' },
  { name: 'Chair', category: 'furniture' },
  { name: 'Laptop', category: 'electronics' },
])
  .mode('category')
// → ['furniture']
```

For Get the middle value, use [`median`](#median). For Get the arithmetic mean, use [`avg`](#avg).

---

### count()

The `count` method returns the total number of items in the collection.

```typescript
collect([1, 2, 3])
    .count()
// → 3
```

For Count items grouped by key/callback, use [`countBy`](/collections/grouping#countby). For Check if collection has no items, use [`isEmpty`](/collections/checking#isempty).

---

### sum()

Sum all items, or a specific key/callback result.

```typescript
collect([1, 2, 3])
    .sum()
// → 6
```

To sum a property:

```typescript
collect([
  { id: 1, total: 100 },
  { id: 2, total: 50 },
])
  .sum('total')
// → 150
```

For Calculate average instead, use [`avg`](#avg). For Get minimum value, use [`min`](#min).

---

### avg()

The `avg` method returns the average value of a given key.

```typescript
collect([1, 2, 3])
    .avg()
// → 2
```

By property:

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
])
  .avg('price')
// → 150
```

For Get total instead of average, use [`sum`](#sum). For Get minimum value, use [`min`](#min).

---

### average()

The `average` method is an alias for the `avg` method.

For Primary method, use [`avg`](#avg).

---

### min()

The `min` method returns the minimum value of a given key.

```typescript
collect([3, 1, 2])
    .min()
// → 1
```

By property:

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
])
  .min('price')
// → 100
```

For Get maximum value, use [`max`](#max). For Get average value, use [`avg`](#avg).

---

### max()

The `max` method returns the maximum value of a given key.

```typescript
collect([1, 2, 3])
    .max()
// → 3
```

By property:

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
])
  .max('price')
// → 200
```

For Get minimum value, use [`min`](#min). For Get average value, use [`avg`](#avg).

---

### percentage()

The `percentage` method may be used to quickly determine the percentage of items in the
collection that pass a given truth test.

```typescript
collect([1, 1, 2, 2, 2, 3])
    .percentage(value => value === 1)
// → 33.33
```

You may also specify precision:

```typescript
collect([
  { name: 'Desk', available: true },
  { name: 'Chair', available: true },
  { name: 'Lamp', available: true },
  { name: 'Rug', available: false },
])
  .percentage(p => p.available, 1)
// → 75.0
```

For Count total items, use [`count`](#count). For Get matching items, use [`filter`](/collections/filtering#filter).

---

### implode()

The `implode` method joins items in a collection.

Its arguments depend on the type of items in the collection. If the collection contains
arrays or objects, pass the key of the attribute you wish to join, and the "glue" string.
For simple values, pass just the glue string.

For a simple array:

```typescript
collect([1, 2, 3, 4, 5])
    .implode('-')
// → '1-2-3-4-5'
```

By property:

```typescript
collect([
  { name: 'Desk' },
  { name: 'Chair' },
  { name: 'Bookcase' },
])
  .implode('name', ', ')
// → 'Desk, Chair, Bookcase'
```

You may also pass a callback:

```typescript
collect([
  { name: 'Desk' },
  { name: 'Chair' },
])
  .implode(p => p.name.toUpperCase(), ', ')
// → 'DESK, CHAIR'
```

For Join with a final separator, use [`join`](#join). For Convert to comma-separated string, use [`toString`](#tostring).

---

### join()

The `join` method joins the collection's values with a string.

Using its second argument, you may also specify how the final element should be appended,
which is useful for natural-language formatting like "and" or "or".

```typescript
collect(['a', 'b', 'c'])
    .join(', ')
// → 'a, b, c'
```

You may specify a final glue:

```typescript
collect(['a', 'b', 'c'])
    .join(', ', ', and ')
// → 'a, b, and c'
```

For Oxford comma style:

```typescript
collect(['Taylor', 'Abigail', 'Dayle'])
    .join(', ', ', and ')
// → 'Taylor, Abigail, and Dayle'
```

For Join by property or callback, use [`implode`](#implode). For Convert to comma-separated string, use [`toString`](#tostring).

---

### toString()

The `toString` method returns the collection as a comma-separated string.

This method is automatically called when the collection is coerced to a string.

```typescript
collect([1, 2, 3])
    .toString()
// → '1, 2, 3'
```

For Join with custom separator, use [`join`](#join). For Join by property or callback, use [`implode`](#implode).

---

### reduce()

The `reduce` method reduces the collection to a single value, passing the result of each
iteration into the subsequent iteration.

The value for the accumulator on the first iteration is the initial value; on subsequent
iterations, it is the value returned by the previous callback.

```typescript
collect([1, 2, 3])
    .reduce((carry, item) => carry + item, 0)
// → 6
```

To build an object:

```typescript
collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
  .reduce((carry, user) => {
    carry[user.id] = user.name
    return carry
  }, {})
// → { 1: 'Taylor', 2: 'Abigail' }
```

For Reduce with spread arguments, use [`reduceSpread`](#reducespread). For Same as reduce (keys always available), use [`reduceWithKeys`](#reducewithkeys).

---

### reduceSpread()

The `reduceSpread` method reduces the collection to multiple values using spread arguments.

The callback receives the accumulated values spread as individual arguments, followed by
the current item and key. It must return an array of the same shape as the initial values.

To track multiple values:

```typescript
collect([1, 2, 3, 4, 5])
    .reduceSpread((sum, product, item) => [sum + item, product * item], 0, 1)
// → [15, 120] (sum=15, product=120)
```

For Reduce to a single value, use [`reduce`](#reduce). For Reduce by mutating an object, use [`reduceInto`](#reduceinto).

---

### reduceWithKeys()

The `reduceWithKeys` method reduces the collection with access to both value and key.

This method works identically to `reduce` since the key is always provided as the third
argument. It exists for API compatibility with Laravel.

To build a keyed object:

```typescript
collect({ a: 1, b: 2, c: 3 })
    .reduceWithKeys((carry, value, key) => {
        carry[key] = value * 2
        return carry
    }, {})
// → { a: 2, b: 4, c: 6 }
```

For Primary reduce method, use [`reduce`](#reduce).

---

### reduceInto()

The `reduceInto` method reduces the collection into an existing object, mutating it.

Unlike `reduce`, the callback does not return a value. Instead, it modifies the carry
object directly. The same object is returned at the end.

To build an object by mutation:

```typescript
collect([1, 2, 3])
    .reduceInto({ total: 0 }, (carry, item) => {
        carry.total += item
    })
// → { total: 6 }
```

To populate an existing array:

```typescript
collect([
  { name: 'Taylor', active: true },
  { name: 'Abigail', active: true },
  { name: 'James', active: false },
])
  .reduceInto([], (carry, user) => {
    if (user.active) carry.push(user.name)
  })
// → ['Taylor', 'Abigail']
```

For Reduce with immutable accumulator, use [`reduce`](#reduce). For Reduce to multiple values, use [`reduceSpread`](#reducespread).

---

### toArray()

The `toArray` method converts the collection into a plain array.

For associative collections (keyed objects), it returns a record instead. Nested
collections are also recursively converted to arrays/records.

```typescript
collect([1, 2, 3])
    .toArray()
// → [1, 2, 3]
```

For an associative collection:

```typescript
collect({ a: 1, b: 2 })
    .toArray()
// → { a: 1, b: 2 }
```

For nested collections:

```typescript
collect([collect([1, 2]), collect([3, 4])])
    .toArray()
// → [[1, 2], [3, 4]]
```

For Get raw items without recursion, use [`all`](/collections/finding#all). For Get values as new collection, use [`values`](/collections/finding#values).

---

### toJson()

The `toJson` method converts the collection into a JSON serialized string.

```typescript
collect({ name: 'Desk', price: 200 })
    .toJson()
// → '{"name":"Desk","price":200}'
```

For JSON with indentation, use [`toPrettyJson`](#toprettyjson). For Convert to array/record, use [`toArray`](#toarray).

---

### toPrettyJson()

The `toPrettyJson` method converts the collection into a pretty-printed JSON string.

Uses 2-space indentation for readability.

```typescript
collect({ name: 'Desk', price: 200 })
    .toPrettyJson()
// → '{\n  "name": "Desk",\n  "price": 200\n}'
```

For Compact JSON string, use [`toJson`](#tojson). For Convert to array/record, use [`toArray`](#toarray).

---
