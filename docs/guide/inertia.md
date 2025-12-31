# Inertia.js Integration

Your controller sends data. Your component transforms it for display.

The same collection API you use in Laravel works in your frontend—`where()`, `pluck()`, `groupBy()` all work exactly as you'd expect.

```php
// Laravel
$users->pluck('email')->implode(', ');
```

```ts
// collect-ts
collect(users).pluck('email').join(', ')
```

::: info New to collect-ts?
Start with [TypeScript](/guide/typescript) to understand type safety, then come back here for Inertia.js patterns.
:::

## The Dashboard

Imagine building a team dashboard. Your controller sends:

```ts
const { users, posts, orders } = usePage().props

// users: team members with roles and departments
// posts: their recent articles with tags
// orders: their recent purchases with line items
```

A single user looks like:

```ts
{
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    phone: '555-0101',
    department: 'Engineering',
    active: true,
    verified: true,
    canEdit: true,
}
```


## Exporting Team Data

Need to copy all team emails to clipboard? Or export phone numbers?

```ts
// All emails, comma-separated
collect(users).pluck('email').join(', ')
// → "alice@example.com, bob@example.com, ..."

// Phone numbers only (skip nulls)
collect(users)
    .whereNotNull('phone')
    .pluck('phone')
    .join('\n')
```

Wire it up:

```tsx
<button onClick={() => navigator.clipboard.writeText(
    collect(users).pluck('email').join(', ')
)}>
    Copy Emails
</button>
```


## Bulk Selection

Let users select team members for bulk operations:

```ts
const selected = collect(users).whereIn('id', selectedIds)

selected.count()                    // How many selected
selected.every(u => u.canEdit)      // Can we bulk edit?
selected.pluck('email').join(', ')  // For confirmation
```

**React:** Wrap in `useMemo` to avoid recalculating on every render:

```tsx
const selected = useMemo(
    () => collect(users).whereIn('id', [...selectedIds]),
    [users, selectedIds]
)
```

**Vue:** Use `computed` for reactivity:

```ts
const selected = computed(() =>
    collect(users).whereIn('id', [...selectedIds.value])
)
```


## Building Form Inputs

Populate an assignee dropdown:

```ts
collect(users)
    .map(u => ({
        value: u.id,
        label: `${u.name} (${u.email})`
    }))
    .prepend({ value: '', label: 'Select assignee...' })
    .all()
```

Wire it up:

```tsx
<select>
    {collect(users)
        .map(u => ({ value: u.id, label: u.name }))
        .prepend({ value: '', label: 'Select...' })
        .map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
        .all()}
</select>
```


## Search & Filter

Filter the team list as the user types:

```ts
collect(users)
    .when(search, c => c.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase())
    ))
    .all()
```

Group results by department:

```ts
collect(users)
    .when(search, c => c.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase())
    ))
    .groupBy('department')
    .all()
```


## Visual Grouping

Split users into active and inactive tabs:

```ts
const [active, inactive] = collect(users).partition('active')

active.count()    // 3
inactive.count()  // 7
```


## Content Analytics

Team members write posts with tags. Show a tag cloud:

```ts
collect(posts)
    .flatMap(p => p.tags)
    .unique()
    .sort()
    .all()
// → ['inertia', 'laravel', 'vue']
```

Count tag usage:

```ts
collect(posts)
    .flatMap(p => p.tags)
    .countBy()
    .all()
// → { laravel: 5, vue: 3, inertia: 2 }
```


## Order Summaries

Aggregate line items across all orders:

```ts
const items = collect(orders).flatMap(o => o.items)

items.count()                 // Total line items
items.sum('quantity')         // Total units
items.groupBy('product_id')   // Group by product
```

Summarize by product:

```ts
items
    .groupBy('product_id')
    .map(group => ({
        name: group.first()?.product_name,
        quantity: group.sum('quantity'),
    }))
    .all()
```


## Debugging

Inspect the chain mid-flow with `tap`:

```ts
collect(users)
    .filter(u => u.verified)
    .tap(c => console.log('Verified:', c.count()))
    .sortBy('name')
    .take(10)
```


## What Stays in Your Controller

Not everything should transform on the frontend:

- **Business logic** — permission checks, status rules
- **Aggregations** — revenue totals, usage stats
- **Heavy filtering** — let the database do it

Your controller should send pre-processed data. If you're filtering by permissions in your component, move that to Laravel.


## Related Guides

- **[TypeScript](/guide/typescript)** — Understand type safety and inference
- **[Common Patterns](/guide/patterns)** — Sorting, grouping, and more examples
- **[LazyCollection](/guide/lazy)** — Memory-efficient processing for large datasets
