---
layout: home

hero:
  name: Laravel Collection
  text: for TypeScript
  tagline: Fluent, typed, always in sync with Laravel.
  actions:
    - theme: brand
      text: Get Started
      link: /00-quickstart
    - theme: alt
      text: View on GitHub
      link: https://github.com/ovdlinden/collect-ts

features:
  - title: Always in Sync
    details: Synchronized with Laravel 13.x. When Laravel adds methods or fixes bugs, we update. Not a one-time port.
  - title: Laravel-Familiar API
    details: If you know Laravel Collections, you already know this. Same method names, same behavior, same mental model.
  - title: TypeScript-First
    details: Built from the ground up in TypeScript with advanced generics, conditional types, and full type inference.
  - title: LazyCollection
    details: Generator-based lazy evaluation for memory-efficient processing of large datasets.
---

> **Fast**: Matches or beats native array methods. `sum()` runs 4.4× faster at 10K items. [Benchmarks →](/05-benchmarks)

## Choose Your Path

<div class="vp-card-container">

<div class="vp-card">

### Coming from Laravel?

Same `collect()`, `where()`, `pluck()` you already know — now in your Inertia frontend.

[Laravel Developers →](/for/laravel-developers)

</div>

<div class="vp-card">

### New to Collections?

Why this beats `filter().map().reduce()` chains, and how to think in Collections.

[JavaScript Developers →](/for/javascript-developers)

</div>

<div class="vp-card">

### Migrating from lodash?

Method-by-method migration table. 12kb vs 72kb, better tree-shaking.

[Lodash Migration →](/for/lodash-users)

</div>

</div>

## Why collect-ts?

| Operation | Native JavaScript | collect-ts |
|-----------|-------------------|------------|
| Group by | 6-line reduce | `.groupBy('category')` |
| Unique | `[...new Set(...)]` | `.unique()` |
| Sum | `reduce((sum, o) => ...)` | `.sum('total')` |
| First match | `.find(u => ...)` | `.firstWhere()` |

**Chain it together:**

```typescript
collect(users)
    .where('active', true)
    .pluck('email')
    .unique()
    .all()
// → ['taylor@example.com', 'abigail@example.com']
```

One line per operation, readable at a glance.

## What's next

- **[Quick Start](/00-quickstart)** — Installation and basic usage
- **[TypeScript Guide](/01-typescript)** — Understand type safety and inference
- **[Common Patterns](/02-patterns)** — Sorting, grouping, and real-world examples
- **[Full API Reference](/collections)** — All 130+ methods documented

<style>
.vp-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.vp-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
}

.vp-card h3 {
  margin: 0 0 8px 0;
  font-size: 1.1em;
}

.vp-card p {
  margin: 0 0 12px 0;
  color: var(--vp-c-text-2);
  font-size: 0.95em;
}

.vp-card a {
  font-weight: 500;
}
</style>
