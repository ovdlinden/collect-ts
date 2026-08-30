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

## Tree-Shaking

Add the plugin:

::: code-group
```ts [Vite]
import { vite as collectionPlugin } from 'collect-ts/plugin';

export default { plugins: [collectionPlugin()] };
```

```ts [Rollup]
import { rollup as collectionPlugin } from 'collect-ts/plugin';

export default { plugins: [collectionPlugin()] };
```

```js [Webpack]
const { webpack: collectionPlugin } = require('collect-ts/plugin');

module.exports = { plugins: [collectionPlugin()] };
```
:::

Ships only the methods you call. Typical bundle: ~14 KB gzipped. See the [Tree-Shaking Guide](/guide/tree-shaking) for Next.js, Nuxt, esbuild, and manual approaches.

## What's next

- [TypeScript Guide](/01-typescript): How type inference catches bugs before runtime
- [Common Patterns](/02-patterns): Sorting, grouping, deduplication
- [Collections Reference](/collections/): All 155+ methods
