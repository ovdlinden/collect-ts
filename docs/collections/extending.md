# Extending Collections

Collections are "macroable", which allows you to add additional methods to the `Collection` class at runtime. The `Collection.macro()` static method accepts a name and a function that will be executed when your macro is called. The macro function may access the collection's methods via `this`, just as if it were a real method of the collection class. For example, the following code adds a `toUpper` method to the `Collection` class:

```typescript
import { Collection, collect } from 'collect-ts';

Collection.macro('toUpper', function(this: Collection<string>) {
    return this.map((value) => value.toUpperCase());
});

const collection = collect(['first', 'second']);
const upper = (collection as Collection<string> & { toUpper: () => Collection<string> }).toUpper();

console.log(upper.all());
```

The `toUpper()` macro returns `['FIRST', 'SECOND']`.

Typically, you should declare collection macros during your application's initialization.

## Macro Arguments

If necessary, you may define macros that accept additional arguments:

```typescript
Collection.macro('multiply', function(this: Collection<number>, factor: number) {
    return this.map((value) => value * factor);
});

const collection = collect([1, 2, 3]);
const multiplied = (collection as Collection<number> & { multiply: (n: number) => Collection<number> })
    .multiply(10);

console.log(multiplied.all());
```

## Macro Management

You can check if a macro exists and flush all macros:

```typescript
Collection.hasMacro('toUpper');

Collection.flushMacros();

Collection.hasMacro('toUpper');
```

The first `hasMacro` call returns `true`, and after `flushMacros()` it returns `false`.
