# Laravel Collection for TypeScript

A fully-typed TypeScript port of [Laravel's Collection](https://laravel.com/docs/collections) class, designed to stay in sync with the official Laravel framework.

## Installation

```bash
# JSR (Deno, Bun, Node 18+)
npx jsr add @ovdlinden/collect-ts

# npm
npm install laravel-collection-ts

# pnpm
pnpm add laravel-collection-ts

# yarn
yarn add laravel-collection-ts
```

## Usage

```typescript
import { collect } from 'laravel-collection-ts';

// Create a collection
const collection = collect([1, 2, 3, 4, 5]);

// Chain methods fluently
const result = collection
  .filter(n => n > 2)
  .map(n => n * 2)
  .sum();
// => 24
```

## Features

- **Full Laravel Parity**: 130+ methods matching Laravel's Collection API
- **Fully Typed**: Complete TypeScript generics for type safety
- **Zero Dependencies**: Lightweight and self-contained
- **Laravel 12.x Compatible**: Synced with Laravel 12.x Collection API

## API Reference

### Creating Collections

```typescript
import { collect, Collection } from 'laravel-collection-ts';

// From array
collect([1, 2, 3])

// From object
collect({ a: 1, b: 2, c: 3 })

// Empty collection
collect()

// Using constructor
new Collection([1, 2, 3])
```

### Transformation Methods

```typescript
// Map values
collect([1, 2, 3]).map(n => n * 2)  // [2, 4, 6]

// Filter values
collect([1, 2, 3, 4]).filter(n => n > 2)  // [3, 4]

// Pluck values from objects
collect([{ name: 'John' }, { name: 'Jane' }]).pluck('name')  // ['John', 'Jane']

// Flatten nested arrays
collect([[1, 2], [3, 4]]).flatten()  // [1, 2, 3, 4]

// Collapse arrays
collect([[1, 2], [3, 4]]).collapse()  // [1, 2, 3, 4]

// Map with new keys
collect([{ id: 1, name: 'John' }])
  .mapWithKeys(item => [item.id, item.name])  // { 1: 'John' }
```

### Aggregation Methods

```typescript
// Sum
collect([1, 2, 3]).sum()  // 6
collect([{ price: 10 }, { price: 20 }]).sum('price')  // 30

// Average
collect([1, 2, 3]).avg()  // 2

// Min/Max
collect([1, 2, 3]).min()  // 1
collect([1, 2, 3]).max()  // 3

// Count
collect([1, 2, 3]).count()  // 3

// Median
collect([1, 2, 3]).median()  // 2

// Mode
collect([1, 1, 2, 2, 2]).mode()  // [2]
```

### Filtering Methods

```typescript
// Where clauses
collect(users).where('active', true)
collect(users).where('age', '>', 18)
collect(users).whereIn('role', ['admin', 'editor'])
collect(users).whereBetween('age', [18, 65])
collect(users).whereNull('deletedAt')
collect(users).whereNotNull('email')

// First/Last
collect([1, 2, 3]).first()  // 1
collect([1, 2, 3]).first(n => n > 1)  // 2
collect([1, 2, 3]).last()  // 3

// Contains
collect([1, 2, 3]).contains(2)  // true
collect(users).contains('name', 'John')  // true

// Unique
collect([1, 1, 2, 2, 3]).unique()  // [1, 2, 3]
```

### Sorting Methods

```typescript
// Sort
collect([3, 1, 2]).sort()  // [1, 2, 3]
collect([1, 2, 3]).sortDesc()  // [3, 2, 1]

// Sort by key
collect(users).sortBy('name')
collect(users).sortByDesc('age')

// Reverse
collect([1, 2, 3]).reverse()  // [3, 2, 1]

// Shuffle
collect([1, 2, 3]).shuffle()  // random order
```

### Grouping Methods

```typescript
// Group by key
collect(users).groupBy('department')

// Key by
collect(users).keyBy('id')

// Partition
const [active, inactive] = collect(users).partition(u => u.active)

// Chunk
collect([1, 2, 3, 4, 5]).chunk(2)  // [[1, 2], [3, 4], [5]]
```

### Reduction Methods

```typescript
// Reduce
collect([1, 2, 3]).reduce((sum, n) => sum + n, 0)  // 6

// Each (iteration)
collect([1, 2, 3]).each(n => console.log(n))

// Pipe
collect([1, 2, 3]).pipe(c => c.sum())  // 6

// Tap
collect([1, 2, 3]).tap(c => console.log(c.count()))
```

### Set Operations

```typescript
// Diff
collect([1, 2, 3]).diff([2, 3, 4])  // [1]

// Intersect
collect([1, 2, 3]).intersect([2, 3, 4])  // [2, 3]

// Union
collect({ a: 1 }).union({ b: 2 })  // { a: 1, b: 2 }

// Merge
collect([1, 2]).merge([3, 4])  // [1, 2, 3, 4]

// Combine
collect(['a', 'b']).combine([1, 2])  // { a: 1, b: 2 }

// Cross join
collect([1, 2]).crossJoin(['a', 'b'])  // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]

// Zip
collect([1, 2]).zip(['a', 'b'])  // [[1, 'a'], [2, 'b']]
```

### Conditional Methods

```typescript
// When
collect([1, 2, 3]).when(true, c => c.push(4))  // [1, 2, 3, 4]

// Unless
collect([1, 2, 3]).unless(false, c => c.push(4))  // [1, 2, 3, 4]

// WhenEmpty/WhenNotEmpty
collect([]).whenEmpty(c => c.push(1))  // [1]
collect([1]).whenNotEmpty(c => c.push(2))  // [1, 2]
```

### Exception Methods

```typescript
// Sole - throws if not exactly one item
collect([42]).sole()  // 42
collect([]).sole()  // throws ItemNotFoundException
collect([1, 2]).sole()  // throws MultipleItemsFoundException

// FirstOrFail - throws if empty
collect([1, 2]).firstOrFail()  // 1
collect([]).firstOrFail()  // throws ItemNotFoundException
```

## All Available Methods

| Method | Description |
|--------|-------------|
| `add()` | Add an item to the collection |
| `after()` | Get the item after the given item |
| `all()` | Get all items as array |
| `avg()` / `average()` | Get average value |
| `before()` | Get the item before the given item |
| `chunk()` | Chunk into smaller collections |
| `chunkWhile()` | Chunk while callback returns true |
| `collapse()` | Collapse nested arrays |
| `collect()` | Create a new collection |
| `combine()` | Combine keys with values |
| `concat()` | Concatenate items |
| `contains()` | Check if item exists |
| `containsOneItem()` | Check if exactly one item |
| `containsStrict()` | Check with strict comparison |
| `count()` | Count items |
| `countBy()` | Count by callback |
| `crossJoin()` | Cross join with arrays |
| `dd()` | Dump and die |
| `diff()` | Difference from other items |
| `diffAssoc()` | Difference by key and value |
| `diffKeys()` | Difference by keys |
| `doesntContain()` | Check if item doesn't exist |
| `dot()` | Flatten with dot notation keys |
| `dump()` | Dump items |
| `duplicates()` | Get duplicate items |
| `each()` | Iterate over items |
| `eachSpread()` | Iterate spreading arrays |
| `ensure()` | Ensure items are of type |
| `every()` | Check if all pass test |
| `except()` | Get all except keys |
| `filter()` | Filter by callback |
| `first()` | Get first item |
| `firstOrFail()` | Get first or throw |
| `firstWhere()` | Get first matching |
| `flatMap()` | Map and flatten |
| `flatten()` | Flatten nested arrays |
| `flip()` | Flip keys and values |
| `forPage()` | Paginate items |
| `forget()` | Remove by key |
| `get()` | Get by key |
| `getOrPut()` | Get or set default |
| `groupBy()` | Group by key |
| `has()` | Check if key exists |
| `hasAny()` | Check if any key exists |
| `implode()` | Join with separator |
| `intersect()` | Intersection with items |
| `intersectByKeys()` | Intersection by keys |
| `isEmpty()` | Check if empty |
| `isNotEmpty()` | Check if not empty |
| `join()` | Join with separator |
| `keyBy()` | Key by callback |
| `keys()` | Get all keys |
| `last()` | Get last item |
| `map()` | Transform items |
| `mapInto()` | Map into class instances |
| `mapSpread()` | Map spreading arrays |
| `mapToDictionary()` | Map to dictionary |
| `mapToGroups()` | Map to groups |
| `mapWithKeys()` | Map with new keys |
| `max()` | Get maximum value |
| `median()` | Get median value |
| `merge()` | Merge with items |
| `mergeRecursive()` | Merge recursively |
| `min()` | Get minimum value |
| `mode()` | Get mode value |
| `multiply()` | Multiply items |
| `nth()` | Get every nth item |
| `only()` | Get only specified keys |
| `pad()` | Pad to size |
| `partition()` | Partition by callback |
| `percentage()` | Calculate percentage |
| `pipe()` | Pass to callback |
| `pipeInto()` | Pass to class |
| `pipeThrough()` | Pass through callbacks |
| `pluck()` | Pluck values by key |
| `pop()` | Pop last item |
| `prepend()` | Prepend item |
| `pull()` | Pull and remove item |
| `push()` | Push item |
| `put()` | Put by key |
| `random()` | Get random items |
| `reduce()` | Reduce to single value |
| `reduceSpread()` | Reduce with spread |
| `reject()` | Reject matching items |
| `replace()` | Replace items |
| `replaceRecursive()` | Replace recursively |
| `reverse()` | Reverse order |
| `search()` | Search for item |
| `select()` | Select keys from items |
| `shift()` | Shift first item |
| `shuffle()` | Shuffle items |
| `skip()` | Skip first n items |
| `skipUntil()` | Skip until callback |
| `skipWhile()` | Skip while callback |
| `slice()` | Slice items |
| `sliding()` | Create sliding windows |
| `sole()` | Get only item or throw |
| `some()` | Check if any pass test |
| `sort()` | Sort items |
| `sortBy()` | Sort by key |
| `sortByDesc()` | Sort descending |
| `sortDesc()` | Sort descending |
| `sortKeys()` | Sort by keys |
| `sortKeysDesc()` | Sort keys descending |
| `sortKeysUsing()` | Sort keys with callback |
| `splice()` | Splice items |
| `split()` | Split into groups |
| `splitIn()` | Split into n groups |
| `sum()` | Sum values |
| `take()` | Take first/last n items |
| `takeUntil()` | Take until callback |
| `takeWhile()` | Take while callback |
| `tap()` | Tap into collection |
| `toArray()` | Convert to array |
| `toBase()` | Convert to base collection |
| `toJson()` | Convert to JSON |
| `toString()` | Convert to string |
| `transform()` | Transform in place |
| `undot()` | Expand dot notation |
| `union()` | Union with items |
| `unique()` | Get unique items |
| `uniqueStrict()` | Unique with strict comparison |
| `unless()` | Execute unless true |
| `unlessEmpty()` | Execute unless empty |
| `unlessNotEmpty()` | Execute unless not empty |
| `unshift()` | Unshift items |
| `value()` | Get single value |
| `values()` | Get values |
| `when()` | Execute when true |
| `whenEmpty()` | Execute when empty |
| `whenNotEmpty()` | Execute when not empty |
| `where()` | Filter by key/value |
| `whereBetween()` | Filter by range |
| `whereIn()` | Filter by values |
| `whereInstanceOf()` | Filter by type |
| `whereNotBetween()` | Filter not in range |
| `whereNotIn()` | Filter not in values |
| `whereNotNull()` | Filter not null |
| `whereNull()` | Filter null |
| `whereStrict()` | Filter strict |
| `zip()` | Zip with arrays |

## Versioning

This package uses semantic versioning independently from Laravel, with Laravel compatibility tracked via metadata.

| Package Version | Laravel Collection |
|-----------------|-------------------|
| 1.x             | 12.x              |

The `laravelCollectionVersion` field in `package.json` indicates the exact Laravel Collection version this package implements.

## License

MIT

## Credits

- [Laravel](https://laravel.com) - Original Collection implementation
- [Taylor Otwell](https://github.com/taylorotwell) - Creator of Laravel
