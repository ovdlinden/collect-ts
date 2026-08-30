# Tree-Shaking Guide

collect-ts supports tree-shaking to minimize your bundle size. Only the methods you use are included in the final bundle.

## Quick Start

### Option 1: Automatic with Plugin (Recommended)

Install and configure the plugin for your bundler:

::: code-group
```ts [Vite]
// vite.config.ts
import { vite as collectionPlugin } from 'collect-ts/plugin';

export default {
  plugins: [collectionPlugin()]
};
```

```ts [Rollup]
// rollup.config.js
import { rollup as collectionPlugin } from 'collect-ts/plugin';

export default {
  plugins: [collectionPlugin()]
};
```

```js [Webpack]
// webpack.config.js
const { webpack: collectionPlugin } = require('collect-ts/plugin');

module.exports = {
  plugins: [collectionPlugin()]
};
```

```ts [esbuild]
import { esbuild as collectionPlugin } from 'collect-ts/plugin';

esbuild.build({
  plugins: [collectionPlugin()]
});
```
:::

Then write normal code - the plugin handles the rest:

```ts
import { collect } from 'collect-ts';

// Only filter, map, and groupBy are bundled
collect(users)
  .filter(u => u.active)
  .map(u => u.name)
  .groupBy('role');
```

### Option 2: Manual Tree-Shaking

Import from modular entry points directly:

```ts
import { createCollection } from 'collect-ts/core';
import filterMethod from 'collect-ts/methods/filter';
import mapMethod from 'collect-ts/methods/map';

const collect = createCollection([filterMethod, mapMethod]);

collect([1, 2, 3, 4, 5])
  .filter(x => x > 2)
  .map(x => x * 2);
// → [6, 8, 10]
```

### Option 3: Standalone Functions

For the smallest possible bundle, use standalone functions:

```ts
import { filter, map, groupBy } from 'collect-ts/fn';

const active = filter(users, u => u.active);
const names = map(active, u => u.name);
const byRole = groupBy(users, 'role');
```

## Bundle Size Comparison

| Usage | Bundle Size |
|-------|-------------|
| Full library (`import { collect }`) | ~56 KB |
| With plugin (5 methods) | ~6 KB |
| Manual (filter + map) | ~5.5 KB |
| Standalone functions only | ~200 B per function |

## Available Exports

### `collect-ts/core`

Minimal Collection infrastructure:

```ts
import { 
  createCollection,  // Factory for tree-shakeable Collections
  CoreCollection,    // Base Collection class
  // Type utilities
  type CollectionKind,
  type Arrayable,
  type ValueRetriever,
} from 'collect-ts/core';
```

### `collect-ts/fn`

Standalone functions that work on plain arrays:

```ts
import {
  filter, map, reduce, first, last,
  groupBy, keyBy, sortBy,
  sum, avg, min, max,
  unique, pluck, chunk, partition,
  where, whereIn,
  // ... and more
} from 'collect-ts/fn';
```

### `collect-ts/methods`

Method definitions for `createCollection`:

```ts
import filterMethod from 'collect-ts/methods/filter';
import mapMethod from 'collect-ts/methods/map';
import groupByMethod from 'collect-ts/methods/groupBy';
// ... import only what you need
```

### `collect-ts/plugin`

Bundler plugins for automatic transformation:

```ts
import { 
  vite,     // Vite plugin
  rollup,   // Rollup plugin
  webpack,  // Webpack plugin
  esbuild,  // esbuild plugin
} from 'collect-ts/plugin';
```

## How the Plugin Works

The plugin analyzes your code at build time:

**Input:**
```ts
import { collect } from 'collect-ts';
collect(users).filter(u => u.active).map(u => u.name);
```

**Output:**
```ts
import { createCollection } from 'collect-ts/core';
import filterMethod from 'collect-ts/methods/filter';
import mapMethod from 'collect-ts/methods/map';
const collect = createCollection([filterMethod, mapMethod]);
collect(users).filter(u => u.active).map(u => u.name);
```

This enables bundlers to tree-shake unused methods.

## Plugin Options

```ts
collectionPlugin({
  // Custom package name (default: 'collect-ts')
  packageName: '@my-org/collection',
  
  // Enable debug logging
  debug: true,
});
```

## Framework Examples

### Next.js

```js
// next.config.js
module.exports = {
  webpack: (config) => {
    const { webpack: collectionPlugin } = require('collect-ts/plugin');
    config.plugins.push(collectionPlugin());
    return config;
  },
};
```

### Nuxt 3

```ts
// nuxt.config.ts
import { vite as collectionPlugin } from 'collect-ts/plugin';

export default defineNuxtConfig({
  vite: {
    plugins: [collectionPlugin()]
  }
});
```

### SvelteKit

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { vite as collectionPlugin } from 'collect-ts/plugin';

export default {
  plugins: [sveltekit(), collectionPlugin()]
};
```

## Tips

1. **Use the plugin** for the best developer experience - write normal code and get automatic optimization.

2. **Standalone functions** are ideal for simple transformations where you don't need chaining.

3. **Terminal methods** like `all()`, `toArray()`, `count()`, `isEmpty()` are always available on CoreCollection - no need to import them separately.

4. The plugin only transforms files that import from `collect-ts` - other files are untouched.
