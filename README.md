# collect-ts

**Laravel Collection for TypeScript — always in sync, TypeScript-first, modern.**

[![CI](https://github.com/ovdlinden/collect-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/ovdlinden/collect-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/collect-ts)](https://www.npmjs.com/package/collect-ts)
[![JSR](https://jsr.io/badges/@ovdlinden/collect-ts)](https://jsr.io/@ovdlinden/collect-ts)
[![codecov](https://codecov.io/gh/ovdlinden/collect-ts/graph/badge.svg)](https://codecov.io/gh/ovdlinden/collect-ts)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ovdlinden/collect-ts/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ovdlinden/collect-ts)

[![Laravel 13.x](https://img.shields.io/badge/Laravel-13.x-FF2D20)](https://laravel.com/docs/13.x/collections)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/badge/bundle-12kb%20brotli-blue)]()
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Fast**: Matches or beats native array methods. `sum()` runs 4.4x faster at 10K items. Never slower at any scale. [Benchmarks →](https://collect-ts.dev/performance)

## Why collect-ts?

| What you're doing | Native JavaScript | collect-ts |
|-------------------|-------------------|------------|
| Group by category | `items.reduce((acc, item) => {...}, {})` | `collect(items).groupBy('category')` |
| Unique emails | `[...new Set(users.map(u => u.email))]` | `collect(users).pluck('email').unique()` |
| Sum order totals | `orders.reduce((sum, o) => sum + o.total, 0)` | `collect(orders).sum('total')` |
| First active admin | `users.find(u => u.active && u.role === 'admin')` | `collect(users).where('active', true).firstWhere('role', 'admin')` |

### Who is this for?

- **Laravel developers using Inertia.js**: Same API on frontend and backend
- **TypeScript developers tired of reduce chains**: Readable, chainable, fully typed
- **Teams migrating from lodash**: 12kb vs 72kb, better tree-shaking

### How it compares

| | collect-ts | lodash | collect.js |
|-|------------|--------|------------|
| Size | 12kb brotli | 72kb | 45kb |
| TypeScript | First-class, with Path types | @types/lodash | Basic |
| API style | Fluent chaining | Utility functions | Fluent |
| Laravel sync | Tracks 13.x upstream | N/A | Stale (11.x) |

### What makes it different

- **Always in Sync**: Tracks Laravel 13.x. When Laravel updates, we update.
- **TypeScript-First**: Advanced generics, conditional types, full inference.
- **LazyCollection**: Generator-based lazy evaluation for large datasets.
- **Modern Stack**: ESM-only, Node 18+, zero dependencies.

## Installation

```bash
# npm
npm install collect-ts

# pnpm
pnpm add collect-ts

# yarn
yarn add collect-ts

# JSR (Deno, Bun, Node 18+)
npx jsr add @ovdlinden/collect-ts
```

## Quick Start

```typescript
import { collect } from 'collect-ts';

const result = collect([1, 2, 3, 4, 5])
  .filter(n => n > 2)
  .map(n => n * 2)
  .sum();
// => 24
```

## With Inertia.js

If you're building with Laravel and Inertia.js, you already know Collections. The same `where()`, `pluck()`, and `sortBy()` you use in your controllers work identically in your React components:

```tsx
import { usePage } from '@inertiajs/react'
import { collect } from 'collect-ts'
import { useState } from 'react'

export default function ProductList() {
    const { products } = usePage().props  // Data from controller
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('name')

    // Instant search + sorting — no server round-trip
    const displayed = collect(products)
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sortBy(sortBy)

    return (
        <div>
            <input
                placeholder="Search..."
                onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => setSortBy('name')}>Sort by Name</button>
            <button onClick={() => setSortBy('price')}>Sort by Price</button>
            <ul>
                {displayed.map(p => (
                    <li key={p.id}>{p.name} — ${p.price}</li>
                )).all()}
            </ul>
        </div>
    )
}
```

Same methods. Same arguments. Same behavior. No new paradigm to learn.

## Features

### Always in Sync with Laravel

We track the exact Laravel Collection version in `package.json`:

```json
{
  "laravelCollectionVersion": "12.43"
}
```

Sync scripts pull updates from Laravel's repository. Tests are ported from Laravel's test suite.

### TypeScript-First

Not JavaScript with types added later. Built from the ground up with:

- **Advanced generics** for full type inference
- **Conditional types** like `Collapse<T>` and `FlattenDepth<T, D>`
- **Higher-order messaging** with proper typing

```typescript
// Types flow through the chain
const names = collect(users).pluck('name') // Collection<string>

// Higher-order messaging
const emails = collect(users).map.email // Collection<string>

// Conditional types infer correctly
const flat = collect([[1, 2], [3, 4]]).collapse() // Collection<number>
```

### LazyCollection

Generator-based lazy evaluation for memory-efficient processing:

```typescript
import { lazy } from 'collect-ts';

// Process millions without loading into memory
const result = lazy(hugeDataset)
  .filter(item => item.active)
  .map(item => item.id)
  .take(100)
  .all();
```

### 130+ Methods

Full Laravel Collection API including:

```typescript
// Transformation
collect(items).map().filter().flatten().collapse().pluck()

// Aggregation
collect(items).sum().avg().min().max().median().mode()

// Filtering
collect(items).where('active', true).whereIn('role', ['admin']).whereBetween('age', [18, 65])

// Grouping
collect(items).groupBy('category').keyBy('id').partition(fn)

// And 100+ more...
```

### Modern Stack

- **ESM-only** — No CommonJS baggage
- **Node 18+** — Modern JavaScript features
- **Zero dependencies** — Nothing to audit
- **TypeScript 5** — Latest type system features

### Tree-Shaking

Minimize bundle size with automatic or manual tree-shaking:

```typescript
// Option 1: Automatic with plugin (recommended)
// vite.config.ts
import { vite as collectionPlugin } from 'collect-ts/plugin';
export default { plugins: [collectionPlugin()] };

// Then write normal code - only used methods are bundled
import { collect } from 'collect-ts';
collect(users).filter().map().groupBy(); // ~6KB instead of 56KB
```

```typescript
// Option 2: Standalone functions for smallest bundles
import { filter, map, groupBy } from 'collect-ts/fn';

const active = filter(users, u => u.active);     // ~200B
const names = map(active, u => u.name);          // ~200B
const byRole = groupBy(users, 'role');           // ~200B
```

[Tree-Shaking Guide →](https://collect-ts.dev/guide/tree-shaking)

## API Reference

<details>
<summary>View all 130+ methods</summary>

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
| `lazy()` | Convert to LazyCollection |
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

</details>

## Versioning

This package uses semantic versioning independently from Laravel, with Laravel compatibility tracked via metadata.

| Package Version | Laravel Collection |
|-----------------|-------------------|
| 0.x             | 12.x              |

The `laravelCollectionVersion` field in `package.json` indicates the exact Laravel Collection version this package implements.

## License

MIT

## Credits

- [Laravel](https://laravel.com) — Original Collection implementation
- [Taylor Otwell](https://github.com/taylorotwell) — Creator of Laravel
