# Lazy Evaluation

Regular collections allocate at every step. Filter a million items, take 10, and you still allocate a million-item array.

Lazy collections don't. Each item flows through the full pipeline before the next enters. When you have 10, iteration stops.

```typescript
collect(hugeArray)
    .lazy()
    .filter(item => item.active)
    .take(10)
    .all()
// → [first 10 active items]
```

After 10 items pass the filter, the rest of `hugeArray` is never touched.

## When to use it

Use `.lazy()` when the source is large, when you'll stop early (`.take()`, `.first()`), or when the source is external. For small arrays, skip it. Generator overhead costs more than it saves.

## Execution

Nothing runs until you ask for results:

| Method | Pulls |
|--------|-------|
| `.all()` | Everything |
| `.first()` | One item |
| `.take(n)` | Up to n |
| `.count()`, `.sum()` | Everything |
| `for...of` | One per iteration |

## Generators

For sources you can't load into memory, use a generator. The `function*` syntax marks it. Each `yield` produces one value:

```typescript
function* range(start: number, end: number) {
    for (let i = start; i <= end; i++) {
        yield i
    }
}

collect(range(1, 1_000_000))
    .lazy()
    .filter(n => n % 2 === 0)
    .take(10)
    .all()
// → [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
```

The first 10 even numbers, without ever allocating a million-element array.

### Async sources

For APIs or anything async, use `async function*` with `collect.async()`:

```typescript
async function* fetchUsers() {
    let page = 1
    while (true) {
        const data = await fetch(`/api/users?page=${page}`).then(r => r.json())
        if (!data.length) return
        for (const user of data) yield user
        page++
    }
}

await collect.async(fetchUsers())
    .filter(u => u.active)
    .take(50)
    .all()
// → [first 50 active users]
```

Pages fetch on demand. If 50 active users appear by page 3, page 4 is never requested.

## Caching

Each terminal call re-iterates the source. Two calls, two fetches.

`.remember()` caches items as they stream through. The first call fills the cache, subsequent calls read from it:

```typescript
const results = collect(fetchUsers()).lazy() // [!code --]
const results = collect(fetchUsers()).lazy().remember() // [!code ++]
results.count()
results.first()
```

## Gotchas

**Generators are single-use.** Once exhausted, they're empty. Iterate twice and the second pass yields nothing.

**Side effects repeat.** A generator that logs will log on every iteration.

## What's next

- [Benchmarks](/05-benchmarks)
- [API Reference](/api/)
