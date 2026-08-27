# For Lodash Users

You're migrating from lodash. Here's everything you need.

## Why Switch?

| | collect-ts | lodash |
|-|------------|--------|
| **Size** | 12kb brotli | 72kb |
| **TypeScript** | First-class, with Path types | @types/lodash |
| **Tree-shaking** | Full | Partial (need lodash-es) |
| **API style** | Fluent chaining | Utility functions |
| **Dependencies** | Zero | Zero |

## The Mental Shift

lodash passes data as the first argument. collect-ts wraps data and chains methods:

::: code-group

```typescript [lodash]
import _ from 'lodash'

const users = [
    { name: 'Taylor', role: 'admin', active: true },
    { name: 'Abigail', role: 'user', active: true },
    { name: 'James', role: 'user', active: false }
]

const result = _.chain(users)
    .filter(u => u.active)
    .groupBy('role')
    .mapValues(group => _.map(group, 'name'))
    .value()
// → { admin: ['Taylor'], user: ['Abigail'] }
```

```typescript [collect-ts]
import { collect } from 'collect-ts'

const users = [
    { name: 'Taylor', role: 'admin', active: true },
    { name: 'Abigail', role: 'user', active: true },
    { name: 'James', role: 'user', active: false }
]

const result = collect(users)
    .where('active', true)
    .groupBy('role')
    .map(group => group.pluck('name').all())
    .all()
// → { admin: ['Taylor'], user: ['Abigail'] }
```

:::

No `_.chain()` needed. No `.value()` at the end. Just `.all()` when you want an array or object back.

## Quick Reference

### Grouping & Aggregation

::: code-group

```typescript [lodash]
_.groupBy(items, 'category')
_.keyBy(items, 'id')
_.countBy(items, 'status')
_.partition(items, fn)

_.sumBy(items, 'value')
_.meanBy(items, 'score')
_.minBy(items, 'price')
_.maxBy(items, 'price')
```

```typescript [collect-ts]
collect(items).groupBy('category').all()
collect(items).keyBy('id').all()
collect(items).countBy('status').all()
collect(items).partition(fn)

collect(items).sum('value')
collect(items).avg('score')        // meanBy → avg
collect(items).min('price')
collect(items).max('price')
```

:::

**Example:**

```typescript
const sales = [
    { product: 'Widget', region: 'US', amount: 100 },
    { product: 'Gadget', region: 'EU', amount: 200 },
    { product: 'Widget', region: 'EU', amount: 150 }
]

collect(sales).groupBy('product').all()
// → { Widget: [{...}, {...}], Gadget: [{...}] }

collect(sales).sum('amount')
// → 450
```

### Filtering & Finding

::: code-group

```typescript [lodash]
_.filter(items, { active: true })
_.filter(items, fn)
_.reject(items, fn)
_.find(items, fn)
_.findLast(items, fn)
```

```typescript [collect-ts]
collect(items).where('active', true).all()
collect(items).filter(fn).all()
collect(items).reject(fn).all()
collect(items).first(fn)
collect(items).last(fn)
```

:::

**collect-ts has more expressive filters:**

```typescript
const products = [
    { name: 'Laptop', price: 999, stock: 5 },
    { name: 'Mouse', price: 29, stock: 100 },
    { name: 'Keyboard', price: 79, stock: 0 }
]

// Comparison operators
collect(products).where('price', '>', 50).all()
// → [{ name: 'Laptop', ... }, { name: 'Keyboard', ... }]

// Multiple conditions
collect(products).where('price', '<', 100).where('stock', '>', 0).all()
// → [{ name: 'Mouse', ... }]

// Where in array
collect(products).whereIn('name', ['Laptop', 'Mouse']).all()
// → [{ name: 'Laptop', ... }, { name: 'Mouse', ... }]

// Where between
collect(products).whereBetween('price', [50, 500]).all()
// → [{ name: 'Keyboard', ... }]
```

### Uniqueness & Set Operations

::: code-group

```typescript [lodash]
_.uniq(items)
_.uniqBy(items, 'email')
_.difference(a, b)
_.intersection(a, b)
_.union(a, b)
```

```typescript [collect-ts]
collect(items).unique().all()
collect(items).unique('email').all()
collect(a).diff(b).all()
collect(a).intersect(b).all()
collect(a).union(b).all()
```

:::

### Sorting

::: code-group

```typescript [lodash]
_.sortBy(items, 'name')
_.orderBy(items, ['a', 'b'], ['asc', 'desc'])
_.reverse(items)
_.shuffle(items)
```

```typescript [collect-ts]
collect(items).sortBy('name').all()
collect(items).sortBy('a').sortByDesc('b').all()
collect(items).reverse().all()
collect(items).shuffle().all()
```

:::

**Chained sorts read naturally:**

