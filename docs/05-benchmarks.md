---
outline: 2
---

# Performance

::: tip Run it yourself
```bash
pnpm vitest bench
```
Results vary by machine and Node version.
:::

## Which API to use

| Approach | When to use |
| --- | --- |
| `collect()` | General use |
| `LazyCollection` | Early termination, large datasets, memory efficiency |
| Native Array | One-off transforms where you'd write a callback anyway |
| Raw `for` loop | Hot paths where every microsecond matters |

## Benchmarks

Native array methods call your callback once per element. Each call has overhead: function invocation, closure capture, stack manipulation. collect-ts avoids this with `for` loops and direct property access.

<Benchmarks />

## Lazy Evaluation

LazyCollection processes items on-demand using generators. It wins when:

- You need only a subset (first N, first match)
- You're chaining multiple transforms (avoids intermediate arrays)
- You're working with generated sequences (ranges)

**Example**: Taking 10 items from a million-element range:

LazyCollection iterates only 10 elements:

```javascript
LazyCollection.range(1, 1_000_000).take(10).all()
```

Native allocates 1M elements, then slices:

```javascript
Array.from({ length: 1_000_000 }, (_, i) => i + 1).slice(0, 10)
```

The lazy version wins because it avoids allocating the full array, not because generators are intrinsically faster. A hand-written `for` loop that also exits early is ~138x faster than LazyCollection, but generators give you a composable API without manual loop management.

## Methodology

Benchmarks use [Vitest bench](https://vitest.dev/guide/features.html#benchmarking), which runs each operation thousands of times and reports median ops/s with variance.

Test environment: Node.js v22, Apple M-series, macOS.

```bash
pnpm vitest bench
pnpm vitest bench benchmarks/collect-vs-native.bench.ts
pnpm vitest bench benchmarks/lazy.bench.ts
```

Run all benchmarks, or target a specific file.

## What's next

- [Quick Start](/00-quickstart): Get started with collect-ts
- [LazyCollection](/03-lazy): When lazy evaluation wins
- [Full API Reference](/api/): All 130+ methods
