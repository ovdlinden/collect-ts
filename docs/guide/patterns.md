# Common Patterns

You've filtered data in your components and enjoyed type safety. Now you need to sort results, deduplicate entries, or prepare data for charts.

These patterns complement what you've learned in the other guides.

::: info Related Guides
- **Processing large datasets?** See [LazyCollection](/guide/lazy) for memory-efficient streaming.
- **Want type safety?** See [TypeScript](/guide/typescript) for compile-time validation.
- **Building with Inertia.js?** See [Inertia.js](/guide/inertia) for frontend patterns.
:::

## Sorting

When your UI needs ordered results but the server sent them unsorted:

```typescript
collect(users).sortBy('name').all()
collect(users).sortByDesc('createdAt').all()
```

**Custom sort order** (e.g., priority tickets):

```typescript
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

collect(tickets)
    .sortBy(t => priorityOrder[t.priority])
    .all()
```

**Natural sort** for version numbers and filenames:

```typescript
collect(['v2', 'v10', 'v1'])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .all()
// ['v1', 'v2', 'v10']
```


## Lookup Tables

Need O(1) access instead of searching an array every time?

```typescript
const usersById = collect(users).keyBy('id').all()

// Fast lookup — no .find() needed
const user = usersById[userId]
```


## Deduplication

**By value:**

```typescript
collect(['a', 'b', 'a', 'c']).unique().all()
// ['a', 'b', 'c']
```

**By property:**

```typescript
collect(users).unique('email').all()
```

**By computed key** — one user per email domain:

```typescript
collect(users)
    .unique(u => u.email.split('@')[1])
    .all()
```


## Comparing Lists

Find what's been added or removed between two arrays:

```typescript
const added = collect(currentIds).diff(previousIds).all()
const removed = collect(previousIds).diff(currentIds).all()
```


## Form Arrays

Managing dynamic line items (invoice rows, ingredients, etc.):

```typescript
interface LineItem {
    id: string
    description: string
    quantity: number
    price: number
}

function useLineItems(initial: LineItem[] = []) {
    const [lines, setLines] = useState(initial)

    const add = () => {
        setLines(prev => [...prev, {
            id: crypto.randomUUID(),
            description: '',
            quantity: 1,
            price: 0
        }])
    }

    const remove = (id: string) => {
        setLines(prev => collect(prev).reject(line => line.id === id).all())
    }

    const totals = useMemo(() => ({
        subtotal: collect(lines).sum(line => line.quantity * line.price),
        count: lines.length,
    }), [lines])

    return { lines, add, remove, totals }
}
```


## Chart Data

Reshaping data for charting libraries:

```typescript
// Pie chart data
const pieData = collect(stats)
    .map(s => ({ name: s.category, value: s.total }))
    .all()

// With percentages
const total = collect(stats).sum('value')
const withPercentages = collect(stats)
    .map(s => ({
        ...s,
        percentage: total > 0 ? (s.value / total) * 100 : 0,
    }))
    .all()
```


## Alphabetical Sections

Grouping contacts by first letter for a scrollable list:

```typescript
const sections = collect(contacts)
    .sortBy('name')
    .groupBy(c => c.name[0].toUpperCase())
    .map((items, letter) => ({ letter, items: items.all() }))
    .values()
    .all()
```


## Kanban Columns

Grouping tasks by status for a board view:

```typescript
const columns = collect(tasks)
    .groupBy('status')
    .map((items, status) => ({
        status,
        items: items.sortBy('position').all(),
        count: items.count(),
    }))
    .values()
    .all()
```


## Safe Access

Handle empty collections gracefully:

```typescript
collect([]).first()              // undefined
collect([]).first() ?? fallback  // fallback

collect(items).firstOrFail()     // Throws if empty
```