```typescript
const tasks = [
    { title: 'Deploy', priority: 1, created: '2024-01-15' },
    { title: 'Review', priority: 1, created: '2024-01-10' },
    { title: 'Test', priority: 2, created: '2024-01-12' }
]

// Sort by priority (asc), then by created date (desc)
collect(tasks).sortBy('priority').sortByDesc('created').all()
// → [{ title: 'Deploy', ... }, { title: 'Review', ... }, { title: 'Test', ... }]
```

### Transformation

::: code-group

```typescript [lodash]
_.map(items, 'name')
_.flatMap(items, fn)
_.flatten(items)
_.flattenDeep(items)
_.chunk(items, 3)
_.zip(a, b)
```

```typescript [collect-ts]
collect(items).pluck('name').all()     // map + property → pluck
collect(items).flatMap(fn).all()
collect(items).flatten().all()
collect(items).flatten(Infinity).all()
collect(items).chunk(3).all()
collect(a).zip(b).all()
```

:::

**Pluck with nested properties:**

```typescript
const orders = [
    { id: 1, customer: { name: 'Alice', address: { city: 'NYC' } } },
    { id: 2, customer: { name: 'Bob', address: { city: 'LA' } } }
]

collect(orders).pluck('customer.name').all()
// → ['Alice', 'Bob']

collect(orders).pluck('customer.address.city').all()
// → ['NYC', 'LA']
```

### Access & Slicing

::: code-group

```typescript [lodash]
_.first(items)
_.last(items)
_.nth(items, 2)
_.take(items, 5)
_.drop(items, 5)
_.slice(items, 1, 3)
```

```typescript [collect-ts]
collect(items).first()
collect(items).last()
collect(items).get(2)
collect(items).take(5).all()
collect(items).skip(5).all()       // drop → skip
collect(items).slice(1, 2).all()   // note: length, not end index
```

:::

### Predicates

::: code-group

```typescript [lodash]
_.some(items, fn)
_.every(items, fn)
_.includes(items, value)
_.isEmpty(items)
```

```typescript [collect-ts]
collect(items).some(fn)
collect(items).every(fn)
collect(items).contains(value)     // includes → contains
collect(items).isEmpty()
```

:::

### Objects & Records

::: code-group

```typescript [lodash]
_.pick(obj, ['a', 'b'])
_.omit(obj, ['c', 'd'])
_.keys(obj)
_.values(obj)
_.merge(a, b)
```

```typescript [collect-ts]
collect(obj).only(['a', 'b']).all()    // pick → only
collect(obj).except(['c', 'd']).all()  // omit → except
collect(obj).keys().all()
collect(obj).values().all()
collect(a).merge(b).all()
```

:::

## What collect-ts Adds

Methods lodash doesn't have (or requires multiple calls):

```typescript
// Conditional operations
collect(items)
    .when(shouldFilter, c => c.where('active', true))
    .all()

// Tap for debugging
collect(items)
    .filter(fn)
    .tap(c => console.log('After filter:', c.count()))
    .map(fn)
    .all()

// Safe access with defaults
collect(items).firstOr(defaultItem)
collect(items).sole()  // throws if not exactly one match

// Pagination
collect(items).forPage(2, 10).all()  // page 2, 10 per page
```

## Migration Gotchas

### 1. Terminating the chain

lodash's `_.chain()` requires `.value()`. collect-ts requires nothing for single values, `.all()` for arrays/objects:

```typescript
// Returns a number directly
collect([1, 2, 3]).sum()
// → 6

// Returns the array
collect([1, 2, 3]).map(n => n * 2).all()
// → [2, 4, 6]
```

### 2. Slice takes length, not end index

```typescript
// lodash: start index, end index
_.slice([1, 2, 3, 4, 5], 1, 3)
// → [2, 3]

// collect-ts: start index, length
collect([1, 2, 3, 4, 5]).slice(1, 2).all()
// → [2, 3]
```

### 3. Method naming

| lodash | collect-ts | Why |
|--------|------------|-----|
| `meanBy` | `avg` | Laravel convention |
| `includes` | `contains` | Laravel convention |
| `drop` | `skip` | Laravel convention |
| `pick` | `only` | Laravel convention |
| `omit` | `except` | Laravel convention |

### 4. groupBy returns Collections, not arrays

```typescript
// lodash: values are arrays
_.groupBy(items, 'category')
// → { a: [...], b: [...] }

// collect-ts: values are Collections
collect(items).groupBy('category')
// → Collection of Collections

// To get plain arrays, use .all() on the outer result
collect(items)
    .groupBy('category')
    .map(g => g.all())
    .all()
// → { a: [...], b: [...] }
```

## TypeScript Advantage

lodash with `@types/lodash` gives you basic types. collect-ts gives you path inference:

```typescript
interface User {
    id: number
    profile: { email: string }
}

// lodash: no error, fails at runtime
_.map(users, 'profile.emial')

// collect-ts: compile-time error
collect(users).pluck('profile.emial') // [!code error]
// Error: 'profile.emial' is not a valid path on User
```

## What's next

- [Full API Reference](/collections) — All 130+ methods
- [Common Patterns](/02-patterns) — Real-world examples
- [Performance](/05-benchmarks) — When to use what
