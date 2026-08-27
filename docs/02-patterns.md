# Common Patterns

You've filtered data in your components with type safety. Now you need to sort results, deduplicate entries, or prepare data for charts.

::: info Related Guides
- **Processing large datasets?** See [LazyCollection](/03-lazy) for memory-efficient streaming.
- **Want type safety?** See [TypeScript](/01-typescript) for compile-time validation.
:::

## Sorting

When your UI needs ordered results but the server sent them unsorted:

```typescript
collect(users).sortBy('name').all() // [!code highlight]
collect(users).sortByDesc('createdAt').all() // [!code highlight]
```

**Custom sort order** (e.g., priority tickets):

```typescript
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

collect(tickets)
    .sortBy(t => priorityOrder[t.priority]) // [!code highlight]
    .all()
```

::: details Natural sort for version numbers and filenames

```typescript
collect(['v2', 'v10', 'v1'])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .all()
// → ['v1', 'v2', 'v10']
```
:::


## Lookup Tables

Need O(1) access instead of searching an array every time?

```typescript
const usersById = collect(users).keyBy('id').all() // [!code highlight]

const user = usersById[userId]
```

This transforms O(n) search into O(1) lookup. Instead of scanning the array each time you need a user, you index once and access directly.


## Deduplication

**By value:**

```typescript
collect(['a', 'b', 'a', 'c'])
    .unique()
    .all()
// → ['a', 'b', 'c']
```

**By property:**

```typescript
collect(users)
    .unique('email')
    .all()
```

**By computed key**, one user per email domain:

```typescript
collect(users)
    .unique(u => u.email.split('@')[1])
    .all()
```


## Comparing Lists

Find what's been added or removed between two arrays:

```typescript
const added = collect(currentIds)
    .diff(previousIds)
    .all()

const removed = collect(previousIds)
    .diff(currentIds)
    .all()
```

The `diff` method returns items in the first collection that aren't in the second. Useful for sync operations: what was added, what was removed.


::: details Form Arrays

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
:::


## Chart Data

Reshaping data for charting libraries:

Pie chart data:

```typescript
const pieData = collect(stats)
    .map(s => ({ name: s.category, value: s.total })) // [!code highlight]
    .all()
```

With percentages:

```typescript
const total = collect(stats).sum('value')
const withPercentages = collect(stats)
    .map(s => ({ // [!code highlight]
        ...s, // [!code highlight]
        percentage: total > 0 ? (s.value / total) * 100 : 0, // [!code highlight]
    })) // [!code highlight]
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
collect([]).first()
collect([]).first() ?? fallback

collect(items).firstOrFail()
```

- `first()` returns `undefined` on empty collections
- Use `?? fallback` to provide a default value
- `firstOrFail()` throws if empty

## What's next

- [LazyCollection](/03-lazy) — Process huge datasets without memory issues
- [Performance](/05-benchmarks) — When to use collect-ts vs native methods
