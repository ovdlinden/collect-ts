# Testing Code Output UX

## Output Styling

```typescript
collect([1, 2, 3, 4, 5])
  .filter(n => n % 2 === 0)
  .all()
// → [2, 4]
```

## Multiple Examples

```typescript
const numbers = collect([1, 2, 3, 4, 5]);

numbers.sum()
// → 15

numbers.avg()
// → 3

numbers.filter(n => n > 2).all()
// → [3, 4, 5]
```

## Complex Output

```typescript
collect(['Taylor', 'Abigail', 'Jessica'])
  .map(name => name.toUpperCase())
  .all()
// → ['TAYLOR', 'ABIGAIL', 'JESSICA']
```
