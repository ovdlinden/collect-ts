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

With even count

```typescript
collect([1, 2, 3, 4])
    .median()
// → 2.5
```

By property

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
  { name: 'Lamp', price: 50 },
])
  .median('price')
// → 100
```

For Get the arithmetic mean, see the [avg](#avg) method. For Get the most frequent value(s), see the [mode](#mode) method. For Get the minimum value, see the [min](#min) method. For Get the maximum value, see the [max](#max) method.

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

Multiple modes

```typescript
collect([1, 1, 2, 2, 3])
    .mode()
// → [1, 2]
```

By property

```typescript
collect([
  { name: 'Desk', category: 'furniture' },
  { name: 'Chair', category: 'furniture' },
  { name: 'Laptop', category: 'electronics' },
])
  .mode('category')
// → ['furniture']
```

For Get the middle value, see the [median](#median) method. For Get the arithmetic mean, see the [avg](#avg) method. For Count occurrences by value, see the [countBy](/collections/grouping#countby) method.

---

### count()

The `count` method returns the total number of items in the collection.

```typescript
collect([1, 2, 3])
    .count()
// → 3
```

For Count items grouped by key/callback, see the [countBy](/collections/grouping#countby) method. For Check if collection has no items, see the [isEmpty](/collections/checking#isempty) method. For Check if collection has items, see the [isNotEmpty](/collections/checking#isnotempty) method.

---

### sum()

Sum all items, or a specific key/callback result.

Sum numbers

```typescript
collect([1, 2, 3])
    .sum()
// → 6
```

Sum property

```typescript
collect([
  { id: 1, total: 100 },
  { id: 2, total: 50 },
])
  .sum('total')
// → 150
```

For Calculate average instead, see the [avg](#avg) method. For Get minimum value, see the [min](#min) method. For Get maximum value, see the [max](#max) method. For Count items instead, see the [count](#count) method.

---

### avg()

The `avg` method returns the average value of a given key.

```typescript
collect([1, 2, 3])
    .avg()
// → 2
```

By property

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
])
  .avg('price')
// → 150
```

For Get total instead of average, see the [sum](#sum) method. For Get minimum value, see the [min](#min) method. For Get maximum value, see the [max](#max) method. For Get median value, see the [median](#median) method.

---

### average()

The `average` method is an alias for the `avg` method.

For Primary method, see the [avg](#avg) method.

---

### min()

The `min` method returns the minimum value of a given key.

```typescript
collect([3, 1, 2])
    .min()
// → 1
```

By property

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
])
  .min('price')
// → 100
```

For Get maximum value, see the [max](#max) method. For Get average value, see the [avg](#avg) method.

---

### max()

The `max` method returns the maximum value of a given key.

```typescript
collect([1, 2, 3])
    .max()
// → 3
```

By property

```typescript
collect([
  { name: 'Desk', price: 200 },
  { name: 'Chair', price: 100 },
])
  .max('price')
// → 200
```

For Get minimum value, see the [min](#min) method. For Get average value, see the [avg](#avg) method.

---

### percentage()

The `percentage` method may be used to quickly determine the percentage of items in the
collection that pass a given truth test.

```typescript
collect([1, 1, 2, 2, 2, 3])
    .percentage(value => value === 1)
// → 33.33
```

With precision

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

For Count total items, see the [count](#count) method. For Get matching items, see the [filter](/collections/filtering#filter) method.

---

### implode()

The `implode` method joins items in a collection.

Its arguments depend on the type of items in the collection. If the collection contains
arrays or objects, pass the key of the attribute you wish to join, and the "glue" string.
For simple values, pass just the glue string.

Simple array

```typescript
collect([1, 2, 3, 4, 5])
    .implode('-')
// → '1-2-3-4-5'
```

By property

```typescript
collect([
  { name: 'Desk' },
  { name: 'Chair' },
  { name: 'Bookcase' },
])
  .implode('name', ', ')
// → 'Desk, Chair, Bookcase'
```

With callback

```typescript
collect([
  { name: 'Desk' },
  { name: 'Chair' },
])
  .implode(p => p.name.toUpperCase(), ', ')
// → 'DESK, CHAIR'
```

For Join with a final separator, see the [join](#join) method. For Convert to comma-separated string, see the [toString](#tostring) method.

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

With final glue

```typescript
collect(['a', 'b', 'c'])
    .join(', ', ', and ')
