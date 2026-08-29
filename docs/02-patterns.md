# Common Patterns

You've filtered data in your components with type safety. Now you need to sort results, deduplicate entries, or prepare data for charts.

::: info Related Guides
- **Processing large datasets?** See [LazyCollection](/03-lazy) for memory-efficient streaming.
- **Want type safety?** See [TypeScript](/01-typescript) for compile-time validation.
:::

## Sorting

When your UI needs ordered results but the server sent them unsorted:

```typescript
collect([
  { name: 'Taylor', createdAt: '2024-01-15' },
  { name: 'Abigail', createdAt: '2024-02-20' },
])
  .sortBy('name')
  .all()
// → [{ name: 'Abigail', ... }, { name: 'Taylor', ... }]
```

**Custom sort order** (e.g., priority tickets):

```typescript
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

collect([
  { title: 'Bug fix', priority: 'low' },
  { title: 'Security patch', priority: 'critical' },
  { title: 'Feature request', priority: 'medium' },
])
  .sortBy(t => priorityOrder[t.priority])
  .all()
// → [{ title: 'Security patch', ... }, { title: 'Feature request', ... }, { title: 'Bug fix', ... }]
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
const users = [
  { id: 1, name: 'Taylor' },
  { id: 2, name: 'Abigail' },
]

const usersById = collect(users).keyBy('id').all()
// → { 1: { id: 1, name: 'Taylor' }, 2: { id: 2, name: 'Abigail' } }

const user = usersById[1]
// → { id: 1, name: 'Taylor' }
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
collect([
  { id: 1, email: 'taylor@example.com' },
  { id: 2, email: 'abigail@test.com' },
  { id: 3, email: 'taylor@example.com' },
])
  .unique('email')
  .all()
// → [{ id: 1, email: 'taylor@example.com' }, { id: 2, email: 'abigail@test.com' }]
```

**By computed key**, one user per email domain:

```typescript
collect([
  { name: 'Taylor', email: 'taylor@example.com' },
  { name: 'Abigail', email: 'abigail@example.com' },
  { name: 'James', email: 'james@test.com' },
])
  .unique(u => u.email.split('@')[1])
  .all()
// → [{ name: 'Taylor', ... }, { name: 'James', ... }]
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
const stats = [
  { category: 'Electronics', total: 1500 },
  { category: 'Clothing', total: 800 },
  { category: 'Books', total: 300 },
]

const pieData = collect(stats)
  .map(s => ({ name: s.category, value: s.total }))
  .all()
// → [{ name: 'Electronics', value: 1500 }, ...]
```

With percentages:

```typescript
const stats = [
  { category: 'Electronics', value: 60 },
  { category: 'Clothing', value: 30 },
  { category: 'Books', value: 10 },
]

const total = collect(stats).sum('value')
const withPercentages = collect(stats)
  .map(s => ({
    ...s,
    percentage: total > 0 ? (s.value / total) * 100 : 0,
  }))
  .all()
// → [{ category: 'Electronics', value: 60, percentage: 60 }, ...]
```


## Alphabetical Sections

Grouping contacts by first letter for a scrollable list:

```typescript
const contacts = [
  { name: 'Alice' },
  { name: 'Bob' },
  { name: 'Anna' },
]

const sections = collect(contacts)
  .sortBy('name')
  .groupBy(c => c.name[0].toUpperCase())
  .map((items, letter) => ({ letter, items: items.all() }))
  .values()
  .all()
// → [
//     { letter: 'A', items: [{ name: 'Alice' }, { name: 'Anna' }] },
//     { letter: 'B', items: [{ name: 'Bob' }] },
//   ]
```


## Kanban Columns

Grouping tasks by status for a board view:

```typescript
const tasks = [
  { title: 'Design', status: 'done', position: 1 },
  { title: 'Implement', status: 'in-progress', position: 1 },
  { title: 'Test', status: 'todo', position: 1 },
]

const columns = collect(tasks)
  .groupBy('status')
  .map((items, status) => ({
    status,
    items: items.sortBy('position').all(),
    count: items.count(),
  }))
  .values()
  .all()
// → [
//     { status: 'done', items: [...], count: 1 },
//     { status: 'in-progress', items: [...], count: 1 },
//     { status: 'todo', items: [...], count: 1 },
//   ]
```


## Safe Access

Handle empty collections gracefully:

```typescript
collect([]).first()
// → undefined

collect([]).first() ?? 'fallback'
// → 'fallback'

collect([{ name: 'Taylor' }]).firstOrFail()
// → { name: 'Taylor' }

collect([]).firstOrFail()
// → throws ItemNotFoundException
```

- `first()` returns `undefined` on empty collections
- Use `?? fallback` to provide a default value
- `firstOrFail()` throws if empty

## What's next

- [LazyCollection](/03-lazy): Process huge datasets without memory issues
- [Performance](/05-benchmarks): When to use collect-ts vs native methods
