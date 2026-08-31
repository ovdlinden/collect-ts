# Aggregating

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### median()

The **median** method returns the median value of a given key.
The median is the middle value when all values are sorted in order.
For collections with an even number of items, it returns the average of the two middle values.

```typescript
collect([1, 3, 3, 6, 7, 8, 9])
    .median()
// → 6
```

With even count (average of middle two):

```typescript
collect([1, 2, 3, 4])
    .median()
// → 2.5
```

With a key:

```typescript
collect([
  { score: 80 },
  { score: 90 },
  { score: 85 },
])
  .median('score')
// → 85
```

To get the mean (average), use [`avg`](#avg). To get most frequent value, use [`mode`](#mode).

---

### mode()

The **mode** method returns the mode value of a given key.
The mode is the value that appears most often. If multiple values appear
with the same frequency, all of them are returned.

```typescript
collect([1, 2, 2, 3, 3, 3, 4])
    .mode()
// → [3]
```

Multiple modes:

```typescript
collect([1, 1, 2, 2, 3])
    .mode()
// → [1, 2]
```

With a key:

```typescript
collect([
  { size: 'S' },
  { size: 'M' },
  { size: 'M' },
  { size: 'L' },
])
  .mode('size')
// → ['M']
```

To get the middle value, use [`median`](#median). To get the mean (average), use [`avg`](#avg).

---

### count()

The **count** method returns the total number of items in the collection.

```typescript
collect([1, 2, 3, 4, 5])
    .count()
// → 5
```

To count grouped by key, use [`countBy`](/collections/grouping#countby). To check if empty, use [`isEmpty`](/collections/checking#isempty).

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

To calculate average instead, use [`avg`](#avg). To get minimum value, use [`min`](#min).

---

### avg()

The **avg** method returns the average value of a given key.

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

To get total instead of average, use [`sum`](#sum). To get minimum value, use [`min`](#min).

---

### average()

The **average** method returns the average value of a given key.
This is an alias for the {@link avg} method.

```typescript
collect([1, 2, 3, 4, 5])
    .average()
// → 3
```

With a key:

```typescript
collect([
  { name: 'Chair', price: 100 },
  { name: 'Desk', price: 200 },
  { name: 'Lamp', price: 50 },
])
  .average('price')
// → 116.67 (rounded: 350 / 3)
```

With a callback:

```typescript
collect([
  { quantity: 2, price: 10 },
  { quantity: 3, price: 20 },
])
  .average(item => item.quantity * item.price)
// → 40 ((20 + 60) / 2)
```

To primary method, use [`avg`](#avg). To sum all values, use [`sum`](#sum).

---

### min()

The **min** method returns the minimum value of a given key.

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

To get maximum value, use [`max`](#max). To get average value, use [`avg`](#avg).

---

### max()

The **max** method returns the maximum value of a given key.

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

To get minimum value, use [`min`](#min). To get average value, use [`avg`](#avg).

---

### percentage() <TryInPlayground code="collect([1, 1, 2, 2, 2, 3])&#10;    .percentage(value => value === 1)&#10;// → 33.33" />

The **percentage** method may be used to quickly determine the percentage of
items in the collection that pass a given truth test.

```typescript
collect([1, 1, 2, 2, 2, 3])
    .percentage(value => value === 1)
// → 33.33
```

With objects:

```typescript
collect([
  { product: 'Desk', active: true },
  { product: 'Chair', active: true },
  { product: 'Lamp', active: false },
])
  .percentage(item => item.active)
// → 66.67
```

Custom precision:

```typescript
collect([1, 2, 3, 4, 5])
    .percentage(n => n > 3, 0)
// → 40
```

To count items, use [`count`](#count). To filter matching items, use [`filter`](/collections/filtering#filter).

---

### implode()

The **implode** method joins items in a collection.

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

Pass a callback:

```typescript
collect([
  { name: 'Desk' },
  { name: 'Chair' },
])
  .implode(p => p.name.toUpperCase(), ', ')
// → 'DESK, CHAIR'
```

To join with a final separator, use [`join`](#join). To convert to comma-separated string, use [`toString`](/collections/finding#tostring).

---

### join()

The **join** method joins the collection's values with a string.

Using its second argument, you may also specify how the final element should be appended,
which is useful for natural-language formatting like "and" or "or".

```typescript
collect(['a', 'b', 'c'])
    .join(', ')
// → 'a, b, c'
```

Specify a final glue:

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

To join by property or callback, use [`implode`](#implode). To convert to comma-separated string, use [`toString`](/collections/finding#tostring).

---

### reduce() <TryInPlayground code="collect([1, 2, 3])&#10;    .reduce((carry, item) => carry + item, 0)&#10;// → 6" />

The **reduce** method reduces the collection to a single value, passing the result of each
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

To reduce with spread arguments, use [`reduceSpread`](#reducespread). To same as reduce (keys always available), use [`reduceWithKeys`](#reducewithkeys).

---

### reduceSpread() <TryInPlayground code="collect([1, 2, 3, 4])&#10;    .reduceSpread(&#10;        (sum, product, item) => [sum + item, product * item],&#10;        0, 1&#10;    )&#10;// → [10, 24]" />

The **reduceSpread** method reduces the collection to multiple values using spread arguments.

Calculate sum and product together:

```typescript
collect([1, 2, 3, 4])
    .reduceSpread(
        (sum, product, item) => [sum + item, product * item],
        0, 1
    )
// → [10, 24]
```

To single accumulator, use [`reduce`](#reduce). To reduce by mutating an object, use [`reduceInto`](#reduceinto).

---

### reduceWithKeys() <TryInPlayground code="collect({ a: 1, b: 2, c: 3 })&#10;    .reduceWithKeys((carry, value, key) => {&#10;        carry[key] = value * 2&#10;        return carry&#10;    }, {})&#10;// → { a: 2, b: 4, c: 6 }" />

The **reduceWithKeys** method reduces the collection with access to both value and key.

This method works identically to `reduce` since the key is always provided as the third
argument. It exists for API compatibility with Laravel.

Build a keyed object:

```typescript
collect({ a: 1, b: 2, c: 3 })
    .reduceWithKeys((carry, value, key) => {
        carry[key] = value * 2
        return carry
    }, {})
// → { a: 2, b: 4, c: 6 }
```

To primary reduce method, use [`reduce`](#reduce).

---

### reduceInto() <TryInPlayground code="collect([1, 2, 3])&#10;    .reduceInto({ total: 0 }, (carry, item) => {&#10;        carry.total += item&#10;    })&#10;// → { total: 6 }" />

The **reduceInto** method reduces the collection into an existing object, mutating it.

Unlike `reduce`, the callback does not return a value. Instead, it modifies the carry
object directly. The same object is returned at the end.

```typescript
collect([1, 2, 3])
    .reduceInto({ total: 0 }, (carry, item) => {
        carry.total += item
    })
// → { total: 6 }
```

Populate an existing array:

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

To reduce with immutable accumulator, use [`reduce`](#reduce). To reduce to multiple values, use [`reduceSpread`](#reducespread).

---
