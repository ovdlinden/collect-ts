# LazyCollection

You're processing a 2GB log file. With a regular Collection, it loads everything into memory and your app crashes.

LazyCollection uses JavaScript generators to process items one at a time. Only what you need, when you need it.

```typescript
import { lazy } from 'collect-ts'

const errors = lazy(readLines('huge-log.jsonl'))
    .filter(entry => entry.level === 'error')
    .take(100)
    .all()
```

This processes a huge file without loading it all into memory.

::: info Related Guides
- **Need type safety?** See [TypeScript](/01-typescript) for compile-time validation.
- **More collection patterns?** See [Common Patterns](/02-patterns) for sorting, grouping, and more.
:::

## When to Use It

| Scenario | Use |
|----------|-----|
| Processing large files | `lazy()` |
| Streaming API responses | `lazy()` |
| Taking first N from huge dataset | `lazy()` (stops early) |
| Small arrays (under 1000 items) | `collect()` (simpler) |
| Need to iterate multiple times | `collect()` (caches results) |


## How It Works

Both return `6`. The difference is how much work they do:

| | Eager | Lazy |
|---|---|---|
| **filter()** | 5 calls (all items) | 3 calls (stops at match) |
| **map()** | 3 calls (all passing) | 1 call (just the result) |
| **Total** | 8 operations | 4 operations |

Eager processes all items through each step before moving on. Lazy processes one item all the way through, returns immediately when it has an answer, and never touches items 4 and 5.

```typescript
collect([1, 2, 3, 4, 5]).filter(n => n > 2).map(n => n * 2).first()

lazy([1, 2, 3, 4, 5]).filter(n => n > 2).map(n => n * 2).first()
```

On a dataset of millions, this is the difference between "works" and "crashes".


## Processing Large Files

Stream a file line by line:

```typescript
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

async function* readLines(path: string) {
    const rl = createInterface({
        input: createReadStream(path),
        crlfDelay: Infinity
    })

    for await (const line of rl) {
        yield JSON.parse(line)
    }
}

const errors = lazy(readLines('huge-log.jsonl'))
    .filter(entry => entry.level === 'error')
    .take(100)
    .all()
```

This finds the first 100 errors in a 10GB log file. Memory stays flat regardless of file size.


## Paginated APIs

Fetch pages on demand:

```typescript
async function* fetchAllPages(endpoint: string) {
    let page = 1
    let hasMore = true

    while (hasMore) {
        const response = await fetch(`${endpoint}?page=${page}`)
        const data = await response.json()

        for (const item of data.items) {
            yield item
        }

        hasMore = data.hasNextPage
        page++
    }
}

const activeUsers = lazy(fetchAllPages('/api/users'))
    .filter(u => u.active)
    .take(50)
    .all()
```

Stops after finding 50 active users. If you find 50 on page 2, pages 3+ are never fetched.


## Infinite Sequences

Generate values forever. Take only what you need:

```typescript
function* fibonacci() {
    let [a, b] = [0, 1]
    while (true) {
        yield a
        ;[a, b] = [b, a + b]
    }
}

lazy(fibonacci()).take(10).all()

lazy(fibonacci()).first(n => n > 1000)
```

The first returns `[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`. The second returns `1597`.


::: details When NOT to Use It

LazyCollection re-evaluates on each iteration. This causes problems when:

**You need to sort:**

```typescript
lazy(hugeArray).sortBy('name').take(10)
```

Sorting requires loading all items first, defeating lazy evaluation.

**You iterate multiple times:**

```typescript
const users = lazy(fetchAllPages('/api/users'))
users.count()
users.first()
```

This re-fetches from the API on each call. Use `remember()` to cache, or convert to a regular Collection:

```typescript
const users = lazy(fetchAllPages('/api/users')).remember()
users.count()
users.first()

const users = lazy(fetchAllPages('/api/users')).collect()
```

With `remember()`, results are cached after the first iteration. Converting to a Collection also works.

**Your generator has side effects:**

```typescript
function* withSideEffects() {
    console.log('Started!')
    yield 1
}
```

Side effects run on every iteration. The `console.log` executes every time you iterate.

:::

## Converting

**Collection → LazyCollection:**

```typescript
const eagerCollection = collect([1, 2, 3, 4, 5])
const lazyVersion = eagerCollection.lazy()
```

**LazyCollection → Collection:**

```typescript
const lazyCollection = lazy([1, 2, 3, 4, 5])
const eagerVersion = lazyCollection.collect()
```


::: details Performance Tips

**Place `take()` early:**

```typescript
lazy(hugeArray)
    .filter(x => x.valid)
    .take(10) // [!code ++]
    .map(x => transform(x))

lazy(hugeArray)
    .filter(x => x.valid)
    .map(x => expensiveTransform(x)) // [!code --]
    .take(10) // [!code --]
```

The first stops after finding 10 valid items. The second transforms everything before taking 10.

**Use `first()` directly:**

```typescript
lazy(items).filter(x => x.id === target).first() // [!code ++]

lazy(items).filter(x => x.id === target).take(1).all()[0] // [!code --]
```

The first is direct. The second is verbose and does the same thing.

**Avoid operations that need all items:**

```typescript
lazy(items).sortBy('name') // [!code --]
lazy(items).reverse() // [!code --]
lazy(items).last() // [!code --]
lazy(items).count() // [!code --]
```

These defeat lazy evaluation. `sortBy` and `reverse` must load all items. `last` and `count` must iterate all.

:::

## Available Methods

Most Collection methods work on LazyCollection. Terminal operations like all, first, count, and sum trigger evaluation. Until you call one, nothing runs.

## What's next

- [Performance](/05-benchmarks) — When lazy beats eager (and when it doesn't)
- [Full API Reference](/collections) — All methods that work with LazyCollection
