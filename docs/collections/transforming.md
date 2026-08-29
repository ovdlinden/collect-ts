# Transforming

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: npm run docs:guides -->

### range()

The `range` method creates a collection containing numbers within a specified range.

Works in both directions: ascending when from < to, descending otherwise.

Ascending

```typescript
Collection.range(1, 5)
// → Collection [1, 2, 3, 4, 5]
```

Descending

```typescript
Collection.range(5, 1)
// → Collection [5, 4, 3, 2, 1]
```

For Generate by calling a function N times, see the [times](#times) method.

---

### times()

The `times` method creates a new collection by invoking the given closure a specified number of times.

The callback receives 1-based indices (1, 2, 3...). Without a callback,
returns a collection of numbers 1 through N.

With callback

```typescript
Collection.times(3, i => i * 2)
// → Collection [2, 4, 6]
```

Without callback

```typescript
Collection.times(3)
// → Collection [1, 2, 3]
```

For Generate a range between two numbers, see the [range](#range) method.

---

### map()

The `map` method iterates over the collection and passes each value to the given callback.
The callback is free to modify the item and return it, thus forming a new collection of
modified items.

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
// → Collection [2, 4, 6]
```

Extract property

```typescript
collect([
  { name: 'Taylor' },
  { name: 'Abigail' },
])
  .map(u => u.name)
// → ['Taylor', 'Abigail']
```

For Extract a single property by key, see the [pluck](#pluck) method. For Transform and change keys, see the [mapWithKeys](#mapwithkeys) method. For Map and flatten results, see the [flatMap](#flatmap) method. For Mutate the collection in place, see the [transform](#transform) method.

---

### mapWithKeys()

The `mapWithKeys` method iterates through the collection and passes each value to the given
callback. The callback should return an associative array containing a single key/value pair.

```typescript
collect([
    { name: 'John', department: 'Sales' },
    { name: 'Jane', department: 'Marketing' }
]).mapWithKeys(emp => [emp.name, emp.department])
// → { John: 'Sales', Jane: 'Marketing' }
```

For Transform values keeping original keys, see the [map](#map) method. For Key by a property without transforming values, see the [keyBy](/collections/grouping#keyby) method. For Extract values by key, see the [pluck](#pluck) method.

---

### mapToDictionary()

The `mapToDictionary` method runs the given callback over each item and groups the returned
values by their keys. Unlike `groupBy`, this method allows complete control over the grouped
values through the callback's return tuple.

```typescript
collect([
    { name: 'John', department: 'Sales' },
    { name: 'Jane', department: 'Sales' },
    { name: 'Bob', department: 'Marketing' }
]).mapToDictionary(emp => [emp.department, emp.name])
// → { Sales: ['John', 'Jane'], Marketing: ['Bob'] }
```

For Similar but returns nested Collections, see the [mapToGroups](#maptogroups) method. For Group by key without value transformation, see the [groupBy](/collections/grouping#groupby) method. For Map to single key-value pairs, see the [mapWithKeys](#mapwithkeys) method.

---

### mapToGroups()

The `mapToGroups` method groups the collection's items by the given callback. The callback
should return an associative array containing a single key/value pair, allowing you to
customize both the group key and the value placed in each group.

```typescript
collect([
    { name: 'John', department: 'Sales' },
    { name: 'Jane', department: 'Sales' },
    { name: 'Bob', department: 'Marketing' }
]).mapToGroups(emp => [emp.department, emp.name])
// → { Sales: Collection(['John', 'Jane']), Marketing: Collection(['Bob']) }
```

For Similar but returns plain arrays, see the [mapToDictionary](#maptodictionary) method. For Group by key without value transformation, see the [groupBy](/collections/grouping#groupby) method.

---

### mapInto()

The `mapInto` method iterates over the collection and creates a new instance of the given
class for each item, passing the item value and key to the constructor.

```typescript
class Currency {
    constructor(public amount: number) {}
    format() { return `$${this.amount.toFixed(2)}`; }
}
collect([100, 250, 50])
    .mapInto(Currency)
    .map(c => c.format())
// → ['$100.00', '$250.00', '$50.00']
```

For Transform with arbitrary callback, see the [map](#map) method. For passing entire collection to a class constructor, see the [pipeInto](#pipeinto) method.

---

### mapSpread()

The `mapSpread` method iterates over the collection's items, passing each nested item value
into the given callback as separate arguments. This is useful when working with nested arrays
where each sub-array's elements should be passed as individual arguments.

```typescript
collect([[1, 2], [3, 4], [5, 6]])
    .mapSpread((a, b) => a + b)
// → [3, 7, 11]
```

With key as final argument

```typescript
collect([['Taylor', 'Laravel'], ['Caleb', 'Livewire']])
    .mapSpread((name, project, key) => `${key}: ${name} - ${project}`)
// → ['0: Taylor - Laravel', '1: Caleb - Livewire']
```

For Iterate without transforming, see the [eachSpread](#eachspread) method. For Map and flatten results, see the [flatMap](#flatmap) method.

---

### flatMap()

Map each item then flatten the results by one level.

```typescript
collect([[1, 2], [3, 4]])
    .flatMap(arr => arr.map(n => n * 2))
// → Collection [2, 4, 6, 8]
```

For Transform without flattening, see the [map](#map) method. For Flatten without mapping, see the [flatten](#flatten) method. For Flatten arrays of arrays, see the [collapse](#collapse) method.

---

### collapse()

The `collapse` method collapses a collection of arrays into a single, flat collection.
It merges the elements of nested arrays or Collections into one level.

```typescript
collect([[1, 2], [3, 4], [5]])
    .collapse()
// → [1, 2, 3, 4, 5]
```

With nested Collections

```typescript
collect([collect([1, 2]), collect([3, 4])])
    .collapse()
// → [1, 2, 3, 4]
```

For Recursively flatten to any depth, see the [flatten](#flatten) method. For Map then collapse, see the [flatMap](#flatmap) method.

---

### collapseWithKeys()

The `collapseWithKeys` method collapses a collection of objects into a single object,
preserving the keys from each nested object. Later objects override earlier ones when
keys conflict.

```typescript
collect([{ name: 'John' }, { email: 'john@example.com' }, { role: 'admin' }])
    .collapseWithKeys()
// → { name: 'John', email: 'john@example.com', role: 'admin' }
```

With overlapping keys

```typescript
collect([{ a: 1 }, { a: 2, b: 3 }])
    .collapseWithKeys()
// → { a: 2, b: 3 }
```

For Collapse arrays into a flat array, see the [collapse](#collapse) method. For Merge another collection into this one, see the [merge](/collections/combining#merge) method.

---

### flatten()

The `flatten` method flattens a multi-dimensional collection into a single dimension.
You may optionally pass a depth argument to limit how many levels deep the flattening
should go.

Flatten all levels

```typescript
collect([[1, [2, [3]]], [4]])
    .flatten()
// → [1, 2, 3, 4]
```

Flatten one level

```typescript
collect([[1, [2]], [3]])
    .flatten(1)
// → [1, [2], 3]
```

For Flatten by exactly one level, see the [collapse](#collapse) method. For Flatten to dot notation keys, see the [dot](#dot) method.

---

### flip()

The `flip` method swaps the collection's keys with their corresponding values. Values
are converted to strings since object keys must be strings.

```typescript
collect({ name: 'taylor', framework: 'laravel' })
    .flip()
// → { taylor: 'name', laravel: 'framework' }
```

Array to object

```typescript
collect(['a', 'b', 'c'])
    .flip()
// → { a: '0', b: '1', c: '2' }
```

For Get just the keys, see the [keys](/collections/finding#keys) method. For Get just the values, see the [values](/collections/finding#values) method.

---

### pad()

The `pad` method fills the array with the given value until the array reaches the
specified size. This method behaves like PHP's `array_pad` function. To pad to the
left, specify a negative size. No padding occurs if the absolute value of the given
size is less than or equal to the length of the array.

Pad right

```typescript
collect([1, 2, 3])
    .pad(5, 0)
// → [1, 2, 3, 0, 0]
```

Pad left

```typescript
collect([1, 2, 3])
    .pad(-5, 0)
// → [0, 0, 1, 2, 3]
```

For Take items from start or end, see the [take](/collections/filtering#take) method. For Insert items at a position, see the [splice](#splice) method.

---

### forget()

The `forget` method removes an item from the collection by its key.

Unlike `except`, this method modifies the collection in place. For numeric keys,
the collection does not re-index the remaining items.

Remove single key

```typescript
collect({ a: 1, b: 2, c: 3 })
    .forget('b')
// → Collection { a: 1, c: 3 }
```

Remove multiple keys

```typescript
collect({ a: 1, b: 2, c: 3 })
    .forget(['a', 'c'])
// → Collection { b: 2 }
```

For returning new collection without specified keys, see the [except](/collections/filtering#except) method. For Remove and return a single value, see the [pull](/collections/finding#pull) method.

---

### pluck()

Extract values at a given path from each item.

Extract values

```typescript
collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
  .pluck('name')
// → ['Taylor', 'Abigail']
```

With custom keys

```typescript
collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
  .pluck('name', 'id')
// → { 1: 'Taylor', 2: 'Abigail' }
```

For Transform items with full callback control, see the [map](#map) method. For Get first item's value at path, see the [value](/collections/finding#value) method.

---

### transform()

The `transform` method iterates over the collection and calls the given callback with each
item in the collection. The items in the collection will be replaced by the values returned
by the callback. Unlike `map`, this method modifies the collection in place.

```typescript
const collection = collect([1, 2, 3]);
collection.transform(n => n * 2);
collection.all();
// → [2, 4, 6]
```

Chain after transform

```typescript
collect({ price: 100, tax: 10 })
    .transform((v, k) => k === 'price' ? v * 1.1 : v)
    .sum()
// → 120
```

For Transform without mutation, see the [map](#map) method. For Iterate without transforming, see the [each](#each) method.

---

### splice()

The `splice` method removes and returns a slice of items starting at the specified index.
You may pass a second argument to limit the size of the removed slice, and a third argument
containing replacement items to insert at the splice point. This method modifies the
original collection.

Remove from index

```typescript
const collection = collect([1, 2, 3, 4, 5]);
const chunk = collection.splice(2);
chunk.all();       // → [3, 4, 5]
collection.all();  // → [1, 2]
```

Remove specific length

```typescript
const collection = collect([1, 2, 3, 4, 5]);
const chunk = collection.splice(2, 1);
chunk.all();       // → [3]
collection.all();  // → [1, 2, 4, 5]
```

Replace items

```typescript
const collection = collect([1, 2, 3, 4, 5]);
collection.splice(2, 1, [10, 11]);
collection.all();  // → [1, 2, 10, 11, 4, 5]
```

For Extract without mutation, see the [slice](/collections/finding#slice) method. For Take from start or end, see the [take](/collections/filtering#take) method.

---

### dot()

The `dot` method flattens a multi-dimensional collection into a single level collection
that uses "dot" notation to indicate depth. This is useful for working with nested
configuration or form data.

```typescript
collect({
    user: { name: 'John', address: { city: 'NYC' } }
}).dot()
// → { 'user.name': 'John', 'user.address.city': 'NYC' }
```

Flatten configuration

```typescript
collect({
    database: { host: 'localhost', port: 3306 },
    cache: { driver: 'redis' }
}).dot()
// → { 'database.host': 'localhost', 'database.port': 3306, 'cache.driver': 'redis' }
```

For Expand dot notation back to nested structure, see the [undot](#undot) method. For Flatten nested arrays, see the [flatten](#flatten) method.

---

### undot()

The `undot` method expands a single-level collection that uses "dot" notation into a
multi-dimensional collection. This is the inverse of the `dot` method.

```typescript
collect({
    'user.name': 'John',
    'user.address.city': 'NYC'
}).undot()
// → { user: { name: 'John', address: { city: 'NYC' } } }
```

Expand form data

```typescript
collect({
    'items.0.name': 'Widget',
    'items.0.price': 100,
    'items.1.name': 'Gadget',
    'items.1.price': 200
}).undot()
// → { items: { 0: { name: 'Widget', price: 100 }, 1: { name: 'Gadget', price: 200 } } }
```

For Flatten to dot notation, see the [dot](#dot) method.

---

### each()

The `each` method iterates over the items in the collection and passes each item to a closure.

If you would like to stop iterating through the items, you may return false from your closure.

```typescript
collect([1, 2, 3])
    .each(n => console.log(n))
// logs: 1, 2, 3
```

Stop early

```typescript
collect([1, 2, 3])
    .each(n => {
  if (n === 2) return false
  console
      .log(n)
})
// logs: 1
```

For Execute callback on entire collection, see the [tap](#tap) method. For Transform items instead of side effects, see the [map](#map) method. For Spread array items as arguments, see the [eachSpread](#eachspread) method.

---

### eachSpread()

The `eachSpread` method iterates over the collection's items, passing each nested item value
into the given callback as separate arguments. This is useful when working with nested arrays
where each sub-array should be destructured into callback parameters.

```typescript
collect([['John', 35], ['Jane', 28]])
    .eachSpread((name, age) => {
        console.log(`${name} is ${age} years old`);
    });
// Logs: "John is 35 years old"
// Logs: "Jane is 28 years old"
```

With key as final argument

```typescript
collect([['a', 'b'], ['c', 'd']])
    .eachSpread((first, second, key) => {
        console.log(`${key}: ${first}, ${second}`);
    });
```

For Transform with spread arguments, see the [mapSpread](#mapspread) method. For Iterate without spreading, see the [each](#each) method.

---

### collect()

The `collect` method returns a new Collection instance with the current items. This is useful
when you want to break the chain and get a fresh collection, or convert a subclass back to a
base Collection.

```typescript
const original = collect([1, 2, 3]);
const copy = original.collect();
// original and copy are separate instances
```

For Convert subclass to base Collection, see the [toBase](#tobase) method.

---

### toBase()

The `toBase` method returns a base Collection instance from the current collection. This is
useful when working with collection subclasses and you need to ensure you have a standard
Collection instance.

```typescript
class CustomCollection extends Collection {}
const custom = new CustomCollection([1, 2, 3]);
const base = custom.toBase();
// base instanceof Collection === true
```

For Create a new collection copy, see the [collect](#collect) method.

---

### pipe()

The `pipe` method passes the collection to the given closure and returns the result of the
executed closure. This is useful for wrapping the collection in custom logic or breaking
out of the method chain when needed.

```typescript
collect([1, 2, 3])
    .pipe(c => c.sum() * 2)
// → 12
```

Conditional logic

```typescript
collect([
  { name: 'Taylor' },
  { name: 'Abigail' },
  { name: 'James' },
])
  .pipe(c => c.isEmpty() ? 'No users' : `${c.count()} users`)
// → '3 users'
```

For Execute callback but return collection unchanged, see the [tap](#tap) method. For passing collection to a class constructor, see the [pipeInto](#pipeinto) method. For passing through multiple callbacks, see the [pipeThrough](#pipethrough) method.

---

### pipeInto()

The `pipeInto` method creates a new instance of the given class and passes the collection
into the constructor. This is useful for wrapping the collection in domain-specific
objects or adapters.

```typescript
class Report {
    constructor(private data: Collection<number>) {}
    summary() { return { total: this.data.sum(), avg: this.data.avg() }; }
}
collect([10, 20, 30])
    .pipeInto(Report)
    .summary()
// → { total: 60, avg: 20 }
```

For passing collection to a callback, see the [pipe](#pipe) method. For Create instances from each item, see the [mapInto](#mapinto) method.

---

### pipeThrough()

The `pipeThrough` method passes the collection through a series of callbacks and returns
the final result. Each callback receives the result of the previous callback, creating
a pipeline of transformations.

```typescript
collect([1, 2, 3])
    .pipeThrough([
        c => c.sum(),      // 6
        n => n * 2,        // 12
        n => `Total: ${n}` // 'Total: 12'
    ])
// → 'Total: 12'
```

Composable transformations

```typescript
const addTax = (c) => c.map(p => p * 1.1);
const round = (c) => c.map(p => Math.round(p));
collect([100, 200])
    .pipeThrough([addTax, round])
    .all()
// → [110, 220]
```

For passing through a single callback, see the [pipe](#pipe) method.

---

### tap()

Pass the collection to the given callback and return it unchanged.

Useful for debugging or side effects mid-chain.

Debug mid-chain

```typescript
collect([1, 2, 3])
  .map(n => n * 2)
  .tap(c => console.log(c.all()))
  .filter(n => n > 2)
```

For Execute callback for each item, see the [each](#each) method. For Transform and return callback result, see the [pipe](#pipe) method. For Log collection contents, see the [dump](#dump) method.

---

### dump()

The `dump` method outputs the collection's items to the console and returns the collection,
allowing you to inspect the contents at any point in a method chain without interrupting
the flow.

Debug mid-chain

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
    .dump()              // Logs: [2, 4, 6]
    .filter(n => n > 3)
    .all()
// → [4, 6]
```

With label

```typescript
collection.dump('after filter')
// Logs: [items...] 'after filter'
```

For Dump and halt execution, see the [dd](#dd) method. For Execute any callback mid-chain, see the [tap](#tap) method.

---

### dd()

The `dd` method outputs the collection's items to the console and then throws an error
to halt script execution. This is useful for debugging when you want to inspect the
collection and stop processing. The name comes from "dump and die."

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
    .dd()  // Logs: [2, 4, 6], then throws
    .filter(n => n > 3)  // Never reached
```

For Dump without halting, see the [dump](#dump) method.

---

### when()

The `when` method will execute the given callback when the first argument given to the
method evaluates to true. The collection instance and the resolved value are passed to
the closure. An optional second callback is executed when the condition is falsy.

Basic condition

```typescript
collect([1, 2, 3])
    .when(shouldDouble, c => c.map(n => n * 2))
    .all()
```

With default callback

```typescript
const filterActive = true
collect([
  { name: 'Desk', active: true },
  { name: 'Chair', active: false },
])
  .when(
    filterActive,
    c => c.where('active', true),
    c => c
  )
// → [{ name: 'Desk', active: true }]
```

Callback condition

```typescript
collect([1, 2, 3])
    .when(c => c.count() > 2, c => c.take(2))
```

For Execute when condition is falsy, see the [unless](#unless) method. For Execute when collection is empty, see the [whenEmpty](#whenempty) method. For Execute when collection has items, see the [whenNotEmpty](#whennotempty) method.

---

### unless()

The `unless` method will execute the given callback when the first argument given to the
method evaluates to false. This is the inverse of the `when` method. An optional second
callback is executed when the condition is truthy.

Skip filtering for admins

```typescript
const isAdmin = false
collect([
  { title: 'Public Post', public: true },
  { title: 'Draft', public: false },
])
  .unless(isAdmin, c => c.where('public', true))
// → [{ title: 'Public Post', public: true }]
```

With default callback

```typescript
const showAll = true
collect([
  { title: 'Published', published: true },
  { title: 'Draft', published: false },
])
  .unless(
    showAll,
    c => c.where('published', true),
    c => c
  )
// → both posts (showAll is true)
```

For Execute when condition is truthy, see the [when](#when) method. For Execute when collection is empty, see the [whenEmpty](#whenempty) method.

---

### whenEmpty()

The `whenEmpty` method will execute the given callback when the collection is empty.
An optional second callback is executed when the collection is not empty.

Provide defaults for empty collection

```typescript
collect([])
    .whenEmpty(c => collect(['default']))
    .all()
// → ['default']
```

Log empty state

```typescript
collect([])
  .whenEmpty(() => console.log('No results found'))
// logs: 'No results found'
```

For Execute when collection has items, see the [whenNotEmpty](#whennotempty) method. For Execute on arbitrary condition, see the [when](#when) method. For Check if collection is empty, see the [isEmpty](/collections/checking#isempty) method.

---

### whenNotEmpty()

The `whenNotEmpty` method will execute the given callback when the collection is not empty.
An optional second callback is executed when the collection is empty.

Process only if items exist

```typescript
collect([
  { id: 1, total: 100 },
  { id: 2, total: 200 },
])
  .whenNotEmpty(c => c.pluck('total'))
// → [100, 200]
```

With empty fallback

```typescript
collect([{ name: 'Taylor' }])
  .whenNotEmpty(
    c => c.first(),
    () => 'No results'
  )
// → { name: 'Taylor' }
```

For Execute when collection is empty, see the [whenEmpty](#whenempty) method. For Execute on arbitrary condition, see the [when](#when) method. For Check if collection has items, see the [isNotEmpty](/collections/checking#isnotempty) method.

---

### unlessEmpty()

Alias for whenNotEmpty.

---

### unlessNotEmpty()

Alias for whenEmpty.

---

### offsetSet()

Set the value at a given offset.

---

### offsetUnset()

Remove the value at a given offset.

---

### lazy()

The `lazy` method returns a new LazyCollection instance from the underlying items.

This is particularly useful when you need to perform transformations on a large collection
and want to defer processing until the items are actually needed.

---
