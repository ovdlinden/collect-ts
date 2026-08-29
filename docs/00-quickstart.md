# Quick Start

## Installation

::: code-group

```bash [bun]
bun add collect-ts
```

```bash [pnpm]
pnpm add collect-ts
```

```bash [npm]
npm install collect-ts
```

```bash [yarn]
yarn add collect-ts
```

```bash [jsr]
npx jsr add @ovdlinden/collect-ts
```

:::

## Basic Usage

```typescript
import { collect } from 'collect-ts'

collect([1, 2, 3, 4, 5])
  .filter(n => n > 2)
  .map(n => n * 2)
  .sum()
// → 24
```

## Common Operations

| Task | Method |
|------|--------|
| Filter items | [`where()`](/collections/filtering#where), [`filter()`](/collections/filtering#filter) |
| Extract values | [`pluck()`](/collections/transforming#pluck) |
| Group data | [`groupBy()`](/collections/grouping#groupby) |
| Get first match | [`first()`](/collections/finding#first), [`firstWhere()`](/collections/finding#firstwhere) |
| Aggregate | [`sum()`](/collections/aggregating#sum), [`avg()`](/collections/aggregating#avg) |

## LazyCollection for Large Datasets

Process millions of items without loading everything into memory:

```typescript
collect(hugeDataset)
    .lazy()
    .filter(item => item.active)
    .take(100)
    .all()
// → [first 100 active items]
```

## What's next

- [TypeScript Guide](/01-typescript): How type inference catches bugs before runtime
- [Common Patterns](/02-patterns): Sorting, grouping, deduplication
- [Full API Reference](/api/): All 155+ methods
