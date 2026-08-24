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

const result = collect([1, 2, 3, 4, 5])
  .filter(n => n > 2)
  .map(n => n * 2)
  .sum()
```

## LazyCollection for Large Datasets

Process millions of items without loading everything into memory:

```typescript
import { lazy } from 'collect-ts'

const result = lazy(hugeDataset)
  .filter(item => item.active)
  .map(item => item.id)
  .take(100)
  .all()
```

## What's next

- [TypeScript Guide](/01-typescript) — How type inference catches bugs before runtime
- [Common Patterns](/02-patterns) — Sorting, grouping, deduplication
- [Full API Reference](/collections) — All 130+ methods