// → 'a, b, and c'
```

Oxford comma style

```typescript
collect(['Taylor', 'Abigail', 'Dayle'])
    .join(', ', ', and ')
// → 'Taylor, Abigail, and Dayle'
```

For Join by property or callback, see the [implode](#implode) method. For Convert to comma-separated string, see the [toString](#tostring) method.

---

### toString()

The `toString` method returns the collection as a comma-separated string.

This method is automatically called when the collection is coerced to a string.

```typescript
collect([1, 2, 3])
    .toString()
// → '1, 2, 3'
```

For Join with custom separator, see the [join](#join) method. For Join by property or callback, see the [implode](#implode) method. For Convert to JSON string, see the [toJson](#tojson) method.

---

### reduce()

The `reduce` method reduces the collection to a single value, passing the result of each
iteration into the subsequent iteration.

The value for the accumulator on the first iteration is the initial value; on subsequent
iterations, it is the value returned by the previous callback.

Sum values

```typescript
collect([1, 2, 3])
    .reduce((carry, item) => carry + item, 0)
// → 6
```

Build object

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

For Reduce with spread arguments, see the [reduceSpread](#reducespread) method. For Same as reduce (keys always available), see the [reduceWithKeys](#reducewithkeys) method. For Reduce by mutating an object, see the [reduceInto](#reduceinto) method.

---

### reduceSpread()

The `reduceSpread` method reduces the collection to multiple values using spread arguments.

The callback receives the accumulated values spread as individual arguments, followed by
the current item and key. It must return an array of the same shape as the initial values.

Track multiple values

```typescript
collect([1, 2, 3, 4, 5])
    .reduceSpread((sum, product, item) => [sum + item, product * item], 0, 1)
// → [15, 120] (sum=15, product=120)
```

For Reduce to a single value, see the [reduce](#reduce) method. For Reduce by mutating an object, see the [reduceInto](#reduceinto) method.

---

### reduceWithKeys()

The `reduceWithKeys` method reduces the collection with access to both value and key.

This method works identically to `reduce` since the key is always provided as the third
argument. It exists for API compatibility with Laravel.

Build keyed object

```typescript
collect({ a: 1, b: 2, c: 3 })
    .reduceWithKeys((carry, value, key) => {
        carry[key] = value * 2
        return carry
    }, {})
// → { a: 2, b: 4, c: 6 }
```

For Primary reduce method, see the [reduce](#reduce) method.

---

### reduceInto()

The `reduceInto` method reduces the collection into an existing object, mutating it.

Unlike `reduce`, the callback does not return a value. Instead, it modifies the carry
object directly. The same object is returned at the end.

Build object by mutation

```typescript
collect([1, 2, 3])
    .reduceInto({ total: 0 }, (carry, item) => {
        carry.total += item
    })
// → { total: 6 }
```

Populate existing array

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

For Reduce with immutable accumulator, see the [reduce](#reduce) method. For Reduce to multiple values, see the [reduceSpread](#reducespread) method.

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

Associative collection

```typescript
collect({ a: 1, b: 2 })
    .toArray()
// → { a: 1, b: 2 }
```

Nested collections

```typescript
collect([collect([1, 2]), collect([3, 4])])
    .toArray()
// → [[1, 2], [3, 4]]
```

For Get raw items without recursion, see the [all](/collections/finding#all) method. For Get values as new collection, see the [values](/collections/finding#values) method. For Convert to JSON string, see the [toJson](#tojson) method.

---

### toJson()

The `toJson` method converts the collection into a JSON serialized string.

```typescript
collect({ name: 'Desk', price: 200 })
    .toJson()
// → '{"name":"Desk","price":200}'
```

For JSON with indentation, see the [toPrettyJson](#toprettyjson) method. For Convert to array/record, see the [toArray](#toarray) method. For Convert to comma-separated string, see the [toString](#tostring) method.

---

### toPrettyJson()

The `toPrettyJson` method converts the collection into a pretty-printed JSON string.

Uses 2-space indentation for readability.

```typescript
collect({ name: 'Desk', price: 200 })
    .toPrettyJson()
// → '{\n  "name": "Desk",\n  "price": 200\n}'
```

For Compact JSON string, see the [toJson](#tojson) method. For Convert to array/record, see the [toArray](#toarray) method.

---
