# Tree-Shaking

Full library: ~56 KB. With the plugin: ~6 KB for five methods.

## Use the Plugin

Add it to your bundler and write code normally. The plugin rewrites your imports at build time so only the methods you call get bundled.

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

That's it. Your code stays the same:

```ts
import { collect } from 'collect-ts';

collect(users)
  .filter(u => u.active)
  .map(u => u.name)
  .groupBy('role');
```

The plugin transforms this to:

```ts
import { createCollection } from 'collect-ts/core';
import filterMethod from 'collect-ts/methods/filter';
import mapMethod from 'collect-ts/methods/map';
import groupByMethod from 'collect-ts/methods/groupBy';

const collect = createCollection([filterMethod, mapMethod, groupByMethod]);

collect(users)
  .filter(u => u.active)
  .map(u => u.name)
  .groupBy('role');
```

Now your bundler sees exactly which methods are used and drops the rest.

### Framework setup

::: details Next.js
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
:::

::: details Nuxt 3
```ts
// nuxt.config.ts
import { vite as collectionPlugin } from 'collect-ts/plugin';

export default defineNuxtConfig({
  vite: {
    plugins: [collectionPlugin()]
  }
});
```
:::

::: details SvelteKit
```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { vite as collectionPlugin } from 'collect-ts/plugin';

export default {
  plugins: [sveltekit(), collectionPlugin()]
};
```
:::

### Plugin options

```ts
collectionPlugin({
  packageName: '@my-org/collection', // if you've aliased the package
  debug: true,                        // logs which methods it found
});
```

## Without the Plugin

Two alternatives when you can't use the plugin.

### Standalone functions

Skip the Collection wrapper entirely. Each function is ~200 bytes.

```ts
import { filter, map, groupBy } from 'collect-ts/fn';

const active = filter(users, u => u.active);
const names = map(active, u => u.name);
const byRole = groupBy(users, 'role');
```

No chaining. Just functions over arrays.

### Manual collection

Build your own `collect` with only the methods you need:

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

Terminal methods (`all()`, `toArray()`, `count()`, `isEmpty()`) are built into CoreCollection and always available.

## Size Reference

| Approach | Size |
|----------|------|
| Full library | ~56 KB |
| Plugin (5 methods) | ~6 KB |
| Manual (2 methods) | ~5.5 KB |
| Standalone function | ~200 B each |

## Exports

### `collect-ts/core`

```ts
import { 
  createCollection,
  CoreCollection,
  type CollectionKind,
  type Arrayable,
  type ValueRetriever,
} from 'collect-ts/core';
```

### `collect-ts/fn`

```ts
import {
  filter, map, reduce, first, last,
  groupBy, keyBy, sortBy,
  sum, avg, min, max,
  unique, pluck, chunk, partition,
  where, whereIn,
  // ...
} from 'collect-ts/fn';
```

### `collect-ts/methods`

```ts
import filterMethod from 'collect-ts/methods/filter';
import mapMethod from 'collect-ts/methods/map';
import groupByMethod from 'collect-ts/methods/groupBy';
```

### `collect-ts/plugin`

```ts
import { vite, rollup, webpack, esbuild } from 'collect-ts/plugin';
```
