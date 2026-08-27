# For Lodash Users

You're migrating from lodash. Here's everything mapped.

## Why Switch?

| | collect-ts | lodash |
|-|------------|--------|
| **Size** | 12kb brotli | 72kb |
| **TypeScript** | First-class, with Path types | @types/lodash |
| **Tree-shaking** | Full | Partial (need lodash-es) |
| **API style** | Fluent chaining | Utility functions |
| **Dependencies** | Zero | Zero |

## Migration Table

### Grouping & Keying

| lodash | collect-ts |
|--------|------------|
| `_.groupBy(items, 'category')` | `collect(items).groupBy('category')` |
| `_.keyBy(items, 'id')` | `collect(items).keyBy('id')` |
| `_.countBy(items, 'status')` | `collect(items).countBy('status')` |
| `_.partition(items, fn)` | `collect(items).partition(fn)` |

### Aggregation

| lodash | collect-ts |
|--------|------------|
| `_.sumBy(items, 'value')` | `collect(items).sum('value')` |
| `_.meanBy(items, 'value')` | `collect(items).avg('value')` |
| `_.minBy(items, 'value')` | `collect(items).min('value')` |
| `_.maxBy(items, 'value')` | `collect(items).max('value')` |

### Filtering

| lodash | collect-ts |
|--------|------------|
| `_.filter(items, {active: true})` | `collect(items).where('active', true)` |
| `_.reject(items, fn)` | `collect(items).reject(fn)` |
| `_.find(items, fn)` | `collect(items).first(fn)` |
| `_.findLast(items, fn)` | `collect(items).last(fn)` |

### Uniqueness & Comparison

| lodash | collect-ts |
|--------|------------|
| `_.uniq(items)` | `collect(items).unique()` |
| `_.uniqBy(items, 'email')` | `collect(items).unique('email')` |
| `_.difference(a, b)` | `collect(a).diff(b)` |
| `_.intersection(a, b)` | `collect(a).intersect(b)` |
| `_.union(a, b)` | `collect(a).union(b)` |

### Sorting

| lodash | collect-ts |
|--------|------------|
| `_.sortBy(items, 'name')` | `collect(items).sortBy('name')` |
| `_.orderBy(items, ['a', 'b'], ['asc', 'desc'])` | `collect(items).sortBy('a').sortByDesc('b')` |
| `_.reverse(items)` | `collect(items).reverse()` |
| `_.shuffle(items)` | `collect(items).shuffle()` |

### Transformation

| lodash | collect-ts |
|--------|------------|
| `_.map(items, 'name')` | `collect(items).pluck('name')` |
| `_.flatMap(items, fn)` | `collect(items).flatMap(fn)` |
| `_.flatten(items)` | `collect(items).flatten()` |
| `_.flattenDeep(items)` | `collect(items).flatten(Infinity)` |
| `_.chunk(items, 3)` | `collect(items).chunk(3)` |
| `_.zip(a, b)` | `collect(a).zip(b)` |

### Access

| lodash | collect-ts |
|--------|------------|
| `_.first(items)` | `collect(items).first()` |
| `_.last(items)` | `collect(items).last()` |
| `_.nth(items, 2)` | `collect(items).get(2)` |
| `_.take(items, 5)` | `collect(items).take(5)` |
| `_.drop(items, 5)` | `collect(items).skip(5)` |
| `_.slice(items, 1, 3)` | `collect(items).slice(1, 2)` |

### Predicates

| lodash | collect-ts |
|--------|------------|
| `_.some(items, fn)` | `collect(items).some(fn)` |
| `_.every(items, fn)` | `collect(items).every(fn)` |
| `_.includes(items, value)` | `collect(items).contains(value)` |
| `_.isEmpty(items)` | `collect(items).isEmpty()` |

### Objects/Records

| lodash | collect-ts |
|--------|------------|
| `_.pick(obj, ['a', 'b'])` | `collect(obj).only(['a', 'b'])` |
| `_.omit(obj, ['a', 'b'])` | `collect(obj).except(['a', 'b'])` |
| `_.keys(obj)` | `collect(obj).keys()` |
| `_.values(obj)` | `collect(obj).values()` |
| `_.merge(a, b)` | `collect(a).merge(b)` |

## Pattern Differences

### Utility functions vs. fluent chains

::: code-group

```typescript [lodash]
import _ from 'lodash'

const result = _.chain(items)
    .filter(i => i.active)
    .groupBy('category')
    .mapValues(group => _.sumBy(group, 'value'))
    .value()
```

```typescript [collect-ts]
import { collect } from 'collect-ts'

const result = collect(items)
    .where('active', true)
    .groupBy('category')
    .map(group => group.sum('value'))
    .all()
```

:::

lodash requires `_.chain()` to enable method chaining. collect-ts chains by default.

### Property shorthand everywhere

lodash has some property shorthand (`_.sumBy(items, 'value')`), but not everywhere.

collect-ts supports property strings in most methods:

```typescript
collect(items).where('active', true)     // property === value
collect(items).pluck('user.email')       // nested property
collect(items).sortBy('createdAt')       // sort by property
collect(items).unique('email')           // unique by property
collect(items).sum('amount')             // sum property values
```

## What's next

- [Full API Reference](/collections) — All 130+ methods
- [Common Patterns](/02-patterns) — Real-world examples
- [Performance](/05-benchmarks) — When to use what
