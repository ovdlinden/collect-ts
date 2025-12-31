# LazyCollection

You're processing a 2GB log file. With a regular Collection, it loads everything into memory—and your app crashes.

LazyCollection uses JavaScript generators to process items one at a time. Only what you need, when you need it.

```typescript
import { lazy } from 'collect-ts'

// Process a huge file without loading it all
const errors = lazy(readLines('huge-log.jsonl'))
    .filter(entry => entry.level === 'error')
    .take(100)
    .all()
```

::: info Related Guides
- **Need type safety?** See [TypeScript](/guide/typescript) for compile-time validation.
- **More collection patterns?** See [Common Patterns](/guide/patterns) for sorting, grouping, and more.
:::

## When to Use It

| Scenario | Use |
|----------|-----|
| Processing large files | `lazy()` |
| Streaming API responses | `lazy()` |
| Taking first N from huge dataset | `lazy()` — stops early |
| Small arrays (<1000 items) | `collect()` — simpler |
| Need to iterate multiple times | `collect()` — caches results |


## How It Works

**Regular Collection** — processes everything immediately:

```typescript
collect([1, 2, 3, 4, 5])
    .filter(n => { console.log('filter', n); return n > 2 })
    .map(n => { console.log('map', n); return n * 2 })
    .first()

// Logs: filter 1, filter 2, filter 3, filter 4, filter 5
//       map 3, map 4, map 5
// Returns: 6
```

**LazyCollection** — processes only what's needed:

```typescript
lazy([1, 2, 3, 4, 5])
    .filter(n => { console.log('filter', n); return n > 2 })
    .map(n => { console.log('map', n); return n * 2 })
    .first()

// Logs: filter 1, filter 2, filter 3, map 3
// Returns: 6
```

The lazy version stops as soon as it finds the first match. Items 4 and 5 are never touched.


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

// Find first 100 errors in a 10GB log file
const errors = lazy(readLines('huge-log.jsonl'))
    .filter(entry => entry.level === 'error')
    .take(100)
    .all()
```

Memory stays flat regardless of file size.


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

// Stop after finding 50 active users
const activeUsers = lazy(fetchAllPages('/api/users'))
    .filter(u => u.active)
    .take(50)
    .all()
```

If you find 50 active users on page 2, pages 3+ are never fetched.


## Infinite Sequences

Generate values forever—take only what you need:

```typescript
function* fibonacci() {
    let [a, b] = [0, 1]
    while (true) {
        yield a
        ;[a, b] = [b, a + b]
    }
}

lazy(fibonacci()).take(10).all()
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

lazy(fibonacci()).first(n => n > 1000)
// 1597
```


## When NOT to Use It

LazyCollection re-evaluates on each iteration. This causes problems when:

**You need to sort:**

```typescript
// ❌ Sorting requires loading all items first
lazy(hugeArray).sortBy('name').take(10)
```

**You iterate multiple times:**

```typescript
// ❌ Re-fetches from API on each call
const users = lazy(fetchAllPages('/api/users'))
users.count()   // Fetches all pages
users.first()   // Fetches all pages again
```

Use `remember()` to cache, or convert to a regular Collection:

```typescript
// ✓ Cache results
const users = lazy(fetchAllPages('/api/users')).remember()
users.count()   // Fetches once
users.first()   // Uses cached results

// ✓ Or convert when you need to reuse
const users = lazy(fetchAllPages('/api/users')).collect()
```

**Your generator has side effects:**

```typescript
// ❌ Side effects run on every iteration
function* withSideEffects() {
    console.log('Started!')  // Logs every time you iterate
    yield 1
}
```


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


## Performance Tips

**Place `take()` early:**

```typescript
// ✓ Good — stops after finding 10
lazy(hugeArray)
    .filter(x => x.valid)
    .take(10)
    .map(x => transform(x))

// ✗ Bad — transforms everything, then takes 10
lazy(hugeArray)
    .filter(x => x.valid)
    .map(x => expensiveTransform(x))
    .take(10)
```

**Use `first()` directly:**

```typescript
// ✓ Good
lazy(items).filter(x => x.id === target).first()

// ✗ Verbose
lazy(items).filter(x => x.id === target).take(1).all()[0]
```

**Avoid operations that need all items:**

```typescript
// These defeat lazy evaluation
lazy(items).sortBy('name')   // Must load all to sort
lazy(items).reverse()        // Must load all to reverse
lazy(items).last()           // Must iterate all
lazy(items).count()          // Must iterate all
```


## Available Methods

Most Collection methods work on LazyCollection:

```typescript
lazy(items)
    .filter(x => x.valid)
    .map(x => transform(x))
    .flatMap(x => x.children)
    .unique()
    .take(100)
    .skip(10)
    .takeWhile(x => x.active)
    .skipUntil(x => x.ready)
    .chunk(50)
    .all()
```

Terminal operations trigger evaluation:

```typescript
lazy(items).all()      // Array
lazy(items).first()    // Single item or undefined
lazy(items).count()    // Number (iterates all)
lazy(items).sum()      // Number (iterates all)
lazy(items).each(fn)   // Void (side effects)
```
