# Transforming

<!-- This file is auto-generated from JSDoc. Do not edit directly. -->
<!-- Run: bun run docs:guides -->

### range()

Creates a collection containing numbers within a specified range.

Works in both directions: ascending when `from < to`, descending otherwise.

In ascending order:

```typescript
Collection.range(1, 5)
// → Collection [1, 2, 3, 4, 5]
```

In descending order:

```typescript
Collection.range(5, 1)
// → Collection [5, 4, 3, 2, 1]
```

To generate by calling a function N times, use [`times`](#times).

---

### times()

Creates a new collection by invoking the given closure a specified number of times.

The callback receives 1-based indices (1, 2, 3...). Without a callback,
returns a collection of numbers 1 through N.

Pass a callback:

```typescript
Collection.times(3, i => i * 2)
// → Collection [2, 4, 6]
```

Without a callback, it returns numbers 1 through N:

```typescript
Collection.times(3)
// → Collection [1, 2, 3]
```

To generate a range between two numbers, use [`range`](#range).

---

### map()

Iterates over the collection and passes each value to the given callback.
The callback is free to modify the item and return it, thus forming a new collection of
modified items.

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
// → Collection [2, 4, 6]
```

To extract a property:

```typescript
collect([
  { name: 'Taylor' },
  { name: 'Abigail' },
])
  .map(u => u.name)
// → ['Taylor', 'Abigail']
```

To extract a single property by key, use [`pluck`](#pluck). To transform and change keys, use [`mapWithKeys`](#mapwithkeys).

---

### mapWithKeys()

Iterates through the collection and passes each value
to the given callback. The callback should return an associative array containing
a single key/value pair.

```typescript
collect([
    { name: 'John', department: 'Sales' },
    { name: 'Jane', department: 'Marketing' }
]).mapWithKeys(emp => [emp.name, emp.department])
  .all()
// → { John: 'Sales', Jane: 'Marketing' }
```

To transform values keeping original keys, use [`map`](#map). To key by a property without transforming values, use [`keyBy`](/collections/grouping#keyby).

---

### mapToDictionary()

Runs the given callback over each item and groups
the returned values by their keys.

```typescript
collect([
  { name: 'John', department: 'Sales' },
  { name: 'Jane', department: 'Sales' },
  { name: 'Bob', department: 'Marketing' },
])
  .mapToDictionary(emp => [emp.department, emp.name])
  .all()
// → { Sales: ['John', 'Jane'], Marketing: ['Bob'] }
```

To similar but returns nested Collections, use [`mapToGroups`](#maptogroups). To group by key without value transformation, use [`groupBy`](/collections/grouping#groupby).

---

### mapToGroups()

Groups the collection's items by the given callback.
The callback returns a [key, value] tuple that determines the grouping.

```typescript
collect([
  { name: 'John', department: 'Sales' },
  { name: 'Jane', department: 'Sales' },
  { name: 'Bob', department: 'Marketing' },
])
  .mapToGroups(emp => [emp.department, emp.name])
// → { Sales: Collection(['John', 'Jane']), Marketing: Collection(['Bob']) }
```

To similar but returns plain arrays, use [`mapToDictionary`](#maptodictionary). To group by key without value transformation, use [`groupBy`](/collections/grouping#groupby).

---

### mapInto()

Iterates over the collection and creates a new instance
of the given class for each item, passing the item value and key to the constructor.

```typescript
class Currency {
    constructor(public amount: number) {}
    format() { return `$${this.amount.toFixed(2)}`; }
}
collect([100, 250, 50])
    .mapInto(Currency)
    .map(c => c.format())
    .all()
// → ['$100.00', '$250.00', '$50.00']
```

To transform with arbitrary callback, use [`map`](#map). To pass entire collection to constructor, use [`pipeInto`](#pipeinto).

---

### mapSpread()

Iterates over the collection's items, passing each nested
item value into the given callback as separate arguments.

```typescript
collect([[1, 2], [3, 4], [5, 6]])
    .mapSpread((a, b) => a + b)
    .all()
// → [3, 7, 11]
```

Also access the key:

```typescript
collect([['Taylor', 'Laravel'], ['Caleb', 'Livewire']])
    .mapSpread((name, project, key) => `${key}: ${name} - ${project}`)
    .all()
// → ['0: Taylor - Laravel', '1: Caleb - Livewire']
```

To iterate without transforming, use [`eachSpread`](#eachspread). To map and flatten results, use [`flatMap`](#flatmap).

---

### flatMap()

Map each item then flatten the results by one level.

```typescript
collect([[1, 2], [3, 4]])
    .flatMap(arr => arr.map(n => n * 2))
// → Collection [2, 4, 6, 8]
```

To transform without flattening, use [`map`](#map). To flatten without mapping, use [`flatten`](#flatten).

---

### collapse()

Collapses a collection of arrays into a single, flat collection.
It merges the elements of nested arrays or Collections into one level.

```typescript
collect([[1, 2], [3, 4], [5]])
    .collapse()
// → [1, 2, 3, 4, 5]
```

Also use nested Collections:

```typescript
collect([collect([1, 2]), collect([3, 4])])
    .collapse()
// → [1, 2, 3, 4]
```

To recursively flatten to any depth, use [`flatten`](#flatten). To map then collapse, use [`flatMap`](#flatmap).

---

### collapseWithKeys()

Collapses a collection of arrays into a single, flat
collection while preserving the original keys.

```typescript
collect({
  a: { x: 1 },
  b: { y: 2 },
})
  .collapseWithKeys()
  .all()
// → { x: 1, y: 2 }
```

To collapse without preserving keys, use [`collapse`](#collapse). To flatten nested structures, use [`flatten`](#flatten).

---

### flatten()

Flattens a multi-dimensional collection into a single dimension.
Optionally, pass a depth argument to limit how many levels deep the flattening
should go.

To flatten all levels:

```typescript
collect([[1, [2, [3]]], [4]])
    .flatten()
// → [1, 2, 3, 4]
```

To flatten just one level:

```typescript
collect([[1, [2]], [3]])
    .flatten(1)
// → [1, [2], 3]
```

To flatten by exactly one level, use [`collapse`](#collapse). To flatten to dot notation keys, use [`dot`](#dot).

---

### flip()

Swaps the collection's keys with their corresponding values. Values
are converted to strings since object keys must be strings.

```typescript
collect({ name: 'taylor', framework: 'laravel' })
    .flip()
// → { taylor: 'name', laravel: 'framework' }
```

For an array, keys become values:

```typescript
collect(['a', 'b', 'c'])
    .flip()
// → { a: '0', b: '1', c: '2' }
```

To get just the keys, use [`keys`](/collections/finding#keys). To get just the values, use [`values`](/collections/finding#values).

---

### pad()

Fills the array with the given value until the array reaches
the specified size. This method behaves like PHP's `array_pad` function.

To pad to the left, specify a negative size. No padding occurs if the absolute
value of the given size is less than or equal to the length of the array.

Pad to the right:

```typescript
collect([1, 2, 3])
    .pad(5, 0)
    .all()
// → [1, 2, 3, 0, 0]
```

Pad to the left:

```typescript
collect([1, 2, 3])
    .pad(-5, 0)
    .all()
// → [0, 0, 1, 2, 3]
```

No padding needed:

```typescript
collect([1, 2, 3])
    .pad(2, 0)
    .all()
// → [1, 2, 3]
```

To take items from start or end, use [`take`](/collections/filtering#take). To insert items at position, use [`splice`](#splice).

---

### put()

Sets the given key and value in the collection.
This method modifies the collection in place.

```typescript
collect({ name: 'Taylor' })
    .put('age', 25)
    .all()
// → { name: 'Taylor', age: 25 }
```

Update existing key:

```typescript
collect({ name: 'Taylor', age: 25 })
    .put('age', 26)
    .all()
// → { name: 'Taylor', age: 26 }
```

To append to end of array, use [`push`](#push). To add to beginning, use [`prepend`](#prepend).

---

### push()

Appends an item to the end of the collection.
This method modifies the collection in place.

```typescript
collect([1, 2, 3])
    .push(4)
    .all()
// → [1, 2, 3, 4]
```

Multiple values:

```typescript
collect([1, 2])
    .push(3, 4, 5)
    .all()
// → [1, 2, 3, 4, 5]
```

To add to beginning, use [`prepend`](#prepend). To set by key, use [`put`](#put).

---

### prepend()

Adds an item to the beginning of the collection.
This method modifies the collection in place.

```typescript
collect([2, 3, 4])
    .prepend(1)
    .all()
// → [1, 2, 3, 4]
```

With key:

```typescript
collect({ b: 2, c: 3 })
    .prepend(1, 'a')
    .all()
// → { a: 1, b: 2, c: 3 }
```

To add to end, use [`push`](#push). To remove from beginning, use [`shift`](#shift).

---

### unshift()

Adds one or more items to the beginning of the collection.

```typescript
collect([3, 4, 5])
    .unshift(1, 2)
    .all()
// → [1, 2, 3, 4, 5]
```

To add single item to beginning, use [`prepend`](#prepend). To add to end, use [`push`](#push).

---

### pop()

Removes and returns the last item from the collection.
This method modifies the collection in place.

```typescript
const collection = collect([1, 2, 3, 4, 5])
collection.pop()
// → 5
collection.all()
// → [1, 2, 3, 4]
```

Pop multiple items:

```typescript
const collection = collect([1, 2, 3, 4, 5])
collection.pop(2)
// → [4, 5]
collection.all()
// → [1, 2, 3]
```

To add to end, use [`push`](#push). To remove from beginning, use [`shift`](#shift).

---

### shift()

Removes and returns the first item from the collection.
This method modifies the collection in place.

```typescript
const collection = collect([1, 2, 3, 4, 5])
collection.shift()
// → 1
collection.all()
// → [2, 3, 4, 5]
```

Shift multiple items:

```typescript
const collection = collect([1, 2, 3, 4, 5])
collection.shift(2)
// → [1, 2]
collection.all()
// → [3, 4, 5]
```

To add to beginning, use [`prepend`](#prepend). To remove from end, use [`pop`](#pop).

---

### add()

Appends an item to the end of the collection.
This is an alias for {@link push}.

```typescript
collect([1, 2, 3])
    .add(4)
    .all()
// → [1, 2, 3, 4]
```

To add to end, use [`push`](#push). To add to beginning, use [`prepend`](#prepend).

---

### forget()

Removes an item from the collection by its key.
This method modifies the collection in place. Unlike `except`, this method
modifies the collection directly.

Remove a single key:

```typescript
collect({ a: 1, b: 2, c: 3 })
    .forget('b')
    .all()
// → { a: 1, c: 3 }
```

Remove multiple keys:

```typescript
collect({ a: 1, b: 2, c: 3 })
    .forget(['a', 'c'])
    .all()
// → { b: 2 }
```

To return new collection without keys (immutable), use [`except`](/collections/filtering#except). To remove and return value, use [`pull`](/collections/finding#pull).

---

### select()

Selects the given keys from the collection, similar to
an SQL SELECT statement.

```typescript
collect([
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
])
  .select(['name', 'email'])
  .all()
// → [
//   { name: 'Alice', email: 'alice@example.com' },
//   { name: 'Bob', email: 'bob@example.com' },
// ]
```

To select keys from the collection itself, use [`only`](/collections/filtering#only). To extract single key values, use [`pluck`](#pluck).

---

### pluck()

Extract values at a given path from each item.

```typescript
collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
  .pluck('name')
// → ['Taylor', 'Abigail']
```

Also specify custom keys:

```typescript
collect([
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
])
  .pluck('name', 'id')
// → { 1: 'Taylor', 2: 'Abigail' }
```

To transform items with full callback control, use [`map`](#map). To get first item's value at path, use [`value`](/collections/finding#value).

---

### transform()

Iterates over the collection and calls the given callback
with each item in the collection. The items in the collection will be replaced
by the values returned by the callback. Unlike `map`, this method modifies the
collection in place.

```typescript
const collection = collect([1, 2, 3])
collection.transform(n => n * 2)
collection.all()
// → [2, 4, 6]
```

Chain after transform:

```typescript
collect({ price: 100, tax: 10 })
    .transform((v, k) => k === 'price' ? v * 1.1 : v)
    .sum()
// → 120
```

Transform object values:

```typescript
const collection = collect({ a: 1, b: 2 })
collection.transform(v => v * 10)
collection.all()
// → { a: 10, b: 20 }
```

To transform without mutation (returns new collection), use [`map`](#map). To iterate without transforming, use [`each`](#each).

---

### multiply()

Creates multiple copies of all items in the collection.

```typescript
collect([1, 2])
    .multiply(3)
    .all()
// → [1, 2, 1, 2, 1, 2]
```

To pad to a specific size, use [`pad`](#pad).

---

### splice()

Removes and returns a slice of items starting at the
specified index. Pass a second argument to limit the size of the
removed slice, and a third argument containing replacement items.
This method modifies the original collection.

Remove from an index:

```typescript
const collection = collect([1, 2, 3, 4, 5])
const chunk = collection.splice(2)
// chunk      → [3, 4, 5]
// collection → [1, 2]
```

Remove a specific length:

```typescript
const collection = collect([1, 2, 3, 4, 5])
const chunk = collection.splice(2, 1)
// chunk      → [3]
// collection → [1, 2, 4, 5]
```

Replace items:

```typescript
const collection = collect([1, 2, 3, 4, 5])
collection.splice(2, 1, [10, 11])
collection.all()
// → [1, 2, 10, 11, 4, 5]
```

To extract without mutation, use [`slice`](/collections/finding#slice). To take from start or end, use [`take`](/collections/filtering#take).

---

### dot()

Flattens a multi-dimensional collection into a single level
collection that uses "dot" notation to indicate depth. This is useful for
working with nested configuration or form data.

```typescript
collect({
    user: { name: 'John', address: { city: 'NYC' } }
}).dot().all()
// → { 'user.name': 'John', 'user.address.city': 'NYC' }
```

Flatten configuration:

```typescript
collect({
    database: { host: 'localhost', port: 3306 },
    cache: { driver: 'redis' }
}).dot().all()
// → {
//     'database.host': 'localhost',
//     'database.port': 3306,
//     'cache.driver': 'redis'
//   }
```

To expand dot notation back to nested structure, use [`undot`](#undot). To flatten nested arrays, use [`flatten`](#flatten).

---

### undot()

Expands a single-level collection that uses "dot" notation
into a multi-dimensional collection. This is the inverse of the `dot` method.

```typescript
collect({
    'user.name': 'John',
    'user.address.city': 'NYC'
}).undot().all()
// → { user: { name: 'John', address: { city: 'NYC' } } }
```

Expand form data:

```typescript
collect({
    'items.0.name': 'Widget',
    'items.0.price': 100,
    'items.1.name': 'Gadget',
    'items.1.price': 200
}).undot().all()
// → {
//     items: {
//       0: { name: 'Widget', price: 100 },
//       1: { name: 'Gadget', price: 200 }
//     }
//   }
```

To flatten to dot notation, use [`dot`](#dot).

---

### each()

Iterates over the items in the collection and passes each item to a closure.

If you would like to stop iterating through the items, you may return false from your closure.

```typescript
collect([1, 2, 3])
    .each(n => console.log(n))
// logs: 1, 2, 3
```

To stop early:

```typescript
collect([1, 2, 3])
    .each(n => {
  if (n === 2) return false
  console
      .log(n)
})
// logs: 1
```

To execute callback on entire collection, use [`tap`](#tap). To transform items instead of side effects, use [`map`](#map).

---

### eachSpread()

Iterates over the collection's items, passing each nested
item value into the given callback as separate arguments.

```typescript
collect([['John', 35], ['Jane', 28]])
    .eachSpread((name, age) => {
        console.log(`${name} is ${age} years old`);
    })
// Logs: "John is 35 years old"
// Logs: "Jane is 28 years old"
```

Also access the key:

```typescript
collect([['a', 'b'], ['c', 'd']])
    .eachSpread((first, second, key) => {
        console.log(`${key}: ${first}, ${second}`);
    })
```

Return false to stop iteration:

```typescript
collect([[1, 2], [3, 4], [5, 6]])
    .eachSpread((a, b) => {
        if (a > 3) return false;
        console.log(a + b);
    })
// Logs: 3, 7 (stops before [5, 6])
```

To transform with spread arguments, use [`mapSpread`](#mapspread). To iterate without spreading, use [`each`](#each).

---

### collect()

Returns a new Collection instance with the current items.
This is useful when you want to break the chain and get a fresh collection,
or convert a subclass back to a base Collection.

Create an independent copy:

```typescript
const original = collect([1, 2, 3])
const copy = original.collect()
// original and copy are separate instances
```

Break the chain:

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
    .collect()
    .filter(n => n > 2)
    .all()
// → [4, 6]
```

To convert subclass to base Collection, use [`toBase`](#tobase).

---

### toBase()

Returns a base Collection instance from the current collection.
This is useful when working with collection subclasses and you need to ensure
you have a standard Collection instance.

Convert subclass to base:

```typescript
class CustomCollection extends Collection {}
const custom = new CustomCollection([1, 2, 3])
const base = custom.toBase()
// base instanceof Collection === true
```

To create a new collection copy, use [`collect`](#collect).

---

### pipe()

Passes the collection to the given closure and returns the result
of the executed closure. This is useful for wrapping the collection in custom logic
or breaking out of the method chain when needed.

```typescript
collect([1, 2, 3])
    .pipe(c => c.sum() * 2)
// → 12
```

For conditional logic:

```typescript
collect([
  { name: 'Taylor' },
  { name: 'Abigail' },
  { name: 'James' },
])
  .pipe(c => c.isEmpty() ? 'No users' : `${c.count()} users`)
// → '3 users'
```

Chain with external function:

```typescript
const formatUsers = (c) => c.pluck('name').join(', ')
collect([{ name: 'Taylor' }, { name: 'Abigail' }])
    .pipe(formatUsers)
// → 'Taylor, Abigail'
```

To execute callback but return collection unchanged, use [`tap`](#tap). To pass collection to a class constructor, use [`pipeInto`](#pipeinto).

---

### pipeInto()

Creates a new instance of the given class and passes the
collection into the constructor. This is useful for wrapping the collection in
domain-specific objects or adapters.

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

To pass collection to a callback, use [`pipe`](#pipe). To create instances from each item, use [`mapInto`](#mapinto).

---

### pipeThrough()

Passes the collection through a series of callbacks and
returns the final result. Each callback receives the result of the previous callback,
creating a pipeline of transformations.

```typescript
collect([1, 2, 3])
    .pipeThrough([
        c => c.sum(),      // 6
        n => n * 2,        // 12
        n => `Total: ${n}` // 'Total: 12'
    ])
// → 'Total: 12'
```

For composable transformations:

```typescript
const addTax = (c) => c.map(p => p * 1.1)
const round = (c) => c.map(p => Math.round(p))
collect([100, 200])
    .pipeThrough([addTax, round])
    .all()
// → [110, 220]
```

To pass through a single callback, use [`pipe`](#pipe).

---

### tap()

Pass the collection to the given callback and return it unchanged.

Useful for debugging or side effects mid-chain.

To debug mid-chain:

```typescript
collect([1, 2, 3])
  .map(n => n * 2)
  .tap(c => console.log(c.all()))
  .filter(n => n > 2)
```

To execute callback for each item, use [`each`](#each). To transform and return callback result, use [`pipe`](#pipe).

---

### dump()

Outputs the collection's items to the console and returns the
collection, allowing you to inspect the contents at any point in a method chain
without interrupting the flow.

Debug mid-chain:

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
    .dump()              // Logs: [2, 4, 6]
    .filter(n => n > 3)
    .all()
// → [4, 6]
```

With a label:

```typescript
collect([1, 2, 3])
    .dump('before filter')
    .filter(n => n > 1)
    .dump('after filter')
    .all()
// Logs: [1, 2, 3] 'before filter'
// Logs: [2, 3] 'after filter'
```

To dump and halt execution, use [`dd`](#dd). To execute any callback mid-chain, use [`tap`](#tap).

---

### dd()

Outputs the collection's items to the console and then throws
an error to halt script execution. This is useful for debugging when you want
to inspect the collection and stop processing. The name comes from "dump and die."

```typescript
collect([1, 2, 3])
    .map(n => n * 2)
    .dd()  // Logs: [2, 4, 6], then throws
    .filter(n => n > 3)  // Never reached
```

With a label:

```typescript
collect(users)
    .filter(u => u.active)
    .dd('active users')  // Logs active users, then throws
```

To dump without halting, use [`dump`](#dump).

---

### when()

Executes the given callback when the first argument evaluates to true.
The collection instance and the resolved value are passed to the closure.
An optional second callback is executed when the condition is falsy.

```typescript
collect([1, 2, 3])
    .when(true, c => c.map(n => n * 2))
    .all()
// → [2, 4, 6]
```

Pass a callback as the condition:

```typescript
collect([1, 2, 3])
    .when(c => c.count() > 2, c => c.take(2))
    .all()
// → [1, 2]
```

Pass a default callback:

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
  .all()
// → [{ name: 'Desk', active: true }]
```

To execute when condition is falsy, use [`unless`](#unless). To execute when collection is empty, use [`whenEmpty`](#whenempty).

---

### unless()

Executes the given callback when the first argument evaluates to false.
This is the inverse of the `when` method. An optional second callback is executed when
the condition is truthy.

To skip filtering for admins:

```typescript
const isAdmin = false
collect([
  { title: 'Public Post', public: true },
  { title: 'Draft', public: false },
])
  .unless(isAdmin, c => c.where('public', true))
  .all()
// → [{ title: 'Public Post', public: true }]
```

Pass a default callback:

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
  .all()
// → both posts (showAll is true, so default runs)
```

To execute when condition is truthy, use [`when`](#when). To execute when collection is not empty, use [`unlessEmpty`](#unlessempty).

---

### whenEmpty()

Executes the given callback when the collection is empty.
An optional second callback is executed when the collection is not empty.

To provide defaults for an empty collection:

```typescript
collect([])
    .whenEmpty(c => c.push('default'))
    .all()
// → ['default']
```

To log empty state:

```typescript
collect([])
  .whenEmpty(() => console.log('No results found'))
// logs: 'No results found'
```

To execute when collection has items, use [`whenNotEmpty`](#whennotempty). To execute on arbitrary condition, use [`when`](#when).

---

### whenNotEmpty()

Executes the given callback when the collection is not empty.
An optional second callback is executed when the collection is empty.

To process only if items exist:

```typescript
collect([
  { id: 1, total: 100 },
  { id: 2, total: 200 },
])
  .whenNotEmpty(c => c.pluck('total'))
  .all()
// → [100, 200]
```

Pass an empty fallback:

```typescript
collect([{ name: 'Taylor' }])
  .whenNotEmpty(
    c => c.first(),
    () => 'No results'
  )
// → { name: 'Taylor' }
```

To execute when collection is empty, use [`whenEmpty`](#whenempty). To alias for whenNotEmpty, use [`unlessEmpty`](#unlessempty).

---

### unlessEmpty()

Executes the given callback when the collection is not empty.
This is an alias for {@link whenNotEmpty}.

```typescript
collect([1, 2, 3])
    .unlessEmpty(c => c.map(n => n * 2))
    .all()
// → [2, 4, 6]
```

With empty collection (callback not executed):

```typescript
collect([])
    .unlessEmpty(c => c.push('item'))
    .all()
// → []
```

To canonical method, use [`whenNotEmpty`](#whennotempty). To execute when collection IS empty, use [`unlessNotEmpty`](#unlessnotempty).

---

### unlessNotEmpty()

Executes the given callback when the collection is empty.
This is an alias for {@link whenEmpty}.

To provide a default value for empty results:

```typescript
collect([])
    .unlessNotEmpty(() => collect(['No data']))
    .all()
// → ['No data']
```

With non-empty collection (callback not executed):

```typescript
collect([1, 2, 3])
    .unlessNotEmpty(() => collect(['default']))
    .all()
// → [1, 2, 3]
```

To canonical method, use [`whenEmpty`](#whenempty). To execute when collection is NOT empty, use [`unlessEmpty`](#unlessempty).

---

### offsetSet()

Sets the value at a given offset.

Part of the ArrayAccess interface for bracket-style assignment. If the key is `null`,
the value is appended to the collection (like `push`). This method modifies the
collection in place.

Set a value by key:

```typescript
const collection = collect({ a: 1 })
collection.offsetSet('b', 2)
collection.all()
// → { a: 1, b: 2 }
```

Append with null key:

```typescript
const collection = collect([1, 2])
collection.offsetSet(null, 3)
collection.all()
// → [1, 2, 3]
```

Update existing value:

```typescript
const collection = collect({ name: 'John' })
collection.offsetSet('name', 'Jane')
collection.get('name')
// → 'Jane'
```

To primary method for setting values, use [`put`](#put). To append to collection, use [`push`](#push).

---

### offsetUnset()

Removes the value at a given offset.

Part of the ArrayAccess interface for bracket-style deletion. This method modifies
the collection in place. For arrays, this does not re-index the remaining items.

Remove by key:

```typescript
const collection = collect({ a: 1, b: 2, c: 3 })
collection.offsetUnset('b')
collection.all()
// → { a: 1, c: 3 }
```

Remove by index:

```typescript
const collection = collect(['x', 'y', 'z'])
collection.offsetUnset(1)
collection.all()
// → { '0': 'x', '2': 'z' }  // Note: does not re-index
```

To primary method for removing items, use [`forget`](#forget). To remove and return a value, use [`pull`](/collections/finding#pull).

---

### lazy()

Returns a new LazyCollection instance from the underlying items.

This is particularly useful when you need to perform transformations on a large collection
and want to defer processing until the items are actually needed. LazyCollection only
processes items as they're consumed, which can significantly reduce memory usage and
improve performance for large datasets.

Convert to lazy for deferred processing:

```typescript
collect([1, 2, 3, 4, 5])
    .lazy()
    .map(n => n * 2)
    .filter(n => n > 4)
    .take(2)
    .all()
// → [6, 8]
```

Memory-efficient processing of large data:

```typescript
const hugeArray = Array.from({ length: 1000000 }, (_, i) => i)
collect(hugeArray)
    .lazy()
    .filter(n => n % 1000 === 0)
    .map(n => n * 2)
    .take(10)
    .all()
// Only processes items until 10 matches found
```

Chaining with eager collection methods:

```typescript
collect(['a', 'b', 'c'])
    .lazy()
    .map(s => s.toUpperCase())
    .collect()  // Convert back to eager Collection
    .join(', ')
// → 'A, B, C'
```

To convert back to eager Collection, use [`collect`](#collect).

---

### mapWithKey()

Iterates through the collection with access to a related
collection, allowing transformation based on related data.

To simple transformation, use [`map`](#map). To transform and change keys, use [`mapWithKeys`](#mapwithkeys).

---
