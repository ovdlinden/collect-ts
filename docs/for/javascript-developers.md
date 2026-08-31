# For JavaScript Developers

You're tired of writing `filter().map().reduce()` chains that are hard to read and harder to debug.

This is fine for simple cases:

```javascript
const total = orders.reduce((sum, o) => sum + o.total, 0)
```

But this gets ugly fast:

```javascript
const result = items
    .filter(item => item.active)
    .reduce((acc, item) => {
        const key = item.category
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
    }, {})
```

collect-ts gives you readable, chainable methods for common operations:

```typescript
import { collect } from 'collect-ts'

const total = collect(orders).sum('total')

const result = collect(items)
    .where('active', true)
    .groupBy('category')
```

## The Mental Model

### 1. `collect()` wraps an array

```typescript
const collection = collect([1, 2, 3, 4, 5])
```

You now have a Collection, not an array. It has methods.

### 2. Methods return new Collections

```typescript
const filtered = collection.filter(n => n > 2)  // → Collection
const mapped = filtered.map(n => n * 2)         // → Collection
```

Collections are immutable. Each method returns a new Collection, leaving the original unchanged. You can chain as many methods as you want.

### 3. Terminal methods extract values

When you need the actual data, use a terminal method:

| Method | Returns |
|--------|---------|
| `.all()` | The underlying array |
| `.first()` | First item, or `undefined` |
| `.sum()` | Sum of all items |
| `.count()` | Number of items |
| `.toArray()` | Array (same as `.all()`) |

```typescript
const numbers = collect([1, 2, 3, 4, 5])
    .filter(n => n > 2)
    .map(n => n * 2)
    .all()
// → [6, 8, 10]
```

Now it's an array.

## Key Differences from Native Arrays

### `.map()` returns a Collection, not an Array

Native returns an array:

```typescript
[1, 2, 3].map(n => n * 2)
// → [2, 4, 6]
```

collect-ts returns a Collection:

```typescript
collect([1, 2, 3]).map(n => n * 2)
// → Collection<number>

collect([1, 2, 3])
    .map(n => n * 2)
    .all()
// → [2, 4, 6]
```

This is intentional - it lets you keep chaining.

### Property shorthand for common operations

Instead of writing callbacks, use property names:

Native:

```typescript
users.map(u => u.email)
users.reduce((sum, u) => sum + u.age, 0)
```

collect-ts:

```typescript
collect(users).pluck('email')
collect(users).sum('age')
```

### Nested property access

```typescript
collect(orders).pluck('customer.address.city')
collect(orders).where('customer.address.city', 'Amsterdam')
```

### No more reduce boilerplate

Native groupBy requires a reduce:

```typescript
const byCategory = items.reduce((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
}, {})
```

collect-ts is one method:

```typescript
const byCategory = collect(items).groupBy('category')
```

## When to Use collect-ts vs. Native

| Scenario | Use |
|----------|-----|
| Simple one-liner | Native is fine |
| Multiple chained transforms | collect-ts is cleaner |
| Grouping, keying, deduplication | collect-ts has built-in methods |
| Type-safe property access | collect-ts catches typos |
| Large datasets | `LazyCollection` for memory efficiency |

## Example: Before and After

### Grouping with counts

Native:

```typescript
const countByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
}, {})
```

collect-ts:

```typescript
const countByStatus = collect(orders).countBy('status')
```

### Unique values from nested property

Native:

```typescript
const cities = [...new Set(orders.map(o => o.customer.address.city))]
```

collect-ts:

```typescript
const cities = collect(orders)
    .pluck('customer.address.city')
    .unique()
    .all()
```

### First matching item with fallback

Native:

```typescript
const admin = users.find(u => u.role === 'admin') ?? defaultUser
```

collect-ts:

```typescript
const admin = collect(users).firstWhere('role', 'admin') ?? defaultUser
```

## What's next

- [Common Patterns](/02-patterns) - Sorting, deduplication, chart data
- [TypeScript Guide](/01-typescript) - How type inference works
- [LazyCollection](/03-lazy) - Memory-efficient processing for large datasets
