# TypeScript

Typos are expensive. In JavaScript, `pluck('emial')` fails silently at runtime—after your users notice. With collect-ts, TypeScript catches it before you save the file.

```typescript
collect(users).pluck('emial')
//                    ~~~~~~ Property 'emial' does not exist on type 'User'
```

This guide shows how collect-ts leverages TypeScript to catch errors early and improve your development experience.

::: info Related Guides
- **Ready to use patterns?** See [Common Patterns](/guide/patterns) for real-world examples.
- **Processing large files?** See [LazyCollection](/guide/lazy) for streaming data.
:::

## Types Flow Automatically

You don't need to annotate anything. Types flow through method chains:

```typescript
interface User {
    id: number
    name: string
    email: string
    age: number
}

const users: User[] = [/* ... */]

collect(users)            // Collection<User>
    .filter(u => u.age >= 18)  // Collection<User>
    .pluck('email')            // Collection<string>
    .unique()                  // Collection<string>
    .all()                     // string[]
```

The compiler tracks every transformation. No manual type annotations needed.


## Property Access is Validated

You're accessing `user.emial`—a typo. In JavaScript, this silently returns `undefined`. In collect-ts, TypeScript catches it:

```typescript
// ✓ Valid - 'name' exists on User
collect(users).pluck('name')

// ✓ Valid - 'email' exists on User
collect(users).where('email', 'test@example.com')

// ✗ Error - 'emial' doesn't exist
collect(users).pluck('emial')
```

This works for all property-based methods: `pluck`, `where`, `sortBy`, `groupBy`, `keyBy`, `unique`, and more.

Rename a property in your interface and TypeScript shows every place that needs updating.


## Nested Properties Work Too

Dot notation is fully type-safe:

```typescript
interface Order {
    id: number
    customer: {
        name: string
        address: {
            city: string
        }
    }
}

collect(orders).pluck('customer.name')
collect(orders).where('customer.address.city', 'Amsterdam')
collect(orders).sortBy('customer.name')
```

Typo in a nested path? Caught at compile time.


## Transformations Change Types

Some methods change what the collection holds. TypeScript tracks these transformations:

**`pluck()` extracts a single type:**

```typescript
collect(users).pluck('email')  // Collection<string>
```

**`map()` transforms to a new type:**

```typescript
collect([1, 2, 3]).map(n => n.toString())  // Collection<string>
```

**`collapse()` flattens one level:**

```typescript
const nested = collect([[1, 2], [3, 4]])  // Collection<number[]>
nested.collapse()                          // Collection<number>
```

**`flatten()` flattens deeply:**

```typescript
const deep = collect([[[1, 2]], [[3, 4]]])  // Collection<number[][]>
deep.flatten()                               // Collection<number>
deep.flatten(1)                              // Collection<number[]>
```


## Return Types Match the Method

Different methods return different types. Your IDE shows exactly what you'll get:

```typescript
const numbers = collect([1, 2, 3])

numbers.all()       // number[]
numbers.first()     // number | undefined
numbers.sum()       // number
numbers.isEmpty()   // boolean
numbers.count()     // number
numbers.toJson()    // string
```


## Union Types

Mixed collections preserve their union:

```typescript
const mixed = collect([1, 'two', 3])  // Collection<number | string>
```

Use type guards to narrow:

```typescript
const numbers = mixed.filter((x): x is number => typeof x === 'number')
// Collection<number>
```


## Literal Types

Use `as const` to preserve literal types:

```typescript
const statuses = collect(['pending', 'active', 'done'] as const)
// Collection<'pending' | 'active' | 'done'>

statuses.contains('pending')   // ✓ Valid
statuses.contains('invalid')   // ✗ Error
```


## IDE Integration

With TypeScript configured, you get:

- **Autocomplete** — see all available methods as you type
- **Hover docs** — description, parameters, return type, examples
- **Go to definition** — click through to the implementation
- **Refactoring** — rename a property and TypeScript updates all usages


## Tips

**Type your source data:**

```typescript
// ✓ Explicit interface — full inference
interface User { id: number; name: string }
const users: User[] = fetchUsers()
collect(users).pluck('name')  // TypeScript knows 'name' is valid

// ✗ Untyped — no inference
const users = fetchUsers()     // any[]
collect(users).pluck('name')   // No error on typos
```

**Use `as const` for literal arrays:**

```typescript
const keys = ['name', 'email'] as const
collect(users).only(keys)  // Precise tuple type
```

**Don't over-annotate:**

```typescript
// Unnecessary — TypeScript already knows
const result: Collection<string> = collect(users).pluck('name')

// Better — let it infer
const result = collect(users).pluck('name')
```


## Writing Generic Functions

When writing reusable functions:

```typescript
function processItems<T>(items: T[]): Collection<T> {
    return collect(items).filter(Boolean)
}

// Type flows through
const users = processItems(rawUsers)  // Collection<User>
```

With constraints:

```typescript
function getEmails<T extends { email: string }>(items: T[]): string[] {
    return collect(items).pluck('email').all()
}
```
