---
layout: home

hero:
  name: Laravel Collection
  text: for TypeScript
  tagline: A fully-typed TypeScript port of Laravel's Collection class with 130+ methods
  actions:
    - theme: brand
      text: Get Started
      link: /collections
    - theme: alt
      text: View on GitHub
      link: https://github.com/ovdlinden/collect-ts

features:
  - icon: 🎯
    title: Full Laravel Parity
    details: 130+ Collection methods ported from Laravel 12.x with identical behavior and API
  - icon: 📘
    title: Fully Typed
    details: Complete TypeScript type definitions with generics, inference, and IDE autocomplete
  - icon: ⚡
    title: Zero Dependencies
    details: Lightweight and fast with no external dependencies
  - icon: 🔗
    title: Fluent Chaining
    details: Chain methods together for expressive, readable data transformations
---

## Installation {#installation}

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

:::

## Quick Start

```typescript
import { collect } from 'collect-ts'

// Create a collection
const collection = collect([1, 2, 3, 4, 5])

// Chain methods fluently
const result = collection
  .map(n => n * 2)
  .filter(n => n > 4)
  .sum()

// => 24
```

## Why Laravel Collection for TypeScript?

If you've used Laravel's Collection class in PHP, you know how powerful and expressive it makes working with arrays. This library brings that same experience to TypeScript with:

- **Familiar API** - Same method names and behavior as Laravel
- **Type Safety** - Full TypeScript support with generics
- **IDE Support** - Autocomplete and inline documentation
- **Higher-Order Messaging** - Use `collection.map.name` instead of `collection.map(item => item.name)`

## Documentation

This documentation is synced from [Laravel's official Collection documentation](https://laravel.com/docs/collections) and adapted for TypeScript. All PHP examples have been converted to idiomatic TypeScript.

[Read the full documentation →](/collections)
