# For Laravel Developers

You know Laravel Collections. Now use them in your Inertia frontend.

The same `collect()`, `where()`, `pluck()`, and `sortBy()` you use in your controllers work identically in your React or Vue components. Nothing new to learn.

## Same API, Same Behavior

::: code-group

```php [Controller (PHP)]
$activeUsers = collect($users)
    ->where('active', true)
    ->sortBy('name')
    ->pluck('email');
```

```typescript [Component (TypeScript)]
const activeUsers = collect(users)
    .where('active', true)
    .sortBy('name')
    .pluck('email')
```

:::

The method names are the same. The arguments are the same. The behavior is the same.

## With Inertia.js

Your controller passes data to the frontend. On the frontend, you manipulate it with the same Collection API:

Instant search and sorting with no server round-trip:

```tsx
import { usePage } from '@inertiajs/react'
import { collect } from 'collect-ts'
import { useState } from 'react'

export default function ProductList() {
    const { products } = usePage().props
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('name')

    const displayed = collect(products)
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sortBy(sortBy)

    return (
        <div>
            <input
                placeholder="Search..."
                onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => setSortBy('name')}>Sort by Name</button>
            <button onClick={() => setSortBy('price')}>Sort by Price</button>
            <ul>
                {displayed.map(p => (
                    <li key={p.id}>{p.name} - ${p.price}</li>
                )).all()}
            </ul>
        </div>
    )
}
```

Same methods. Same arguments. Same behavior.

## TypeScript Catches Your Typos

In PHP, a typo in a property name fails at runtime. In TypeScript with collect-ts, the compiler catches it before you deploy:

```typescript
interface User {
    id: number
    name: string
    email: string
}

collect(users).pluck('emial') // [!code error]
```

TypeScript error: `'emial'` does not exist on `User`.

When you rename a property in your types, every Collection call that references the old name becomes a compile error instead of a runtime bug.

## Nested Properties Work Too

Just like Laravel:

```typescript
collect(orders).pluck('customer.address.city')
collect(orders).where('customer.address.city', 'Amsterdam')
```

Typo in the path? Caught at compile time.

## LazyCollection for Large Datasets

Same concept as Laravel's `LazyCollection`, generator-based evaluation for memory efficiency:

```typescript
import { lazy } from 'collect-ts'

const errors = lazy(readLines('huge-log.jsonl'))
    .filter(entry => entry.level === 'error')
    .take(100)
    .all()
```

## What's next

- [TypeScript Guide](/01-typescript): More on type safety and inference
- [Common Patterns](/02-patterns): Sorting, grouping, chart data
- [Full API Reference](/api/): All 130+ methods
