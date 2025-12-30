---
layout: home

hero:
  name: Laravel Collection
  text: for TypeScript
  tagline: Always in sync with Laravel. TypeScript-first. Modern.
  actions:
    - theme: brand
      text: Get Started
      link: /collections
    - theme: alt
      text: View on GitHub
      link: https://github.com/ovdlinden/collect-ts

features:
  - icon: 🔄
    title: Always in Sync
    details: Synchronized with Laravel 12.x. When Laravel adds methods or fixes bugs, we update. Not a one-time port.
  - icon: 🎯
    title: TypeScript-First
    details: Built from the ground up in TypeScript with advanced generics, conditional types, and full type inference.
  - icon: ⚡
    title: LazyCollection
    details: Generator-based lazy evaluation for memory-efficient processing of large datasets.
  - icon: 🛠️
    title: Modern Stack
    details: ESM-only, Node 18+, zero dependencies. Built for 2025, not legacy compatibility.
---

## Why collect-ts?

**A living synchronization with Laravel Collections.**

- 🔄 **Version tracked** — `laravelCollectionVersion: 12.43` in package.json
- 🔧 **Sync infrastructure** — Scripts to pull updates from Laravel's repository
- ✅ **Test parity** — Tests ported from Laravel's own test suite

When Laravel adds new methods, we add them. When bugs are fixed upstream, we fix them.

## Installation

::: code-group

```bash [npm]
npm install collect-ts
```

```bash [pnpm]
pnpm add collect-ts
```

```bash [yarn]
yarn add collect-ts
```

```bash [jsr]
npx jsr add @ovdlinden/collect-ts
```

:::

## Quick Start

```typescript
import { collect } from 'collect-ts'

const result = collect([1, 2, 3, 4, 5])
  .filter(n => n > 2)
  .map(n => n * 2)
  .sum()
// => 24
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
// Only processes what's needed
```

## TypeScript-First

Not JavaScript with types bolted on. Real TypeScript with advanced patterns:

```typescript
// Type-safe property extraction
const names = collect(users).pluck('name') // Collection<string>

// Higher-order messaging with full typing
const emails = collect(users).map.email // Collection<string>

// Conditional types that infer correctly
const flat = collect([[1, 2], [3, 4]]).collapse() // Collection<number>
```

## Documentation

Full documentation synced from [Laravel's official docs](https://laravel.com/docs/collections), converted to TypeScript.

[Read the documentation →](/collections)
