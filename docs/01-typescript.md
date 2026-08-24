# TypeScript

In JavaScript, a typo in a property name fails silently at runtime. Your users notice before you do. With collect-ts, TypeScript catches it before you save the file.

## 1. The compiler catches your typos

You have a user list. You want to extract emails.

```typescript
interface User {
    id: number
    name: string
    email: string
}

const users: User[] = await fetchUsers()

collect(users).pluck('emial') // [!code error]
```

TypeScript stops you: the property does not exist. In JavaScript, this would silently return undefined values, and you'd discover the bug when users complain about blank fields.

This works for all property-based methods. When you rename a property in your interface, every collection call that references the old name becomes a compile error instead of a silent bug.

## 2. Types flow through the chain

You don't annotate anything. The compiler tracks every transformation:

```typescript
collect(users)
    .filter(u => u.age >= 18)
    .pluck('email')
    .unique()
    .all()
```

Start with users, end with strings. After pluck, you can't accidentally call user-specific methods because the type narrowed. The final call returns an array, not a collection.

Nested properties work the same way:

```typescript
interface Order {
    customer: { address: { city: string } }
}

collect(orders).pluck('customer.address.city')
collect(orders).where('customer.address.city', 'Amsterdam')
```

Typo in the path? Caught at compile time.

## 3. Different methods, different return types

Your IDE shows exactly what you'll get:

| Method | Returns |
|--------|---------|
| all() | T[] |
| first() | T \| undefined |
| sum() | number |
| isEmpty() | boolean |
| keyBy('id') | Record\<string, T\> |

Nothing to memorize. Hover over any call and see the type.

## 4. Union types and narrowing

Mixed collections preserve their union:

```typescript
const mixed = collect([1, 'two', 3])
```

The type is a union of number and string. You can only call methods that work for both.

To narrow the type, use a type guard:

```typescript
const numbers = mixed.filter((x): x is number => typeof x === 'number')
```

Now the collection holds only numbers. Without the type guard annotation, TypeScript would keep the union even though you've logically filtered it down.

## 5. Literal types with as const

Preserve specific string values instead of widening to string:

```typescript
const statuses = collect(['pending', 'active', 'done'] as const)

statuses.contains('pending')
statuses.contains('invalid') // [!code error]
```

The first call is valid. The second fails because the string is not in the union. The collection type is the three literal strings, not a generic string.

## Tips

::: tip Type your source data
With an explicit interface, you get full inference. Without it, `fetchUsers` returns `any` and TypeScript cannot catch typos.
:::

::: tip Let TypeScript infer
Don't write explicit type annotations on collection results. The compiler already knows the return type.
:::

::: tip Use `as const` for literals
For literal arrays when you want the exact values preserved, use `as const`.
:::

::: details Writing generic functions

When writing reusable functions, the type flows through:

```typescript
function processItems<T>(items: T[]): Collection<T> {
    return collect(items).filter(Boolean)
}

function getEmails<T extends { email: string }>(items: T[]): string[] {
    return collect(items).pluck('email').all()
}
```

The constraint in the second function ensures it only accepts items that have an email property. Without it, TypeScript couldn't guarantee that pluck is valid.

:::

## What's next

- [Common Patterns](/02-patterns) — Sorting, grouping, chart data, and more
- [LazyCollection](/03-lazy) — Memory-efficient processing for large datasets
