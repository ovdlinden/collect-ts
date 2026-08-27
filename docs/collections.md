---
outline: 2
---

# Collections

::: tip TypeScript Port
This documentation is automatically synced from [Laravel's official documentation](https://laravel.com/docs/13.x/collections) with PHP examples converted to TypeScript. Some methods may have TypeScript-specific behavior noted below.
:::

<a name="introduction"></a>
## Introduction

The `Collection` class provides a fluent, convenient wrapper for working with arrays of data. For example, check out the following code. We'll use the `collect` helper to create a new collection instance from the array, convert each element to uppercase, and then remove all empty elements:

```typescript
const collection = collect(['Taylor', 'Abigail', null])
    .map(name => name?.toUpperCase())
    .reject(name => !name);
```

As you can see, the `Collection` class allows you to chain its methods to perform fluent mapping and reducing of the underlying array. In general, collections are immutable, meaning every `Collection` method returns an entirely new `Collection` instance.

<a name="creating-collections"></a>
### Creating Collections

As mentioned above, the `collect` helper returns a new `Collection` instance for the given array. So, creating a collection is as simple as:

```typescript
const collection = collect([1, 2, 3]);
```

You may also create a collection using the [make](#make) and [fromJson](#fromjson) methods.

<a name="extending-collections"></a>
### Extending Collections

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

<a name="macro-arguments"></a>
#### Macro Arguments

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

<a name="macro-management"></a>
#### Macro Management

You can check if a macro exists and flush all macros:

```typescript
Collection.hasMacro('toUpper');

Collection.flushMacros();

Collection.hasMacro('toUpper');
```

The first `hasMacro` call returns `true`, and after `flushMacros()` it returns `false`.

<a name="available-methods"></a>
## Available Methods

For the majority of the remaining collection documentation, we'll discuss each method available on the `Collection` class. Remember, all of these methods may be chained to fluently manipulate the underlying array. Furthermore, almost every method returns a new `Collection` instance, allowing you to preserve the original copy of the collection when necessary:

<style>
    .collection-method-list > p {
        columns: 10.8em 3; -moz-columns: 10.8em 3; -webkit-columns: 10.8em 3;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

<div class="collection-method-list" markdown="1">

[after](#after)
[all](#all)
[average](#average)
[avg](#avg)
[before](#before)
[chunk](#chunk)
[chunkWhile](#chunkwhile)
[collapse](#collapse)
[collapseWithKeys](#collapsewithkeys)
[collect](#collect)
[combine](#combine)
[concat](#concat)
[contains](#contains)
[containsOneItem](#containsoneitem)
[containsStrict](#containsstrict)
[count](#count)
[countBy](#method-countby)
[crossJoin](#crossjoin)
[dd](#dd)
[diff](#diff)
[diffAssoc](#diffassoc)
[diffAssocUsing](#diffassocusing)
[diffKeys](#diffkeys)
[doesntContain](#doesntcontain)
[doesntContainStrict](#doesntcontainstrict)
[dot](#dot)
[dump](#dump)
[duplicates](#duplicates)
[duplicatesStrict](#duplicatesstrict)
[each](#each)
[eachSpread](#eachspread)
[ensure](#ensure)
[every](#every)
[except](#except)
[filter](#filter)
[first](#first)
[firstOrFail](#first-or-fail)
[firstWhere](#first-where)
[flatMap](#flatmap)
[flatten](#flatten)
[flip](#flip)
[forget](#forget)
[forPage](#forpage)
[fromJson](#fromjson)
[get](#get)
[groupBy](#groupby)
[has](#has)
[hasAny](#hasany)
[implode](#implode)
[intersect](#intersect)
[intersectUsing](#intersectusing)
[intersectAssoc](#intersectAssoc)
[intersectAssocUsing](#intersectassocusing)
[intersectByKeys](#intersectbykeys)
[isEmpty](#isempty)
[isNotEmpty](#isnotempty)
[join](#join)
[keyBy](#keyby)
[keys](#keys)
[last](#last)
[lazy](#lazy)
[macro](#macro)
[make](#make)
[map](#map)
[mapInto](#mapinto)
[mapSpread](#mapspread)
[mapToDictionary](#maptodictionary)
[mapToGroups](#maptogroups)
[mapWithKeys](#mapwithkeys)
[max](#max)
[median](#median)
[merge](#merge)
[mergeRecursive](#mergerecursive)
[min](#min)
[mode](#mode)
[multiply](#multiply)
[nth](#nth)
[only](#only)
[pad](#pad)
[partition](#partition)
[percentage](#percentage)
[pipe](#pipe)
[pipeInto](#pipeinto)
[pipeThrough](#pipethrough)
[pluck](#pluck)
[pop](#pop)
[prepend](#prepend)
[pull](#pull)
[push](#push)
[put](#put)
[random](#random)
[range](#range)
[reduce](#reduce)
[reduceSpread](#reduce-spread)
[reject](#reject)
[replace](#replace)
[replaceRecursive](#replacerecursive)
[reverse](#reverse)
[search](#search)
[select](#select)
[shift](#shift)
[shuffle](#shuffle)
[skip](#skip)
[skipUntil](#skipuntil)
[skipWhile](#skipwhile)
[slice](#slice)
[sliding](#sliding)
[sole](#sole)
[some](#some)
[sort](#sort)
[sortBy](#sortby)
[sortByDesc](#sortbydesc)
[sortDesc](#sortdesc)
[sortKeys](#sortkeys)
[sortKeysDesc](#sortkeysdesc)
[sortKeysUsing](#sortkeysusing)
[splice](#splice)
[split](#split)
[splitIn](#splitin)
[sum](#sum)
[take](#take)
[takeUntil](#takeuntil)
[takeWhile](#takewhile)
[tap](#tap)
[times](#times)
[toArray](#toarray)
[toJson](#tojson)
[toPrettyJson](#to-pretty-json)
[transform](#transform)
[undot](#undot)
[union](#union)
[unique](#unique)
[uniqueStrict](#uniquestrict)
[unless](#unless)
[unlessEmpty](#unlessempty)
[unlessNotEmpty](#unlessnotempty)
[unwrap](#unwrap)
[value](#value)
[values](#values)
[when](#when)
[whenEmpty](#whenempty)
[whenNotEmpty](#whennotempty)
[where](#where)
[whereStrict](#wherestrict)
[whereBetween](#wherebetween)
[whereIn](#wherein)
[whereInStrict](#whereinstrict)
[whereInstanceOf](#whereinstanceof)
[whereNotBetween](#wherenotbetween)
[whereNotIn](#wherenotin)
[whereNotInStrict](#wherenotinstrict)
[whereNotNull](#wherenotnull)
[whereNull](#wherenull)
[wrap](#wrap)
[zip](#zip)

</div>

<a name="method-listing"></a>
## Method Listing

<style>
    .collection-method code {
        font-size: 14px;
    }

    .collection-method:not(.first-collection-method) {
        margin-top: 50px;
    }
</style>

<a name="method-after"></a>
#### `after()` {.collection-method .first-collection-method}

The `after` method returns the item after the given item. `null` is returned if the given item is not found or is the last item:

```typescript
collect([1, 2, 3, 4, 5]).after(3);

collect([1, 2, 3, 4, 5]).after(5);
```

The first call returns `4`, and the second returns `null` since 5 is the last item.

This method searches for the given item using "loose" comparison, meaning a string containing an integer value will be considered equal to an integer of the same value. To use "strict" comparison, you may provide the `strict` argument to the method:

```typescript
collect([2, 4, 6, 8]).after('4', true);
```

This returns `null` because strict comparison is used.

Alternatively, you may provide your own closure to search for the first item that passes a given truth test:

```typescript
collect([2, 4, 6, 8]).after((item, key) => item > 5);
```

This returns `8`, the item after the first item greater than 5.

<a name="method-all"></a>
#### `all()` {.collection-method}

The `all` method returns the underlying array represented by the collection:

```typescript
collect([1, 2, 3]).all();
```

Returns `[1, 2, 3]`.

<a name="method-average"></a>
#### `average()` {.collection-method}

Alias for the [avg](#avg) method.

<a name="method-avg"></a>
#### `avg()` {.collection-method}

The `avg` method returns the [average value](https://en.wikipedia.org/wiki/Average) of a given key:

```typescript
const average = collect([
    { foo: 10 },
    { foo: 10 },
    { foo: 20 },
    { foo: 40 }
]).avg('foo');

const average2 = collect([1, 1, 2, 4]).avg();
```

The first example returns `20`, the second returns `2`.

<a name="method-before"></a>
#### `before()` {.collection-method}

The `before` method is the opposite of the [after](#after) method. It returns the item before the given item. `null` is returned if the given item is not found or is the first item:

```typescript
collect([1, 2, 3, 4, 5]).before(3);

collect([1, 2, 3, 4, 5]).before(1);

collect([2, 4, 6, 8]).before('4', true);

collect([2, 4, 6, 8]).before((item, key) => item > 5);
```

These return `2`, `null`, `null`, and `4` respectively.

<a name="method-chunk"></a>
#### `chunk()` {.collection-method}

The `chunk` method breaks the collection into multiple, smaller collections of a given size:

```typescript
const chunks = collect([1, 2, 3, 4, 5, 6, 7]).chunk(4);

chunks.all();
```

Returns `[[1, 2, 3, 4], [5, 6, 7]]`. This method is especially useful when working with a grid system such as [Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/). For example, imagine you have a collection of objects you want to display in a grid:

```vue
<template>
  <div v-for="(chunk, index) in products.chunk(3).all()" :key="index" class="row">
    <div v-for="product in chunk.all()" :key="product.name" class="col-xs-4">
      {{ product.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { collect } from 'collect-ts';

const products = collect([
  { name: 'Widget' }, { name: 'Gadget' }, { name: 'Gizmo' },
  { name: 'Tool' }, { name: 'Device' }
]);
</script>
```

<a name="method-chunkwhile"></a>
#### `chunkWhile()` {.collection-method}

The `chunkWhile` method breaks the collection into multiple, smaller collections based on the evaluation of the given callback. The `chunk` parameter passed to the callback may be used to inspect the previous element:

```typescript
const chunks = collect('AABBCCCD'.split('')).chunkWhile((value, key, chunk) => value === chunk.last());

chunks.all();
```

Returns `[['A', 'A'], ['B', 'B'], ['C', 'C', 'C'], ['D']]`.

<a name="method-collapse"></a>
#### `collapse()` {.collection-method}

The `collapse` method collapses a collection of arrays or collections into a single, flat collection:

```typescript
const collapsed = collect([
    [1, 2, 3], [4, 5, 6], [7, 8, 9]
]).collapse();

collapsed.all();
```

Returns `[1, 2, 3, 4, 5, 6, 7, 8, 9]`.

<a name="method-collapsewithkeys"></a>
#### `collapseWithKeys()` {.collection-method}

The `collapseWithKeys` method flattens a collection of arrays or collections into a single collection, keeping the original keys intact. If the collection is already flat, it will return an empty collection:

```typescript
const collapsed = collect({
    first: collect([1, 2, 3]),
    second: [4, 5, 6],
    third: collect([7, 8, 9])
}).collapseWithKeys();

collapsed.all();
```

Returns `{ first: [1, 2, 3], second: [4, 5, 6], third: [7, 8, 9] }`.

<a name="method-collect"></a>
#### `collect()` {.collection-method}

The `collect` method returns a new `Collection` instance with the items currently in the collection:

```typescript
const collectionA = collect([1, 2, 3]);
const collectionB = collectionA.collect();

collectionB.all();
```

Returns `[1, 2, 3]`. The `collect` method is primarily useful for converting [lazy collections](#lazy-collections) into standard `Collection` instances:

```typescript
const lazyCollection = LazyCollection.make(function*() {
    yield 1;
    yield 2;
    yield 3;
});
const collection = lazyCollection.collect();

collection.all();
```

Returns `[1, 2, 3]`.

> [!NOTE]
> The `collect` method is especially useful when you have an instance of `Enumerable` and need a non-lazy collection instance. Since `collect()` is part of the `Enumerable` contract, you can safely use it to get a `Collection` instance.

<a name="method-combine"></a>
#### `combine()` {.collection-method}

The `combine` method combines the values of the collection, as keys, with the values of another array or collection:

```typescript
const combined = collect(['name', 'age']).combine(['George', 29]);

combined.all();
```

Returns `{ name: 'George', age: 29 }`.

<a name="method-concat"></a>
#### `concat()` {.collection-method}

The `concat` method appends the given array or collection's values onto the end of another collection:

```typescript
const concatenated = collect(['John Doe'])
    .concat(['Jane Doe'])
    .concat({ name: 'Johnny Doe' });

concatenated.all();
```

Returns `['John Doe', 'Jane Doe', 'Johnny Doe']`. The `concat` method numerically reindexes keys for items concatenated onto the original collection. To maintain keys in associative collections, see the [merge](#merge) method.

<a name="method-contains"></a>
#### `contains()` {.collection-method}

The `contains` method determines whether the collection contains a given item. You may pass a closure to the `contains` method to determine if an element exists in the collection matching a given truth test:

```typescript
collect([1, 2, 3, 4, 5]).contains((value, key) => value > 5);
```

Returns `false`. Alternatively, you may pass a string to the `contains` method to determine whether the collection contains a given item value:

```typescript
collect({ name: 'Desk', price: 100 }).contains('Desk');

collect({ name: 'Desk', price: 100 }).contains('New York');
```

The first call returns `true`, the second returns `false`. You may also pass a key / value pair to the `contains` method, which will determine if the given pair exists in the collection:

```typescript
collect([{ product: 'Desk', price: 200 }, { product: 'Chair', price: 100 }]).contains('product', 'Bookcase');
```

Returns `false`. The `contains` method uses "loose" comparisons when checking item values, meaning a string with an integer value will be considered equal to an integer of the same value. Use the [containsStrict](#containsstrict) method to filter using "strict" comparisons.

For the inverse of `contains`, see the [doesntContain](#doesntcontain) method.

<a name="method-containsoneitem"></a>
#### `containsOneItem()` {.collection-method}

The `containsOneItem` method determines whether the collection contains a single item:

```typescript
collect([]).containsOneItem();

collect(['1']).containsOneItem();

collect(['1', '2']).containsOneItem();

collect([1, 2, 3]).containsOneItem(item => item === 2);
```

Returns `false`, `true`, `false`, and `true` respectively.

<a name="method-containsstrict"></a>
#### `containsStrict()` {.collection-method}

This method has the same signature as the [contains](#contains) method; however, all values are compared using "strict" comparisons.

<a name="method-count"></a>
#### `count()` {.collection-method}

The `count` method returns the total number of items in the collection:

```typescript
collect([1, 2, 3, 4]).count();
```

Returns `4`.

<a name="method-countBy"></a>
#### `countBy()` {.collection-method}

The `countBy` method counts the occurrences of values in the collection. By default, the method counts the occurrences of every element, allowing you to count certain "types" of elements in the collection:

```typescript
const counted = collect([1, 2, 2, 2, 3]).countBy();

counted.all();
```

Returns `{ 1: 1, 2: 3, 3: 1 }`. You may pass a closure to the `countBy` method to count all items by a custom value:

```typescript
const counted = collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com']).countBy(email => email.split('@')[1]);

counted.all();
```

Returns `{ 'gmail.com': 2, 'yahoo.com': 1 }`.

<a name="method-crossjoin"></a>
#### `crossJoin()` {.collection-method}

The `crossJoin` method cross joins the collection's values among the given arrays or collections, returning a Cartesian product with all possible permutations:

```typescript
collect([1, 2]).crossJoin(['a', 'b']).all();

/*
    [
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
    ]
*/

collect([1, 2]).crossJoin(['a', 'b'], ['I', 'II']).all();

/*
    [
        [1, 'a', 'I'],
        [1, 'a', 'II'],
        [1, 'b', 'I'],
        [1, 'b', 'II'],
        [2, 'a', 'I'],
        [2, 'a', 'II'],
        [2, 'b', 'I'],
        [2, 'b', 'II'],
    ]
*/
```

<a name="method-dd"></a>
#### `dd()` {.collection-method}

The `dd` method dumps the collection's items and ends execution of the script:

```typescript
collect(['John Doe', 'Jane Doe']).dd();

/*
    [
        "John Doe",
        "Jane Doe"
    ]
*/
```

If you do not want to stop executing the script, use the [dump](#dump) method instead.

<a name="method-diff"></a>
#### `diff()` {.collection-method}

The `diff` method compares the collection against another collection or a plain JavaScript array based on its values. This method will return the values in the original collection that are not present in the given collection:

```typescript
const diff = collect([1, 2, 3, 4, 5]).diff([2, 4, 6, 8]);

diff.all();
```

Returns `[1, 3, 5]`.

<a name="method-diffassoc"></a>
#### `diffAssoc()` {.collection-method}

The `diffAssoc` method compares the collection against another collection or a plain JavaScript object based on its keys and values. This method will return the key / value pairs in the original collection that are not present in the given collection:

```typescript
const diff = collect({
    color: 'orange',
    type: 'fruit',
    remain: 6
}).diffAssoc({
    color: 'yellow',
    type: 'fruit',
    remain: 3,
    price: 6
});

diff.all();
```

Returns `{ color: 'orange', remain: 6 }`.

<a name="method-diffassocusing"></a>
#### `diffAssocUsing()` {.collection-method}

Unlike `diffAssoc`, `diffAssocUsing` accepts a user supplied callback function for the indices comparison:

```typescript
const diff = collect({
    color: 'orange',
    type: 'fruit',
    remain: 6
}).diffAssocUsing(
    { Color: 'yellow', type: 'fruit', remain: 3 },
    (a, b) => a.toLowerCase().localeCompare(b.toLowerCase())
);

diff.all();
```

Returns `{ color: 'orange', remain: 6 }`. The callback must be a comparison function that returns an integer less than, equal to, or greater than zero.

<a name="method-diffkeys"></a>
#### `diffKeys()` {.collection-method}

The `diffKeys` method compares the collection against another collection or a plain JavaScript object based on its keys. This method will return the key / value pairs in the original collection that are not present in the given collection:

```typescript
const diff = collect({
    one: 10,
    two: 20,
    three: 30,
    four: 40,
    five: 50
}).diffKeys({
    two: 2,
    four: 4,
    six: 6,
    eight: 8
});

diff.all();
```

Returns `{ one: 10, three: 30, five: 50 }`.

<a name="method-doesntcontain"></a>
#### `doesntContain()` {.collection-method}

The `doesntContain` method determines whether the collection does not contain a given item. You may pass a closure to the `doesntContain` method to determine if an element does not exist in the collection matching a given truth test:

```typescript
collect([1, 2, 3, 4, 5]).doesntContain((value, key) => value < 5);
```

Returns `false`. Alternatively, you may pass a string to the `doesntContain` method to determine whether the collection does not contain a given item value:

```typescript
collect({ name: 'Desk', price: 100 }).doesntContain('Table');

collect({ name: 'Desk', price: 100 }).doesntContain('Desk');
```

The first call returns `true`, the second returns `false`. You may also pass a key / value pair to the `doesntContain` method, which will determine if the given pair does not exist in the collection:

```typescript
collect([{ product: 'Desk', price: 200 }, { product: 'Chair', price: 100 }]).doesntContain('product', 'Bookcase');
```

Returns `true`. The `doesntContain` method uses "loose" comparisons when checking item values, meaning a string with an integer value will be considered equal to an integer of the same value.

<a name="method-doesntcontainstrict"></a>
#### `doesntContainStrict()` {.collection-method}

This method has the same signature as the [doesntContain](#doesntcontain) method; however, all values are compared using "strict" comparisons.

<a name="method-dot"></a>
#### `dot()` {.collection-method}

The `dot` method flattens a multi-dimensional collection into a single level collection that uses "dot" notation to indicate depth:

```typescript
const flattened = collect({ products: { desk: { price: 100 } } }).dot();

flattened.all();
```

Returns `{ 'products.desk.price': 100 }`.

<a name="method-dump"></a>
#### `dump()` {.collection-method}

The `dump` method dumps the collection's items:

```typescript
collect(['John Doe', 'Jane Doe']).dump();

/*
    [
        "John Doe",
        "Jane Doe"
    ]
*/
```

If you want to stop executing the script after dumping the collection, use the [dd](#dd) method instead.

<a name="method-duplicates"></a>
#### `duplicates()` {.collection-method}

The `duplicates` method retrieves and returns duplicate values from the collection:

```typescript
collect(['a', 'b', 'a', 'c', 'b']).duplicates();
```

Returns `{ 2: 'a', 4: 'b' }`. If the collection contains arrays or objects, you can pass the key of the attributes that you wish to check for duplicate values:

```typescript
collect([{ email: 'abigail@example.com', position: 'Developer' }, { email: 'james@example.com', position: 'Designer' }, { email: 'victoria@example.com', position: 'Developer' }]).duplicates('position');
```

Returns `{ 2: 'Developer' }`.

<a name="method-duplicatesstrict"></a>
#### `duplicatesStrict()` {.collection-method}

This method has the same signature as the [duplicates](#duplicates) method; however, all values are compared using "strict" comparisons.

<a name="method-each"></a>
#### `each()` {.collection-method}

The `each` method iterates over the items in the collection and passes each item to a closure:

```typescript
collect([1, 2, 3, 4]).each((item, key) => {
    
});
```

If you would like to stop iterating through the items, you may return `false` from your closure:

```typescript
collect([1, 2, 3, 4]).each((item, key) => {
    if (/* condition */) {
        return false;
    }
});
```

<a name="method-eachspread"></a>
#### `eachSpread()` {.collection-method}

The `eachSpread` method iterates over the collection's items, passing each nested item value into the given callback:

```typescript
collect([['John Doe', 35], ['Jane Doe', 33]]).eachSpread((name, age) => {
    
});
```

You may stop iterating through the items by returning `false` from the callback:

```typescript
collect([['John Doe', 35], ['Jane Doe', 33]]).eachSpread((name, age) => false);
```

<a name="method-ensure"></a>
#### `ensure()` {.collection-method}

The `ensure` method may be used to verify that all elements of a collection are of a given type or list of types. Otherwise, an `UnexpectedValueException` will be thrown:

```typescript
return collect([new User, new User]).ensure(User);

return collect([new User, new Customer]).ensure([User, Customer]);
```

Primitive types such as `string`, `int`, `float`, `bool`, and `array` may also be specified:

```typescript
return collect([1, 2, 3]).ensure('number');
```

> [!WARNING]
> The `ensure` method does not guarantee that elements of different types will not be added to the collection at a later time.

<a name="method-every"></a>
#### `every()` {.collection-method}

The `every` method may be used to verify that all elements of a collection pass a given truth test:

```typescript
collect([1, 2, 3, 4]).every((value, key) => value > 2);
```

Returns `false`. If the collection is empty, the `every` method will return true:

```typescript
collect([]).every((value, key) => value > 2);
```

Returns `true`.

<a name="method-except"></a>
#### `except()` {.collection-method}

The `except` method returns all items in the collection except for those with the specified keys:

```typescript
const filtered = collect({ product_id: 1, price: 100, discount: false }).except(['price', 'discount']);

filtered.all();
```

Returns `{ product_id: 1 }`. For the inverse of `except`, see the [only](#only) method.

<a name="method-filter"></a>
#### `filter()` {.collection-method}

The `filter` method filters the collection using the given callback, keeping only those items that pass a given truth test:

```typescript
const filtered = collect([1, 2, 3, 4]).filter((value, key) => value > 2);

filtered.all();
```

Returns `[3, 4]`. If no callback is supplied, all entries of the collection that are equivalent to `false` will be removed:

```typescript
collect([1, 2, 3, null, false, '', 0, []])
    .filter()
    .all();
```

Returns `[1, 2, 3]`. For the inverse of `filter`, see the [reject](#reject) method.

<a name="method-first"></a>
#### `first()` {.collection-method}

The `first` method returns the first element in the collection that passes a given truth test:

```typescript
collect([1, 2, 3, 4]).first((value, key) => value > 2);
```

Returns `3`. You may also call the `first` method with no arguments to get the first element in the collection. If the collection is empty, `null` is returned:

```typescript
collect([1, 2, 3, 4]).first();
```

Returns `1`.

<a name="method-first-or-fail"></a>
#### `firstOrFail()` {.collection-method}

The `firstOrFail` method is identical to the `first` method; however, if no result is found, an `ItemNotFoundException` exception will be thrown:

```typescript
collect([1, 2, 3, 4]).firstOrFail((value, key) => value > 5);
```

Throws `ItemNotFoundException`. You may also call the `firstOrFail` method with no arguments to get the first element in the collection. If the collection is empty, an `ItemNotFoundException` exception will be thrown:

```typescript
collect([]).firstOrFail();
```

Throws `ItemNotFoundException`.

<a name="method-first-where"></a>
#### `firstWhere()` {.collection-method}

The `firstWhere` method returns the first element in the collection with the given key / value pair:

```typescript
collect([{ name: 'Regena', age: null }, { name: 'Linda', age: 14 }, { name: 'Diego', age: 23 }, { name: 'Linda', age: 84 }]).firstWhere('name', 'Linda');
```

Returns `{ name: 'Linda', age: 14 }`. You may also call the `firstWhere` method with a comparison operator:

```typescript
collect([{ name: 'Regena', age: null }, { name: 'Linda', age: 14 }, { name: 'Diego', age: 23 }, { name: 'Linda', age: 84 }]).firstWhere('age', '>=', 18);
```

Returns `{ name: 'Diego', age: 23 }`. Like the [where](#where) method, you may pass one argument to the `firstWhere` method. In this scenario, the `firstWhere` method will return the first item where the given item key's value is "truthy":

```typescript
collect([{ name: 'Regena', age: null }, { name: 'Linda', age: 14 }, { name: 'Diego', age: 23 }, { name: 'Linda', age: 84 }]).firstWhere('age');
```

Returns `{ name: 'Linda', age: 14 }`.

<a name="method-flatmap"></a>
#### `flatMap()` {.collection-method}

The `flatMap` method iterates through the collection and passes each value to the given closure. The closure is free to modify the item and return it, thus forming a new collection of modified items. Then, the array is flattened by one level:

```typescript
const flattened = collect([
    { name: 'Sally' },
    { school: 'Arkansas' },
    { age: 28 }
]).flatMap(values => {
    const entries = Object.entries(values);
    return Object.fromEntries(entries.map(([k, v]) => [k, String(v).toUpperCase()]));
});

flattened.all();
```

Returns `{ name: 'SALLY', school: 'ARKANSAS', age: '28' }`.

<a name="method-flatten"></a>
#### `flatten()` {.collection-method}

The `flatten` method flattens a multi-dimensional collection into a single dimension:

```typescript
const flattened = collect({ name: 'Taylor', languages: ['PHP', 'JavaScript'] }).flatten();

flattened.all();
```

Returns `['Taylor', 'PHP', 'JavaScript']`. If necessary, you may pass the `flatten` method a "depth" argument:

```typescript
const products = collect({
    Apple: [{ name: 'iPhone 6S', brand: 'Apple' }],
    Samsung: [{ name: 'Galaxy S7', brand: 'Samsung' }]
}).flatten(1);

products.values().all();

/*
    [{ name: 'iPhone 6S', brand: 'Apple' }, { name: 'Galaxy S7', brand: 'Samsung' }]
*/
```

In this example, calling `flatten` without providing the depth would have also flattened the nested arrays, resulting in `['iPhone 6S', 'Apple', 'Galaxy S7', 'Samsung']`. Providing a depth allows you to specify the number of levels nested arrays will be flattened.

<a name="method-flip"></a>
#### `flip()` {.collection-method}

The `flip` method swaps the collection's keys with their corresponding values:

```typescript
const flipped = collect({ name: 'Taylor', framework: 'Laravel' }).flip();

flipped.all();
```

Returns `{ Taylor: 'name', Laravel: 'framework' }`.

<a name="method-forget"></a>
#### `forget()` {.collection-method}

The `forget` method removes an item from the collection by its key:

```typescript
const collection = collect({ name: 'Taylor', framework: 'Laravel' });

collection.forget('name');

collection.forget(['name', 'framework']);
```

After forgetting a single key, it becomes `{ framework: 'Laravel' }`. Forgetting multiple keys results in an empty collection.

> [!WARNING]
> Unlike most other collection methods, `forget` does not return a new modified collection; it modifies and returns the collection it is called on.

<a name="method-forpage"></a>
#### `forPage()` {.collection-method}

The `forPage` method returns a new collection containing the items that would be present on a given page number. The method accepts the page number as its first argument and the number of items to show per page as its second argument:

```typescript
const chunk = collect([1, 2, 3, 4, 5, 6, 7, 8, 9]).forPage(2, 3);

chunk.all();
```

Returns `[4, 5, 6]`.

<a name="method-fromjson"></a>
#### `fromJson()` {.collection-method}

The static `fromJson` method creates a new collection instance by decoding a given JSON string using `JSON.parse`:

```typescript
const json = JSON.stringify({ name: 'Taylor Otwell', role: 'Developer', status: 'Active' });
const collection = Collection.fromJson(json);
```

<a name="method-get"></a>
#### `get()` {.collection-method}

The `get` method returns the item at a given key. If the key does not exist, `null` is returned:

```typescript
collect({ name: 'Taylor', framework: 'Laravel' }).get('name');
```

Returns `'Taylor'`. You may optionally pass a default value as the second argument:

```typescript
collect({ name: 'Taylor', framework: 'Laravel' }).get('age', 34);
```

Returns `34`. You may even pass a callback as the method's default value. The result of the callback will be returned if the specified key does not exist:

```typescript
collect({ name: 'Taylor', framework: 'Laravel' }).get('email', () => 'taylor@example.com');
```

Returns `'taylor@example.com'`.

<a name="method-groupby"></a>
#### `groupBy()` {.collection-method}

The `groupBy` method groups the collection's items by a given key:

```typescript
const grouped = collect([
    { account_id: 'account-x10', product: 'Chair' },
    { account_id: 'account-x10', product: 'Bookcase' },
    { account_id: 'account-x11', product: 'Desk' }
]).groupBy('account_id');

grouped.all();
```

Groups items by `account_id`, with `'account-x10'` containing `Chair` and `Bookcase`, and `'account-x11'` containing `Desk`. Instead of passing a string `key`, you may pass a callback. The callback should return the value you wish to key the group by:

```typescript
const grouped = collect([
    { account_id: 'account-x10', product: 'Chair' },
    { account_id: 'account-x10', product: 'Bookcase' },
    { account_id: 'account-x11', product: 'Desk' }
]).groupBy((item, key) => item.account_id.slice(-3));

grouped.all();
```

Groups items by the last 3 characters of `account_id`, with `x10` containing `Chair` and `Bookcase`, and `x11` containing `Desk`. Multiple grouping criteria may be passed as an array. Each array element will be applied to the corresponding level within a multi-dimensional array:

```typescript
const data = new Collection({
    10: { user: 1, skill: 1, roles: ['Role_1', 'Role_3'] },
    20: { user: 2, skill: 1, roles: ['Role_1', 'Role_2'] },
    30: { user: 3, skill: 2, roles: ['Role_1'] },
    40: { user: 4, skill: 2, roles: ['Role_2'] }
});
const result = data.groupBy(['skill', (item) => item.roles], true);
```

This creates a nested grouping structure, first by `skill` (1 or 2), then by role names (`Role_1`, `Role_2`, `Role_3`), preserving the original keys.

<a name="method-has"></a>
#### `has()` {.collection-method}

The `has` method determines if a given key exists in the collection:

```typescript
collect({ account_id: 1, product: 'Desk', amount: 5 }).has('product');

collect({ account_id: 1, product: 'Desk', amount: 5 }).has(['product', 'amount']);

collect({ account_id: 1, product: 'Desk', amount: 5 }).has(['amount', 'price']);
```

Returns `true`, `true`, and `false` respectively.

<a name="method-hasany"></a>
#### `hasAny()` {.collection-method}

The `hasAny` method determines whether any of the given keys exist in the collection:

```typescript
collect({ account_id: 1, product: 'Desk', amount: 5 }).hasAny(['product', 'price']);

collect({ account_id: 1, product: 'Desk', amount: 5 }).hasAny(['name', 'price']);
```

The first call returns `true` (has 'product'), the second returns `false` (has neither).

<a name="method-implode"></a>
#### `implode()` {.collection-method}

The `implode` method joins items in a collection. Its arguments depend on the type of items in the collection. If the collection contains arrays or objects, you should pass the key of the attributes you wish to join, and the "glue" string you wish to place between the values:

```typescript
collect([
    { account_id: 1, product: 'Desk' },
    { account_id: 2, product: 'Chair' }
]).implode('product', ', ');
```

Returns `'Desk, Chair'`. If the collection contains simple strings or numeric values, you should pass the "glue" as the only argument to the method:

```typescript
collect([1, 2, 3, 4, 5]).implode('-');
```

Returns `'1-2-3-4-5'`. You may pass a closure to the `implode` method if you would like to format the values being imploded:

```typescript
collect([
    { account_id: 1, product: 'Desk' },
    { account_id: 2, product: 'Chair' }
]).implode((item, key) => item.product.toUpperCase(), ', ');
```

Returns `'DESK, CHAIR'`.

<a name="method-intersect"></a>
#### `intersect()` {.collection-method}

The `intersect` method removes any values from the original collection that are not present in the given array or collection. The resulting collection will preserve the original collection's keys:

```typescript
const intersect = collect(['Desk', 'Sofa', 'Chair']).intersect(['Desk', 'Chair', 'Bookcase']);

intersect.all();
```

Returns `{ 0: 'Desk', 2: 'Chair' }`.

<a name="method-intersectusing"></a>
#### `intersectUsing()` {.collection-method}

The `intersectUsing` method removes any values from the original collection that are not present in the given array or collection, using a custom callback to compare the values. The resulting collection will preserve the original collection's keys:

```typescript
const intersect = collect(['Desk', 'Sofa', 'Chair']).intersectUsing(['desk', 'chair', 'bookcase'], (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

intersect.all();
```

Returns `{ 0: 'Desk', 2: 'Chair' }`.

<a name="method-intersectAssoc"></a>
#### `intersectAssoc()` {.collection-method}

The `intersectAssoc` method compares the original collection against another collection or array, returning the key / value pairs that are present in all of the given collections:

```typescript
const intersect = collect({ color: 'red', size: 'M', material: 'cotton' }).intersectAssoc({ color: 'blue', size: 'M', material: 'polyester' });

intersect.all();
```

Returns `{ size: 'M' }`.

<a name="method-intersectassocusing"></a>
#### `intersectAssocUsing()` {.collection-method}

The `intersectAssocUsing` method compares the original collection against another collection or array, returning the key / value pairs that are present in both, using a custom comparison callback to determine equality for both keys and values:

```typescript
const intersect = collect({ color: 'red', Size: 'M', material: 'cotton' }).intersectAssocUsing({ Color: 'blue', size: 'M', Material: 'polyester' }, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

intersect.all();
```

Returns `{ Size: 'M' }`.

<a name="method-intersectbykeys"></a>
#### `intersectByKeys()` {.collection-method}

The `intersectByKeys` method removes any keys and their corresponding values from the original collection that are not present in the given array or collection:

```typescript
const intersect = collect({ serial: 'UX301', type: 'screen', year: 2009 }).intersectByKeys({ reference: 'UX404', type: 'tab', year: 2011 });

intersect.all();
```

Returns `{ type: 'screen', year: 2009 }`.

<a name="method-isempty"></a>
#### `isEmpty()` {.collection-method}

The `isEmpty` method returns `true` if the collection is empty; otherwise, `false` is returned:

```typescript
collect([]).isEmpty();
```

Returns `true`.

<a name="method-isnotempty"></a>
#### `isNotEmpty()` {.collection-method}

The `isNotEmpty` method returns `true` if the collection is not empty; otherwise, `false` is returned:

```typescript
collect([]).isNotEmpty();
```

Returns `false`.

<a name="method-join"></a>
#### `join()` {.collection-method}

The `join` method joins the collection's values with a string. Using this method's second argument, you may also specify how the final element should be appended to the string:

```typescript
collect(['a', 'b', 'c']).join(', ');

collect(['a', 'b', 'c']).join(', ', ', and ');

collect(['a', 'b']).join(', ', ' and ');

collect(['a']).join(', ', ' and ');

collect([]).join(', ', ' and ');
```

Returns `'a, b, c'`, `'a, b, and c'`, `'a and b'`, `'a'`, and `''` respectively.

<a name="method-keyby"></a>
#### `keyBy()` {.collection-method}

The `keyBy` method keys the collection by the given key. If multiple items have the same key, only the last one will appear in the new collection:

```typescript
const keyed = collect([
    { product_id: 'prod-100', name: 'Desk' },
    { product_id: 'prod-200', name: 'Chair' }
]).keyBy('product_id');

keyed.all();
```

Returns an object keyed by `product_id` with values `{ product_id: 'prod-100', name: 'Desk' }` and `{ product_id: 'prod-200', name: 'Chair' }`. You may also pass a callback to the method. The callback should return the value to key the collection by:

```typescript
collect([
    { product_id: 'prod-100', name: 'Desk' },
    { product_id: 'prod-200', name: 'Chair' }
]).keyBy((item, key) => item.product_id.toUpperCase()).all();
```

Returns an object keyed by `'PROD-100'` and `'PROD-200'`.

<a name="method-keys"></a>
#### `keys()` {.collection-method}

The `keys` method returns all of the collection's keys:

```typescript
const keys = collect({
    'prod-100': { product_id: 'prod-100', name: 'Desk' },
    'prod-200': { product_id: 'prod-200', name: 'Chair' }
}).keys();

keys.all();
```

Returns `['prod-100', 'prod-200']`.

<a name="method-last"></a>
#### `last()` {.collection-method}

The `last` method returns the last element in the collection that passes a given truth test:

```typescript
collect([1, 2, 3, 4]).last((value, key) => value < 3);
```

Returns `2`. You may also call the `last` method with no arguments to get the last element in the collection. If the collection is empty, `null` is returned:

```typescript
collect([1, 2, 3, 4]).last();
```

Returns `4`.

<a name="method-lazy"></a>
#### `lazy()` {.collection-method}

The `lazy` method returns a new [LazyCollection](#lazy-collections) instance from the underlying array of items:

```typescript
const lazyCollection = collect([1, 2, 3, 4]).lazy();

lazyCollection.all();
```

Returns a `LazyCollection` instance, and `all()` returns `[1, 2, 3, 4]`. This is especially useful when you need to perform transformations on a huge `Collection` that contains many items:

```typescript
const count = hugeCollection
    .lazy()
    .where('country', 'FR')
    .where('balance', '>', '100')
    .count();
```

By converting the collection to a `LazyCollection`, we avoid having to allocate a ton of additional memory. Though the original collection still keeps _its_ values in memory, the subsequent filters will not. Therefore, virtually no additional memory will be allocated when filtering the collection's results.

<a name="method-macro"></a>
#### `macro()` {.collection-method}

The static `macro` method allows you to add methods to the `Collection` class at run time. Refer to the documentation on [extending collections](#extending-collections) for more information.

<a name="method-make"></a>
#### `make()` {.collection-method}

The static `make` method creates a new collection instance. See the [Creating Collections](#creating-collections) section.

```typescript
const collection = Collection.make([1, 2, 3]);
```

<a name="method-map"></a>
#### `map()` {.collection-method}

The `map` method iterates through the collection and passes each value to the given callback. The callback is free to modify the item and return it, thus forming a new collection of modified items:

```typescript
const multiplied = collect([1, 2, 3, 4, 5]).map((item, key) => item * 2);

multiplied.all();
```

Returns `[2, 4, 6, 8, 10]`.

> [!WARNING]
> Like most other collection methods, `map` returns a new collection instance; it does not modify the collection it is called on. If you want to transform the original collection, use the [transform](#transform) method.

<a name="method-mapinto"></a>
#### `mapInto()` {.collection-method}

The `mapInto()` method iterates over the collection, creating a new instance of the given class by passing the value into the constructor:

```typescript
class Currency {
    constructor(public code: string) {}
}

const currencies = collect(['USD', 'EUR', 'GBP']).mapInto(Currency);

currencies.all();
```

Returns an array of `Currency` instances.

<a name="method-mapspread"></a>
#### `mapSpread()` {.collection-method}

The `mapSpread` method iterates over the collection's items, passing each nested item value into the given closure. The closure is free to modify the item and return it, thus forming a new collection of modified items:

```typescript
const sequence = collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    .chunk(2)
    .mapSpread((even, odd) => even + odd);

sequence.all();
```

Returns `[1, 5, 9, 13, 17]`.

<a name="method-maptodictionary"></a>
#### `mapToDictionary()` {.collection-method}

The `mapToDictionary` method groups the collection's items by the given closure. The closure should return a tuple containing a single key / value pair. Unlike `mapToGroups`, this method returns plain arrays instead of Collection instances:

```typescript
const groups = collect([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'A' },
]).mapToDictionary((item) => [item.name, item.id]);

groups.all();
```

Returns `{ A: [1, 3], B: [2] }`.

> [!NOTE]
> The `mapToDictionary` method returns a collection of arrays, while `mapToGroups` returns a collection of `Collection` instances. Use `mapToDictionary` when you need plain arrays for each group.

<a name="method-maptogroups"></a>
#### `mapToGroups()` {.collection-method}

The `mapToGroups` method groups the collection's items by the given closure. The closure should return an associative array containing a single key / value pair, thus forming a new collection of grouped values:

```typescript
const grouped = collect([
    { name: 'John Doe', department: 'Sales' },
    { name: 'Jane Doe', department: 'Sales' },
    { name: 'Johnny Doe', department: 'Marketing' }
]).mapToGroups((item, key) => ({ [item.department]: item.name }));

grouped.all();

grouped.get('Sales').all();
```

Returns `{ Sales: ['John Doe', 'Jane Doe'], Marketing: ['Johnny Doe'] }`. The `get('Sales')` returns a Collection containing `['John Doe', 'Jane Doe']`.

<a name="method-mapwithkeys"></a>
#### `mapWithKeys()` {.collection-method}

The `mapWithKeys` method iterates through the collection and passes each value to the given callback. The callback should return an associative array containing a single key / value pair:

```typescript
const keyed = collect([
    { name: 'John', department: 'Sales', email: 'john@example.com' },
    { name: 'Jane', department: 'Marketing', email: 'jane@example.com' }
]).mapWithKeys((item, key) => ({ [item.email]: item.name }));

keyed.all();
```

Returns `{ 'john@example.com': 'John', 'jane@example.com': 'Jane' }`.

<a name="method-max"></a>
#### `max()` {.collection-method}

The `max` method returns the maximum value of a given key:

```typescript
const max = collect([
    { foo: 10 },
    { foo: 20 }
]).max('foo');

const max2 = collect([1, 2, 3, 4, 5]).max();
```

The first example returns `20`, the second returns `5`.

<a name="method-median"></a>
#### `median()` {.collection-method}

The `median` method returns the [median value](https://en.wikipedia.org/wiki/Median) of a given key:

```typescript
const median = collect([
    { foo: 10 },
    { foo: 10 },
    { foo: 20 },
    { foo: 40 }
]).median('foo');

const median2 = collect([1, 1, 2, 4]).median();
```

The first example returns `15`, the second returns `1.5`.

<a name="method-merge"></a>
#### `merge()` {.collection-method}

The `merge` method merges the given array or collection with the original collection. If a string key in the given items matches a string key in the original collection, the given item's value will overwrite the value in the original collection:

```typescript
const merged = collect({ product_id: 1, price: 100 }).merge({ price: 200, discount: false });

merged.all();
```

Returns `{ product_id: 1, price: 200, discount: false }`. If the given item's keys are numeric, the values will be appended to the end of the collection:

```typescript
const merged = collect(['Desk', 'Chair']).merge(['Bookcase', 'Door']);

merged.all();
```

Returns `['Desk', 'Chair', 'Bookcase', 'Door']`.

<a name="method-mergerecursive"></a>
#### `mergeRecursive()` {.collection-method}

The `mergeRecursive` method merges the given array or collection recursively with the original collection. If a string key in the given items matches a string key in the original collection, then the values for these keys are merged together into an array, and this is done recursively:

```typescript
const merged = collect({ product_id: 1, price: 100 }).mergeRecursive({ product_id: 2, price: 200, discount: false });

merged.all();
```

Returns `{ product_id: [1, 2], price: [100, 200], discount: false }`.

<a name="method-min"></a>
#### `min()` {.collection-method}

The `min` method returns the minimum value of a given key:

```typescript
const min = collect([
    { foo: 10 },
    { foo: 20 }
]).min('foo');

const min2 = collect([1, 2, 3, 4, 5]).min();
```

The first example returns `10`, the second returns `1`.

<a name="method-mode"></a>
#### `mode()` {.collection-method}

The `mode` method returns the [mode value](https://en.wikipedia.org/wiki/Mode_(statistics)) of a given key:

```typescript
const mode = collect([
    { foo: 10 },
    { foo: 10 },
    { foo: 20 },
    { foo: 40 }
]).mode('foo');

const mode2 = collect([1, 1, 2, 4]).mode();

const mode3 = collect([1, 1, 2, 2]).mode();
```

Returns `[10]`, `[1]`, and `[1, 2]` respectively. When there are multiple modes, all are returned.

<a name="method-multiply"></a>
#### `multiply()` {.collection-method}

The `multiply` method creates the specified number of copies of all items in the collection:

```typescript
const users = collect([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' }
]).multiply(3);
```

Returns an array with the two user objects repeated 3 times (6 total items).

<a name="method-nth"></a>
#### `nth()` {.collection-method}

The `nth` method creates a new collection consisting of every n-th element:

```typescript
collect(['a', 'b', 'c', 'd', 'e', 'f']).nth(4);
```

Returns `['a', 'e']`. You may optionally pass a starting offset as the second argument:

```typescript
collect(['a', 'b', 'c', 'd', 'e', 'f']).nth(4, 1);
```

Returns `['b', 'f']`.

<a name="method-only"></a>
#### `only()` {.collection-method}

The `only` method returns the items in the collection with the specified keys:

```typescript
const filtered = collect({ product_id: 1, name: 'Desk', price: 100, discount: false }).only(['product_id', 'name']);

filtered.all();
```

Returns `{ product_id: 1, name: 'Desk' }`. For the inverse of `only`, see the [except](#except) method.

<a name="method-pad"></a>
#### `pad()` {.collection-method}

The `pad` method will fill the array with the given value until the array reaches the specified size.

To pad to the left, you should specify a negative size. No padding will take place if the absolute value of the given size is less than or equal to the length of the array:

```typescript
collect(['A', 'B', 'C'])
    .pad(5, 0)
    .all();

collect(['A', 'B', 'C'])
    .pad(-5, 0)
    .all();
```

Returns `['A', 'B', 'C', 0, 0]` and `[0, 0, 'A', 'B', 'C']` respectively.

<a name="method-partition"></a>
#### `partition()` {.collection-method}

The `partition` method may be combined with array destructuring to separate elements that pass a given truth test from those that do not:

```typescript
const [underThree, equalOrAboveThree] = collect([1, 2, 3, 4, 5, 6]).partition((i) => i < 3);

underThree.all();

equalOrAboveThree.all();
```

`underThree` contains `[1, 2]`, and `equalOrAboveThree` contains `[3, 4, 5, 6]`.

<a name="method-percentage"></a>
#### `percentage()` {.collection-method}

The `percentage` method may be used to quickly determine the percentage of items in the collection that pass a given truth test:

```typescript
const percentage = collect([1, 1, 2, 2, 2, 3]).percentage((value) => value === 1);
```

Returns `33.33`. By default, the percentage will be rounded to two decimal places. However, you may customize this behavior by providing a second argument to the method:

```typescript
const percentage = collection.percentage((value) => value === 1, 3);
```

Returns `33.333`.

<a name="method-pipe"></a>
#### `pipe()` {.collection-method}

The `pipe` method passes the collection to the given closure and returns the result of the executed closure:

```typescript
const piped = collect([1, 2, 3]).pipe((collection) => collection.sum());
```

Returns `6`.

<a name="method-pipeinto"></a>
#### `pipeInto()` {.collection-method}

The `pipeInto` method creates a new instance of the given class and passes the collection into the constructor:

```typescript
class ResourceCollection {
    collection: Collection<number>;

    constructor(collection: Collection<number>) {
        this.collection = collection;
    }
}

const collection = collect([1, 2, 3]);
const resource = collection.pipeInto(ResourceCollection);

resource.collection.all();
```

Returns `[1, 2, 3]`.

<a name="method-pipethrough"></a>
#### `pipeThrough()` {.collection-method}

The `pipeThrough` method passes the collection to the given array of closures and returns the result of the executed closures:

```typescript
const result = collect([1, 2, 3]).pipeThrough([
    (collection) => collection.merge([4, 5]),
    (collection) => collection.sum(),
]);
```

Returns `15`.

<a name="method-pluck"></a>
#### `pluck()` {.collection-method}

The `pluck` method retrieves all of the values for a given key:

```typescript
const plucked = collect([
    { product_id: 'prod-100', name: 'Desk' },
    { product_id: 'prod-200', name: 'Chair' }
]).pluck('name');

plucked.all();
```

Returns `['Desk', 'Chair']`. You may also specify how you wish the resulting collection to be keyed:

```typescript
const plucked = collection.pluck('name', 'product_id');

plucked.all();
```

Returns `{ 'prod-100': 'Desk', 'prod-200': 'Chair' }`. The `pluck` method also supports retrieving nested values using "dot" notation:

```typescript
const plucked = collect([
    {
        name: 'Laracon',
        speakers: {
            first_day: ['Rosa', 'Judith'],
        },
    },
    {
        name: 'VueConf',
        speakers: {
            first_day: ['Abigail', 'Joey'],
        },
    }
]).pluck('speakers.first_day');

plucked.all();
```

Returns `[['Rosa', 'Judith'], ['Abigail', 'Joey']]`. If duplicate keys exist, the last matching element will be inserted into the plucked collection:

```typescript
const plucked = collect([
    { brand: 'Tesla', color: 'red' },
    { brand: 'Pagani', color: 'white' },
    { brand: 'Tesla', color: 'black' },
    { brand: 'Pagani', color: 'orange' }
]).pluck('color', 'brand');

plucked.all();
```

Returns `{ Tesla: 'black', Pagani: 'orange' }`.

<a name="method-pop"></a>
#### `pop()` {.collection-method}

The `pop` method removes and returns the last item from the collection. If the collection is empty, `null` will be returned:

```typescript
const collection = collect([1, 2, 3, 4, 5]);

collection.pop();

collection.all();
```

Returns `5`, and the collection becomes `[1, 2, 3, 4]`. You may pass an integer to the `pop` method to remove and return multiple items from the end of a collection:

```typescript
const collection = collect([1, 2, 3, 4, 5]);

collection.pop(3);

collection.all();
```

Returns a collection containing `[5, 4, 3]`, and the original collection becomes `[1, 2]`.

<a name="method-prepend"></a>
#### `prepend()` {.collection-method}

The `prepend` method adds an item to the beginning of the collection:

```typescript
const collection = collect([1, 2, 3, 4, 5]);

collection.prepend(0);

collection.all();
```

Returns `[0, 1, 2, 3, 4, 5]`. You may also pass a second argument to specify the key of the prepended item:

```typescript
const collection = collect({ one: 1, two: 2 });

collection.prepend(0, 'zero');

collection.all();
```

Returns `{ zero: 0, one: 1, two: 2 }`.

<a name="method-pull"></a>
#### `pull()` {.collection-method}

The `pull` method removes and returns an item from the collection by its key:

```typescript
const collection = collect({ product_id: 'prod-100', name: 'Desk' });

collection.pull('name');

collection.all();
```

Returns `'Desk'`, and the collection becomes `{ product_id: 'prod-100' }`.

<a name="method-push"></a>
#### `push()` {.collection-method}

The `push` method appends an item to the end of the collection:

```typescript
const collection = collect([1, 2, 3, 4]);

collection.push(5);

collection.all();
```

Returns `[1, 2, 3, 4, 5]`. You may also provide multiple items to append to the end of the collection:

```typescript
const collection = collect([1, 2, 3, 4]);

collection.push(5, 6, 7);
 
collection.all();
```

Returns `[1, 2, 3, 4, 5, 6, 7]`.

<a name="method-put"></a>
#### `put()` {.collection-method}

The `put` method sets the given key and value in the collection:

```typescript
const collection = collect({ product_id: 1, name: 'Desk' });

collection.put('price', 100);

collection.all();
```

Returns `{ product_id: 1, name: 'Desk', price: 100 }`.

<a name="method-random"></a>
#### `random()` {.collection-method}

The `random` method returns a random item from the collection:

```typescript
collect([1, 2, 3, 4, 5]).random();
```

Returns a random item (e.g., `4`). You may pass an integer to `random` to specify how many items you would like to randomly retrieve. A collection of items is always returned when explicitly passing the number of items you wish to receive:

```typescript
const random = collect([1, 2, 3, 4, 5]).random(3);

random.all();
```

Returns an array of 3 random items. If the collection instance has fewer items than requested, the `random` method will throw an `InvalidArgumentException`.

The `random` method also accepts a closure, which will receive the current collection instance:

```typescript
const random = collect([1, 2, 3, 4, 5]).random((items) => Math.min(10, items.count()));

random.all();
```

In this case, returns all 5 items since `Math.min(10, 5)` is 5.

<a name="method-range"></a>
#### `range()` {.collection-method}

The `range` method returns a collection containing integers between the specified range:

```typescript
collect()
    .range(3, 6)
    .all();
```

Returns `[3, 4, 5, 6]`.

<a name="method-reduce"></a>
#### `reduce()` {.collection-method}

The `reduce` method reduces the collection to a single value, passing the result of each iteration into the subsequent iteration:

```typescript
const total = collect([1, 2, 3]).reduce((carry, item) => carry + item);
```

Returns `6`. The value for `carry` on the first iteration is `null`; however, you may specify its initial value by passing a second argument to `reduce`:

```typescript
collect([1, 2, 3]).reduce((carry, item) => carry + item, 4);
```

Returns `10`. The `reduce` method also passes array keys to the given callback:

```typescript
const ratio = { usd: 1, gbp: 1.37, eur: 1.22 };

collect({ usd: 1400, gbp: 1200, eur: 1000 }).reduce((carry, value, key) => {
    return carry + (value * ratio[key]);
}, 0);
```

Returns `4264`.

<a name="method-reduce-spread"></a>
#### `reduceSpread()` {.collection-method}

The `reduceSpread` method reduces the collection to an array of values, passing the results of each iteration into the subsequent iteration. This method is similar to the `reduce` method; however, it can accept multiple initial values:

```typescript
const [creditsRemaining, batch] = Image.where('status', 'unprocessed')
    .get()
    .reduceSpread((creditsRemaining, batch, image) => {
        if (creditsRemaining >= image.creditsRequired()) {
            batch.push(image);

            creditsRemaining -= image.creditsRequired();
        }

        return [creditsRemaining, batch];
    }, creditsAvailable, collect());
```

<a name="method-reject"></a>
#### `reject()` {.collection-method}

The `reject` method filters the collection using the given closure. The closure should return `true` if the item should be removed from the resulting collection:

```typescript
const filtered = collect([1, 2, 3, 4]).reject((value, key) => value > 2);

filtered.all();
```

Returns `[1, 2]`. For the inverse of the `reject` method, see the [filter](#filter) method.

<a name="method-replace"></a>
#### `replace()` {.collection-method}

The `replace` method behaves similarly to `merge`; however, in addition to overwriting matching items that have string keys, the `replace` method will also overwrite items in the collection that have matching numeric keys:

```typescript
const replaced = collect(['Taylor', 'Abigail', 'James']).replace({ 1: 'Victoria', 3: 'Finn' });

replaced.all();
```

Returns `['Taylor', 'Victoria', 'James', 'Finn']`.

<a name="method-replacerecursive"></a>
#### `replaceRecursive()` {.collection-method}

The `replaceRecursive` method behaves similarly to `replace`, but it will recur into arrays and apply the same replacement process to the inner values:

```typescript
const replaced = collect([
    'Taylor', 'Abigail', [
        'James', 'Victoria', 'Finn'
    ]
]).replaceRecursive({ 0: 'Charlie', 2: { 1: 'King' } });

replaced.all();
```

Returns `['Charlie', 'Abigail', ['James', 'King', 'Finn']]`.

<a name="method-reverse"></a>
#### `reverse()` {.collection-method}

The `reverse` method reverses the order of the collection's items, preserving the original keys:

```typescript
const reversed = collect(['a', 'b', 'c', 'd', 'e']).reverse();

reversed.all();
```

Returns `{ 4: 'e', 3: 'd', 2: 'c', 1: 'b', 0: 'a' }`.

<a name="method-search"></a>
#### `search()` {.collection-method}

The `search` method searches the collection for the given value and returns its key if found. If the item is not found, `false` is returned:

```typescript
collect([2, 4, 6, 8]).search(4);
```

Returns `1`. The search is done using a "loose" comparison, meaning a string with an integer value will be considered equal to an integer of the same value. To use "strict" comparison, pass `true` as the second argument to the method:

```typescript
collect([2, 4, 6, 8]).search('4', true);
```

Returns `false`. Alternatively, you may provide your own closure to search for the first item that passes a given truth test:

```typescript
collect([2, 4, 6, 8]).search((item, key) => item > 5);
```

Returns `2`.

<a name="method-select"></a>
#### `select()` {.collection-method}

The `select` method selects the given keys from the collection, similar to an SQL `SELECT` statement:

```typescript
const users = collect([
    { name: 'Taylor Otwell', role: 'Developer', status: 'active' },
    { name: 'Victoria Faith', role: 'Researcher', status: 'active' }
]);

users.select(['name', 'role']);
```

Returns an array with only the `name` and `role` properties for each user.

<a name="method-shift"></a>
#### `shift()` {.collection-method}

The `shift` method removes and returns the first item from the collection:

```typescript
const collection = collect([1, 2, 3, 4, 5]);

collection.shift();

collection.all();
```

Returns `1`, and the collection becomes `[2, 3, 4, 5]`. You may pass an integer to the `shift` method to remove and return multiple items from the beginning of a collection:

```typescript
const collection = collect([1, 2, 3, 4, 5]);

collection.shift(3);

collection.all();
```

Returns a collection containing `[1, 2, 3]`, and the original collection becomes `[4, 5]`.

<a name="method-shuffle"></a>
#### `shuffle()` {.collection-method}

The `shuffle` method randomly shuffles the items in the collection:

```typescript
const shuffled = collect([1, 2, 3, 4, 5]).shuffle();

shuffled.all();
```

Returns the items in a random order.

<a name="method-skip"></a>
#### `skip()` {.collection-method}

The `skip` method returns a new collection, with the given number of elements removed from the beginning of the collection:

```typescript
const skipped = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).skip(4);

skipped.all();
```

Returns `[5, 6, 7, 8, 9, 10]`.

<a name="method-skipuntil"></a>
#### `skipUntil()` {.collection-method}

The `skipUntil` method skips over items from the collection while the given callback returns `false`. Once the callback returns `true` all of the remaining items in the collection will be returned as a new collection:

```typescript
const subset = collect([1, 2, 3, 4]).skipUntil((item) => item >= 3);

subset.all();
```

Returns `[3, 4]`. You may also pass a simple value to the `skipUntil` method to skip all items until the given value is found:

```typescript
const subset = collect([1, 2, 3, 4]).skipUntil(3);

subset.all();
```

Returns `[3, 4]`.

> [!WARNING]
> If the given value is not found or the callback never returns `true`, the `skipUntil` method will return an empty collection.

<a name="method-skipwhile"></a>
#### `skipWhile()` {.collection-method}

The `skipWhile` method skips over items from the collection while the given callback returns `true`. Once the callback returns `false` all of the remaining items in the collection will be returned as a new collection:

```typescript
const subset = collect([1, 2, 3, 4]).skipWhile((item) => item <= 3);

subset.all();
```

Returns `[4]`.

> [!WARNING]
> If the callback never returns `false`, the `skipWhile` method will return an empty collection.

<a name="method-slice"></a>
#### `slice()` {.collection-method}

The `slice` method returns a slice of the collection starting at the given index:

```typescript
const slice = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(4);

slice.all();
```

Returns `[5, 6, 7, 8, 9, 10]`. If you would like to limit the size of the returned slice, pass the desired size as the second argument to the method:

```typescript
const slice = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(4, 2);

slice.all();
```

Returns `[5, 6]`. The returned slice will preserve keys by default. If you do not wish to preserve the original keys, you can use the [values](#values) method to reindex them.

<a name="method-sliding"></a>
#### `sliding()` {.collection-method}

The `sliding` method returns a new collection of chunks representing a "sliding window" view of the items in the collection:

```typescript
const chunks = collect([1, 2, 3, 4, 5]).sliding(2);

chunks.toArray();
```

Returns `[[1, 2], [2, 3], [3, 4], [4, 5]]`. This is especially useful in conjunction with the [eachSpread](#eachspread) method:

```typescript
transactions.sliding(2).eachSpread((previous, current) => {
    current.total = previous.total + current.amount;
});
```

You may optionally pass a second "step" value, which determines the distance between the first item of every chunk:

```typescript
const chunks = collect([1, 2, 3, 4, 5]).sliding(3, 2);

chunks.toArray();
```

Returns `[[1, 2, 3], [3, 4, 5]]`.

<a name="method-sole"></a>
#### `sole()` {.collection-method}

The `sole` method returns the first element in the collection that passes a given truth test, but only if the truth test matches exactly one element:

```typescript
collect([1, 2, 3, 4]).sole((value, key) => value === 2);
```

Returns `2`. You may also pass a key / value pair to the `sole` method, which will return the first element in the collection that matches the given pair, but only if it exactly one element matches:

```typescript
collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 100 }
]).sole('product', 'Chair');
```

Returns `{ product: 'Chair', price: 100 }`. Alternatively, you may also call the `sole` method with no argument to get the first element in the collection if there is only one element:

```typescript
collect([{ product: 'Desk', price: 200 }]).sole();
```

Returns `{ product: 'Desk', price: 200 }`. If there are no elements in the collection that should be returned by the `sole` method, an `ItemNotFoundException` exception will be thrown. If there is more than one element that should be returned, a `MultipleItemsFoundException` will be thrown.

<a name="method-some"></a>
#### `some()` {.collection-method}

Alias for the [contains](#contains) method.

<a name="method-sort"></a>
#### `sort()` {.collection-method}

The `sort` method sorts the collection. The sorted collection keeps the original array keys, so in the following example we will use the [values](#values) method to reset the keys to consecutively numbered indexes:

```typescript
const sorted = collect([5, 3, 1, 2, 4]).sort();

sorted.values().all();
```

Returns `[1, 2, 3, 4, 5]`. If your sorting needs are more advanced, you may pass a callback to `sort` with your own algorithm. The callback should return a negative number if the first argument should come before the second, a positive number if the second should come before the first, or zero if they are equal.

> [!NOTE]
> If you need to sort a collection of nested arrays or objects, see the [sortBy](#sortby) and [sortByDesc](#sortbydesc) methods.

<a name="method-sortby"></a>
#### `sortBy()` {.collection-method}

The `sortBy` method sorts the collection by the given key. The sorted collection keeps the original array keys, so in the following example we will use the [values](#values) method to reset the keys to consecutively numbered indexes:

```typescript
const sorted = collect([
    { name: 'Desk', price: 200 },
    { name: 'Chair', price: 100 },
    { name: 'Bookcase', price: 150 }
]).sortBy('price');

sorted.values().all();

/*
    [
        { name: 'Chair', price: 100 },
        { name: 'Bookcase', price: 150 },
        { name: 'Desk', price: 200 }
    ]
*/
```

You may also pass your own closure to determine how to sort the collection's values:

```typescript
const sorted = collect([
    { name: 'Desk', colors: ['Black', 'Mahogany'] },
    { name: 'Chair', colors: ['Black'] },
    { name: 'Bookcase', colors: ['Red', 'Beige', 'Brown'] }
]).sortBy((product, key) => product.colors.length);

sorted.values().all();

/*
    [
        { name: 'Chair', colors: ['Black'] },
        { name: 'Desk', colors: ['Black', 'Mahogany'] },
        { name: 'Bookcase', colors: ['Red', 'Beige', 'Brown'] }
    ]
*/
```

If you would like to sort your collection by multiple attributes, you may pass an array of sort operations to the `sortBy` method. Each sort operation should be an array consisting of the attribute that you wish to sort by and the direction of the desired sort:

```typescript
const sorted = collect([
    { name: 'Taylor Otwell', age: 34 },
    { name: 'Abigail Otwell', age: 30 },
    { name: 'Taylor Otwell', age: 36 },
    { name: 'Abigail Otwell', age: 32 }
]).sortBy([
    ['name', 'asc'],
    ['age', 'desc'],
]);

sorted.values().all();

/*
    [
        { name: 'Abigail Otwell', age: 32 },
        { name: 'Abigail Otwell', age: 30 },
        { name: 'Taylor Otwell', age: 36 },
        { name: 'Taylor Otwell', age: 34 }
    ]
*/
```

When sorting a collection by multiple attributes, you may also provide closures that define each sort operation:

```typescript
const sorted = collect([
    { name: 'Taylor Otwell', age: 34 },
    { name: 'Abigail Otwell', age: 30 },
    { name: 'Taylor Otwell', age: 36 },
    { name: 'Abigail Otwell', age: 32 }
]).sortBy([
    (a, b) => a.name.localeCompare(b.name),
    (a, b) => b.age - a.age
]);

sorted.values().all();

/*
    [
        { name: 'Abigail Otwell', age: 32 },
        { name: 'Abigail Otwell', age: 30 },
        { name: 'Taylor Otwell', age: 36 },
        { name: 'Taylor Otwell', age: 34 }
    ]
*/
```

<a name="method-sortbydesc"></a>
#### `sortByDesc()` {.collection-method}

This method has the same signature as the [sortBy](#sortby) method, but will sort the collection in the opposite order.

<a name="method-sortdesc"></a>
#### `sortDesc()` {.collection-method}

This method will sort the collection in the opposite order as the [sort](#sort) method:

```typescript
const sorted = collect([5, 3, 1, 2, 4]).sortDesc();

sorted.values().all();
```

Returns `[5, 4, 3, 2, 1]`. Unlike `sort`, you may not pass a closure to `sortDesc`. Instead, you should use the [sort](#sort) method and invert your comparison.

<a name="method-sortkeys"></a>
#### `sortKeys()` {.collection-method}

The `sortKeys` method sorts the collection by the keys of the underlying associative array:

```typescript
const sorted = collect({ id: 22345, first: 'John', last: 'Doe' }).sortKeys();

sorted.all();

/*
    { first: 'John', id: 22345, last: 'Doe' }
*/
```

<a name="method-sortkeysdesc"></a>
#### `sortKeysDesc()` {.collection-method}

This method has the same signature as the [sortKeys](#sortkeys) method, but will sort the collection in the opposite order.

<a name="method-sortkeysusing"></a>
#### `sortKeysUsing()` {.collection-method}

The `sortKeysUsing` method sorts the collection by the keys of the underlying associative array using a callback:

```typescript
const sorted = collect({ ID: 22345, first: 'John', last: 'Doe' }).sortKeysUsing((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

sorted.all();

/*
    { first: 'John', ID: 22345, last: 'Doe' }
*/
```

The callback must be a comparison function that returns an integer less than, equal to, or greater than zero.

<a name="method-splice"></a>
#### `splice()` {.collection-method}

The `splice` method removes and returns a slice of items starting at the specified index:

```typescript
const collection = collect([1, 2, 3, 4, 5]);
const chunk = collection.splice(2);

chunk.all();

collection.all();
```

Returns `[3, 4, 5]`, and the collection becomes `[1, 2]`. You may pass a second argument to limit the size of the resulting collection:

```typescript
const collection = collect([1, 2, 3, 4, 5]);
const chunk = collection.splice(2, 1);

chunk.all();

collection.all();
```

Returns `[3]`, and the collection becomes `[1, 2, 4, 5]`. In addition, you may pass a third argument containing the new items to replace the items removed from the collection:

```typescript
const collection = collect([1, 2, 3, 4, 5]);
const chunk = collection.splice(2, 1, [10, 11]);

chunk.all();

collection.all();
```

Returns `[3]`, and the collection becomes `[1, 2, 10, 11, 4, 5]`.

<a name="method-split"></a>
#### `split()` {.collection-method}

The `split` method breaks a collection into the given number of groups:

```typescript
const groups = collect([1, 2, 3, 4, 5]).split(3);

groups.all();
```

Returns `[[1, 2], [3, 4], [5]]`.

<a name="method-splitin"></a>
#### `splitIn()` {.collection-method}

The `splitIn` method breaks a collection into the given number of groups, filling non-terminal groups completely before allocating the remainder to the final group:

```typescript
const groups = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).splitIn(3);

groups.all();
```

Returns `[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]`.

<a name="method-sum"></a>
#### `sum()` {.collection-method}

The `sum` method returns the sum of all items in the collection:

```typescript
collect([1, 2, 3, 4, 5]).sum();
```

Returns `15`. If the collection contains nested arrays or objects, you should pass a key that will be used to determine which values to sum:

```typescript
collect([
    { name: 'JavaScript: The Good Parts', pages: 176 },
    { name: 'JavaScript: The Definitive Guide', pages: 1096 }
]).sum('pages');
```

Returns `1272`. In addition, you may pass your own closure to determine which values of the collection to sum:

```typescript
collect([
    { name: 'Chair', colors: ['Black'] },
    { name: 'Desk', colors: ['Black', 'Mahogany'] },
    { name: 'Bookcase', colors: ['Red', 'Beige', 'Brown'] }
]).sum((product) => product.colors.length);
```

Returns `6`.

<a name="method-take"></a>
#### `take()` {.collection-method}

The `take` method returns a new collection with the specified number of items:

```typescript
const chunk = collect([0, 1, 2, 3, 4, 5]).take(3);

chunk.all();
```

Returns `[0, 1, 2]`. You may also pass a negative integer to take the specified number of items from the end of the collection:

```typescript
const chunk = collect([0, 1, 2, 3, 4, 5]).take(-2);

chunk.all();
```

Returns `[4, 5]`.

<a name="method-takeuntil"></a>
#### `takeUntil()` {.collection-method}

The `takeUntil` method returns items in the collection until the given callback returns `true`:

```typescript
const subset = collect([1, 2, 3, 4]).takeUntil((item) => item >= 3);

subset.all();
```

Returns `[1, 2]`. You may also pass a simple value to the `takeUntil` method to get the items until the given value is found:

```typescript
const subset = collect([1, 2, 3, 4]).takeUntil(3);

subset.all();
```

Returns `[1, 2]`.

> [!WARNING]
> If the given value is not found or the callback never returns `true`, the `takeUntil` method will return all items in the collection.

<a name="method-takewhile"></a>
#### `takeWhile()` {.collection-method}

The `takeWhile` method returns items in the collection until the given callback returns `false`:

```typescript
const subset = collect([1, 2, 3, 4]).takeWhile((item) => item < 3);

subset.all();
```

Returns `[1, 2]`.

> [!WARNING]
> If the callback never returns `false`, the `takeWhile` method will return all items in the collection.

<a name="method-tap"></a>
#### `tap()` {.collection-method}

The `tap` method passes the collection to the given callback, allowing you to "tap" into the collection at a specific point and do something with the items while not affecting the collection itself. The collection is then returned by the `tap` method:

```typescript
collect([2, 4, 3, 1, 5])
    .sort()
    .tap((collection) => {
        console.log('Values after sorting', collection.values().all());
    })
    .shift();
```

Returns `1`.

<a name="method-times"></a>
#### `times()` {.collection-method}

The static `times` method creates a new collection by invoking the given closure a specified number of times:

```typescript
const collection = Collection.times(10, (number) => number * 9);

collection.all();
```

Returns `[9, 18, 27, 36, 45, 54, 63, 72, 81, 90]`.

<a name="method-toarray"></a>
#### `toArray()` {.collection-method}

The `toArray` method converts the collection into a plain JavaScript array. If the collection's values are objects, they will remain as objects in the array:

```typescript
collect({ name: 'Desk', price: 200 }).toArray();
```

Returns `{ name: 'Desk', price: 200 }`.

> [!WARNING]
> `toArray` also converts all of the collection's nested objects that are an instance of `Arrayable` to an array. If you want to get the raw array underlying the collection, use the [all](#all) method instead.

<a name="method-tojson"></a>
#### `toJson()` {.collection-method}

The `toJson` method converts the collection into a JSON serialized string:

```typescript
collect({ name: 'Desk', price: 200 }).toJson();
```

Returns `'{"name":"Desk","price":200}'`.

<a name="method-to-pretty-json"></a>
#### `toPrettyJson()` {.collection-method}

The `toPrettyJson` method converts the collection into a formatted JSON string using the `JSON_PRETTY_PRINT` option:

```typescript
collect({ name: 'Desk', price: 200 }).toPrettyJson();
```

<a name="method-transform"></a>
#### `transform()` {.collection-method}

The `transform` method iterates over the collection and calls the given callback with each item in the collection. The items in the collection will be replaced by the values returned by the callback:

```typescript
const collection = collect([1, 2, 3, 4, 5]);

collection.transform((item, key) => item * 2);

collection.all();
```

Returns `[2, 4, 6, 8, 10]`.

> [!WARNING]
> Unlike most other collection methods, `transform` modifies the collection itself. If you wish to create a new collection instead, use the [map](#map) method.

<a name="method-undot"></a>
#### `undot()` {.collection-method}

The `undot` method expands a single-dimensional collection that uses "dot" notation into a multi-dimensional collection:

```typescript
const person = collect({
    'name.first_name': 'Marie',
    'name.last_name': 'Valentine',
    'address.line_1': '2992 Eagle Drive',
    'address.line_2': '',
    'address.suburb': 'Detroit',
    'address.state': 'MI',
    'address.postcode': '48219'
});
const undotted = person.undot();

undotted.toArray();
```

Expands the dotted keys into a nested structure with `name` and `address` sub-objects.

<a name="method-union"></a>
#### `union()` {.collection-method}

The `union` method adds the given array to the collection. If the given array contains keys that are already in the original collection, the original collection's values will be preferred:

```typescript
const union = collect({ 1: ['a'], 2: ['b'] }).union({ 3: ['c'], 1: ['d'] });

union.all();
```

Returns `{ 1: ['a'], 2: ['b'], 3: ['c'] }`.

<a name="method-unique"></a>
#### `unique()` {.collection-method}

The `unique` method returns all of the unique items in the collection. The returned collection keeps the original array keys, so in the following example we will use the [values](#values) method to reset the keys to consecutively numbered indexes:

```typescript
const unique = collect([1, 1, 2, 2, 3, 4, 2]).unique();

unique.values().all();
```

Returns `[1, 2, 3, 4]`. When dealing with nested arrays or objects, you may specify the key used to determine uniqueness:

```typescript
const unique = collect([
    { name: 'iPhone 6', brand: 'Apple', type: 'phone' },
    { name: 'iPhone 5', brand: 'Apple', type: 'phone' },
    { name: 'Apple Watch', brand: 'Apple', type: 'watch' },
    { name: 'Galaxy S6', brand: 'Samsung', type: 'phone' },
    { name: 'Galaxy Gear', brand: 'Samsung', type: 'watch' }
]).unique('brand');

unique.values().all();

/*
    [
        { name: 'iPhone 6', brand: 'Apple', type: 'phone' },
        { name: 'Galaxy S6', brand: 'Samsung', type: 'phone' }
    ]
*/
```

Finally, you may also pass your own closure to the `unique` method to specify which value should determine an item's uniqueness:

```typescript
const unique = collection.unique((item) => item.brand + item.type);

unique.values().all();

/*
    [
        { name: 'iPhone 6', brand: 'Apple', type: 'phone' },
        { name: 'Apple Watch', brand: 'Apple', type: 'watch' },
        { name: 'Galaxy S6', brand: 'Samsung', type: 'phone' },
        { name: 'Galaxy Gear', brand: 'Samsung', type: 'watch' }
    ]
*/
```

The `unique` method uses "loose" comparisons when checking item values, meaning a string with an integer value will be considered equal to an integer of the same value. Use the [uniqueStrict](#uniquestrict) method to filter using "strict" comparisons.

<a name="method-uniquestrict"></a>
#### `uniqueStrict()` {.collection-method}

This method has the same signature as the [unique](#unique) method; however, all values are compared using "strict" comparisons.

<a name="method-unless"></a>
#### `unless()` {.collection-method}

The `unless` method will execute the given callback unless the first argument given to the method evaluates to `true`. The collection instance and the first argument given to the `unless` method will be provided to the closure:

```typescript
const collection = collect([1, 2, 3]);

collection.unless(true, (collection, value) => collection.push(4));

collection.unless(false, (collection, value) => collection.push(5));

collection.all();
```

Returns `[1, 2, 3, 5]`. A second callback may be passed to the `unless` method. The second callback will be executed when the first argument given to the `unless` method evaluates to `true`:

```typescript
const collection = collect([1, 2, 3]);

collection.unless(true, (collection, value) => collection.push(4), (collection, value) => collection.push(5));

collection.all();
```

Returns `[1, 2, 3, 5]`. For the inverse of `unless`, see the [when](#when) method.

<a name="method-unlessempty"></a>
#### `unlessEmpty()` {.collection-method}

Alias for the [whenNotEmpty](#whennotempty) method.

<a name="method-unlessnotempty"></a>
#### `unlessNotEmpty()` {.collection-method}

Alias for the [whenEmpty](#whenempty) method.

<a name="method-unwrap"></a>
#### `unwrap()` {.collection-method}

The static `unwrap` method returns the collection's underlying items from the given value when applicable:

```typescript
Collection.unwrap(collect('John Doe'));

Collection.unwrap(['John Doe']);

Collection.unwrap('John Doe');
```

Returns `['John Doe']`, `['John Doe']`, and `'John Doe'` respectively.

<a name="method-value"></a>
#### `value()` {.collection-method}

The `value` method retrieves a given value from the first element of the collection:

```typescript
collect([
    { product: 'Desk', price: 200 },
    { product: 'Speaker', price: 400 }
]).value('price');
```

Returns `200`.

<a name="method-values"></a>
#### `values()` {.collection-method}

The `values` method returns a new collection with the keys reset to consecutive integers:

```typescript
const values = collect({
    10: { product: 'Desk', price: 200 },
    11: { product: 'Desk', price: 200 }
}).values();

values.all();

/*
    [
        { product: 'Desk', price: 200 },
        { product: 'Desk', price: 200 }
    ]
*/
```

<a name="method-when"></a>
#### `when()` {.collection-method}

The `when` method will execute the given callback when the first argument given to the method evaluates to `true`. The collection instance and the first argument given to the `when` method will be provided to the closure:

```typescript
const collection = collect([1, 2, 3]);

collection.when(true, (collection, value) => collection.push(4));

collection.when(false, (collection, value) => collection.push(5));

collection.all();
```

Returns `[1, 2, 3, 4]`. A second callback may be passed to the `when` method. The second callback will be executed when the first argument given to the `when` method evaluates to `false`:

```typescript
const collection = collect([1, 2, 3]);

collection.when(false, (collection, value) => collection.push(4), (collection, value) => collection.push(5));

collection.all();
```

Returns `[1, 2, 3, 5]`. For the inverse of `when`, see the [unless](#unless) method.

<a name="method-whenempty"></a>
#### `whenEmpty()` {.collection-method}

The `whenEmpty` method will execute the given callback when the collection is empty:

```typescript
const collection = collect(['Michael', 'Tom']);

collection.whenEmpty((collection) => collection.push('Adam'));

collection.all();

const collection2 = collect();

collection2.whenEmpty((collection) => collection.push('Adam'));

collection2.all();
```

Returns `['Michael', 'Tom']` for the first collection and `['Adam']` for the second. A second closure may be passed to the `whenEmpty` method that will be executed when the collection is not empty:

```typescript
const collection = collect(['Michael', 'Tom']);

collection.whenEmpty((collection) => collection.push('Adam'), (collection) => collection.push('Taylor'));

collection.all();
```

Returns `['Michael', 'Tom', 'Taylor']`. For the inverse of `whenEmpty`, see the [whenNotEmpty](#whennotempty) method.

<a name="method-whennotempty"></a>
#### `whenNotEmpty()` {.collection-method}

The `whenNotEmpty` method will execute the given callback when the collection is not empty:

```typescript
const collection = collect(['Michael', 'Tom']);

collection.whenNotEmpty((collection) => collection.push('Adam'));

collection.all();

const collection2 = collect();

collection2.whenNotEmpty((collection) => collection.push('Adam'));

collection2.all();
```

Returns `['Michael', 'Tom', 'Adam']` for the first collection and `[]` for the second. A second closure may be passed to the `whenNotEmpty` method that will be executed when the collection is empty:

```typescript
const collection = collect();

collection.whenNotEmpty((collection) => collection.push('Adam'), (collection) => collection.push('Taylor'));

collection.all();
```

Returns `['Taylor']`. For the inverse of `whenNotEmpty`, see the [whenEmpty](#whenempty) method.

<a name="method-where"></a>
#### `where()` {.collection-method}

The `where` method filters the collection by a given key / value pair:

```typescript
const filtered = collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 100 },
    { product: 'Bookcase', price: 150 },
    { product: 'Door', price: 100 }
]).where('price', 100);

filtered.all();

/*
    [
        { product: 'Chair', price: 100 },
        { product: 'Door', price: 100 }
    ]
*/
```

The `where` method uses "loose" comparisons when checking item values, meaning a string with an integer value will be considered equal to an integer of the same value. Use the [whereStrict](#wherestrict) method to filter using "strict" comparisons, or the [whereNull](#wherenull) and [whereNotNull](#wherenotnull) methods to filter for `null` values.

Optionally, you may pass a comparison operator as the second parameter. Supported operators are: '===', '!==', '!=', '==', '=', '<>', '>', '<', '>=', and '<=':

```typescript
const filtered = collect([
    { name: 'Jim', platform: 'Mac' },
    { name: 'Sally', platform: 'Mac' },
    { name: 'Sue', platform: 'Linux' }
]).where('platform', '!=', 'Linux');

filtered.all();

/*
    [
        { name: 'Jim', platform: 'Mac' },
        { name: 'Sally', platform: 'Mac' }
    ]
*/
```

<a name="method-wherestrict"></a>
#### `whereStrict()` {.collection-method}

This method has the same signature as the [where](#where) method; however, all values are compared using "strict" comparisons.

<a name="method-wherebetween"></a>
#### `whereBetween()` {.collection-method}

The `whereBetween` method filters the collection by determining if a specified item value is within a given range:

```typescript
const filtered = collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 80 },
    { product: 'Bookcase', price: 150 },
    { product: 'Pencil', price: 30 },
    { product: 'Door', price: 100 }
]).whereBetween('price', [100, 200]);

filtered.all();

/*
    [
        { product: 'Desk', price: 200 },
        { product: 'Bookcase', price: 150 },
        { product: 'Door', price: 100 }
    ]
*/
```

<a name="method-wherein"></a>
#### `whereIn()` {.collection-method}

The `whereIn` method removes elements from the collection that do not have a specified item value that is contained within the given array:

```typescript
const filtered = collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 100 },
    { product: 'Bookcase', price: 150 },
    { product: 'Door', price: 100 }
]).whereIn('price', [150, 200]);

filtered.all();

/*
    [
        { product: 'Desk', price: 200 },
        { product: 'Bookcase', price: 150 }
    ]
*/
```

The `whereIn` method uses "loose" comparisons when checking item values, meaning a string with an integer value will be considered equal to an integer of the same value. Use the [whereInStrict](#whereinstrict) method to filter using "strict" comparisons.

<a name="method-whereinstrict"></a>
#### `whereInStrict()` {.collection-method}

This method has the same signature as the [whereIn](#wherein) method; however, all values are compared using "strict" comparisons.

<a name="method-whereinstanceof"></a>
#### `whereInstanceOf()` {.collection-method}

The `whereInstanceOf` method filters the collection by a given class type:

```typescript
import { User } from './models/User';
import { Post } from './models/Post';

const filtered = collect([
    new User(),
    new User(),
    new Post()
]).whereInstanceOf(User);

filtered.all();
```

Returns an array containing only `User` instances.

<a name="method-wherenotbetween"></a>
#### `whereNotBetween()` {.collection-method}

The `whereNotBetween` method filters the collection by determining if a specified item value is outside of a given range:

```typescript
const filtered = collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 80 },
    { product: 'Bookcase', price: 150 },
    { product: 'Pencil', price: 30 },
    { product: 'Door', price: 100 }
]).whereNotBetween('price', [100, 200]);

filtered.all();

/*
    [
        { product: 'Chair', price: 80 },
        { product: 'Pencil', price: 30 }
    ]
*/
```

<a name="method-wherenotin"></a>
#### `whereNotIn()` {.collection-method}

The `whereNotIn` method removes elements from the collection that have a specified item value that is contained within the given array:

```typescript
const filtered = collect([
    { product: 'Desk', price: 200 },
    { product: 'Chair', price: 100 },
    { product: 'Bookcase', price: 150 },
    { product: 'Door', price: 100 }
]).whereNotIn('price', [150, 200]);

filtered.all();

/*
    [
        { product: 'Chair', price: 100 },
        { product: 'Door', price: 100 }
    ]
*/
```

The `whereNotIn` method uses "loose" comparisons when checking item values, meaning a string with an integer value will be considered equal to an integer of the same value. Use the [whereNotInStrict](#wherenotinstrict) method to filter using "strict" comparisons.

<a name="method-wherenotinstrict"></a>
#### `whereNotInStrict()` {.collection-method}

This method has the same signature as the [whereNotIn](#wherenotin) method; however, all values are compared using "strict" comparisons.

<a name="method-wherenotnull"></a>
#### `whereNotNull()` {.collection-method}

The `whereNotNull` method returns items from the collection where the given key is not `null`:

```typescript
const filtered = collect([
    { name: 'Desk' },
    { name: null },
    { name: 'Bookcase' },
    { name: 0 },
    { name: '' }
]).whereNotNull('name');

filtered.all();

/*
    [
        { name: 'Desk' },
        { name: 'Bookcase' },
        { name: 0 },
        { name: '' }
    ]
*/
```

<a name="method-wherenull"></a>
#### `whereNull()` {.collection-method}

The `whereNull` method returns items from the collection where the given key is `null`:

```typescript
const filtered = collect([
    { name: 'Desk' },
    { name: null },
    { name: 'Bookcase' },
    { name: 0 },
    { name: '' }
]).whereNull('name');

filtered.all();
```

Returns `[{ name: null }]`.

<a name="method-wrap"></a>
#### `wrap()` {.collection-method}

The static `wrap` method wraps the given value in a collection when applicable:

```typescript
const collection = Collection.wrap('John Doe');
collection.all();

const collection2 = Collection.wrap(['John Doe']);
collection2.all();

const collection3 = Collection.wrap(collect('John Doe'));
collection3.all();
```

All three return `['John Doe']`.

<a name="method-zip"></a>
#### `zip()` {.collection-method}

The `zip` method merges together the values of the given array with the values of the original collection at their corresponding index:

```typescript
const zipped = collect(['Chair', 'Desk']).zip([100, 200]);

zipped.all();
```

Returns `[['Chair', 100], ['Desk', 200]]`.

<a name="higher-order-messages"></a>
## Higher Order Messages

Collections also provide support for "higher order messages", which are short-cuts for performing common actions on collections. The collection methods that provide higher order messages are: [average](#average), [avg](#avg), [contains](#contains), [each](#each), [every](#every), [filter](#filter), [first](#first), [flatMap](#flatmap), [groupBy](#groupby), [keyBy](#keyby), [map](#map), [max](#max), [min](#min), [partition](#partition), [reject](#reject), [skipUntil](#skipuntil), [skipWhile](#skipwhile), [some](#some), [sortBy](#sortby), [sortByDesc](#sortbydesc), [sum](#sum), [takeUntil](#takeuntil), [takeWhile](#takewhile), and [unique](#unique).

Each higher order message can be accessed as a dynamic property on a collection instance. For instance, let's use the `each` higher order message to call a method on each object within a collection:

```typescript
class User {
    name: string;
    constructor(name: string) { this.name = name; }
    notify() { console.log(`Notifying ${this.name}`); }
}

const users = collect([new User('Alice'), new User('Bob')]);

users.each.notify();
```

Logs "Notifying Alice" and "Notifying Bob". Likewise, we can use the `sum` higher order message to gather the total number of "votes" for a collection of users:

```typescript
const users = collect([
    { name: 'Alice', votes: 100 },
    { name: 'Bob', votes: 200 }
]);

users.sum.votes;
```

Returns `300`.

<a name="lazy-collections"></a>
## Lazy Collections

<a name="lazy-collection-introduction"></a>
### Introduction

> [!NOTE]
> Before learning more about lazy collections, take some time to familiarize yourself with [JavaScript generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

To supplement the already powerful `Collection` class, the `LazyCollection` class leverages JavaScript's [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) to allow you to work with very large datasets while keeping memory usage low.

For example, imagine your application needs to process a multi-gigabyte log file while taking advantage of Laravel's collection methods to parse the logs. Instead of reading the entire file into memory at once, lazy collections may be used to keep only a small part of the file in memory at a given time:

```typescript
LazyCollection.make(function* () {
    const fs = require('fs');
    const readline = require('readline');
    const fileStream = fs.createReadStream('log.txt');
    const rl = readline.createInterface({ input: fileStream });

    for await (const line of rl) {
        yield line;
    }
}).chunk(4).map((lines) => LogEntry.fromLines(lines)).each((logEntry) => {
    
});
```

Or, imagine you need to iterate through 10,000 records. When using traditional collections, all 10,000 items must be loaded into memory at the same time:

```typescript
const users = collect(allUsersArray).filter((user) => user.id > 500);
```

However, using a lazy collection allows you to process items one at a time. In this example, the `filter` callback is not executed until we actually iterate over each user individually, allowing for a drastic reduction in memory usage:

```typescript
const users = lazy(function* () {
    for (const user of generateUsersFromSource()) {
        yield user;
    }
}).filter((user) => user.id > 500);

for (const user of users) {
    console.log(user.id);
}
```

<a name="creating-lazy-collections"></a>
### Creating Lazy Collections

To create a lazy collection instance, you can use the `lazy()` helper function or the `LazyCollection.make()` method with a generator function:

```typescript
import { lazy, LazyCollection } from 'collect-ts';

const lazyFromArray = lazy([1, 2, 3, 4, 5]);

const lazyFromGenerator = lazy(function* () {
    yield 1;
    yield 2;
    yield 3;
});

const lazyFromMake = LazyCollection.make(function* () {
    for (let i = 1; i <= 1000; i++) {
        yield i;
    }
});

const range = LazyCollection.range(1, 100);
const times = LazyCollection.times(5, i => i * 2);
const empty = LazyCollection.empty();
```

The `range` produces numbers 1 to 100, `times` produces `[2, 4, 6, 8, 10]`, and `empty` produces an empty lazy collection.

You can also convert an existing Collection to a LazyCollection:

```typescript
import { collect } from 'collect-ts';

const lazyCollection = collect([1, 2, 3, 4, 5]).lazy();
```

<a name="the-enumerable-contract"></a>
### Available Methods

Almost all methods available on the `Collection` class are also available on the `LazyCollection` class. The `LazyCollection` implements approximately 12 truly lazy methods natively (such as `map`, `filter`, `take`, `skip`, etc.), and all other Collection methods are automatically delegated via a Proxy wrapper. This means you can use any Collection method on a LazyCollection - it will first materialize the lazy collection into a regular Collection, then call the method.

**Truly lazy methods** (maintain laziness through chaining):
- `map()`, `filter()`, `reject()`
- `take()`, `skip()`, `takeWhile()`, `takeUntil()`, `skipWhile()`, `skipUntil()`
- `flatMap()`, `chunk()`
- `tapEach()`, `remember()`, `takeUntilTimeout()`

**All other methods** (delegated to Collection):

<style>
    .collection-method-list > p {
        columns: 10.8em 3; -moz-columns: 10.8em 3; -webkit-columns: 10.8em 3;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

<div class="collection-method-list" markdown="1">

[all](#all)
[average](#average)
[avg](#avg)
[chunk](#chunk)
[chunkWhile](#chunkwhile)
[collapse](#collapse)
[collect](#collect)
[combine](#combine)
[concat](#concat)
[contains](#contains)
[containsStrict](#containsstrict)
[count](#count)
[countBy](#method-countby)
[crossJoin](#crossjoin)
[dd](#dd)
[diff](#diff)
[diffAssoc](#diffassoc)
[diffKeys](#diffkeys)
[dump](#dump)
[duplicates](#duplicates)
[duplicatesStrict](#duplicatesstrict)
[each](#each)
[eachSpread](#eachspread)
[every](#every)
[except](#except)
[filter](#filter)
[first](#first)
[firstOrFail](#first-or-fail)
[firstWhere](#first-where)
[flatMap](#flatmap)
[flatten](#flatten)
[flip](#flip)
[forPage](#forpage)
[get](#get)
[groupBy](#groupby)
[has](#has)
[implode](#implode)
[intersect](#intersect)
[intersectAssoc](#intersectAssoc)
[intersectByKeys](#intersectbykeys)
[isEmpty](#isempty)
[isNotEmpty](#isnotempty)
[join](#join)
[keyBy](#keyby)
[keys](#keys)
[last](#last)
[macro](#macro)
[make](#make)
[map](#map)
[mapInto](#mapinto)
[mapSpread](#mapspread)
[mapToDictionary](#maptodictionary)
[mapToGroups](#maptogroups)
[mapWithKeys](#mapwithkeys)
[max](#max)
[median](#median)
[merge](#merge)
[mergeRecursive](#mergerecursive)
[min](#min)
[mode](#mode)
[nth](#nth)
[only](#only)
[pad](#pad)
[partition](#partition)
[pipe](#pipe)
[pluck](#pluck)
[random](#random)
[reduce](#reduce)
[reject](#reject)
[replace](#replace)
[replaceRecursive](#replacerecursive)
[reverse](#reverse)
[search](#search)
[shuffle](#shuffle)
[skip](#skip)
[slice](#slice)
[sole](#sole)
[some](#some)
[sort](#sort)
[sortBy](#sortby)
[sortByDesc](#sortbydesc)
[sortKeys](#sortkeys)
[sortKeysDesc](#sortkeysdesc)
[split](#split)
[sum](#sum)
[take](#take)
[tap](#tap)
[times](#times)
[toArray](#toarray)
[toJson](#tojson)
[union](#union)
[unique](#unique)
[uniqueStrict](#uniquestrict)
[unless](#unless)
[unlessEmpty](#unlessempty)
[unlessNotEmpty](#unlessnotempty)
[unwrap](#unwrap)
[values](#values)
[when](#when)
[whenEmpty](#whenempty)
[whenNotEmpty](#whennotempty)
[where](#where)
[whereStrict](#wherestrict)
[whereBetween](#wherebetween)
[whereIn](#wherein)
[whereInStrict](#whereinstrict)
[whereInstanceOf](#whereinstanceof)
[whereNotBetween](#wherenotbetween)
[whereNotIn](#wherenotin)
[whereNotInStrict](#wherenotinstrict)
[wrap](#wrap)
[zip](#zip)

</div>

> [!WARNING]
> Methods that mutate the collection (such as `shift`, `pop`, `prepend` etc.) are **not** available on the `LazyCollection` class.

<a name="lazy-collection-methods"></a>
### Lazy Collection Methods

In addition to the methods defined in the `Enumerable` contract, the `LazyCollection` class contains the following methods:

<a name="method-takeUntilTimeout"></a>
#### `takeUntilTimeout()` {.collection-method}

The `takeUntilTimeout` method returns a new lazy collection that will enumerate values until the specified time. After that time, the collection will then stop enumerating:

```typescript
const lazyCollection = LazyCollection.times(Infinity)
    .takeUntilTimeout(new Date(Date.now() + 60000));

lazyCollection.each((number) => {
    console.log(number);
});
```

Logs numbers 1, 2, etc., up to around 58-59 before the timeout (1 minute) is reached. To illustrate the usage of this method, imagine an application that submits invoices. You could set up a task that runs every 15 minutes and only processes invoices for a maximum of 14 minutes:

```typescript
const processStart = Date.now();
const timeoutMs = 14 * 60 * 1000;

lazy(function* () {
    for (const invoice of fetchPendingInvoices()) {
        yield invoice;
    }
})
    .takeUntilTimeout(new Date(processStart + timeoutMs))
    .each((invoice) => submitInvoice(invoice));
```

<a name="method-tapEach"></a>
#### `tapEach()` {.collection-method}

While the `each` method calls the given callback for each item in the collection right away, the `tapEach` method only calls the given callback as the items are being pulled out of the list one by one:

```typescript
const lazyCollection = LazyCollection.times(Infinity).tapEach((value) => {
    console.log(value);
});

const items = lazyCollection.take(3).all();
```

Nothing is logged until items are pulled. When `take(3).all()` is called, it logs 1, 2, 3 as items are retrieved.

<a name="method-remember"></a>
#### `remember()` {.collection-method}

The `remember` method returns a new lazy collection that will remember any values that have already been enumerated and will not retrieve them again on subsequent collection enumerations:

```typescript
let computeCount = 0;
const lazyCollection = lazy(function* () {
    for (let i = 1; i <= 10; i++) {
        computeCount++;
        yield i;
    }
}).remember();

lazyCollection.take(5).all();
console.log(computeCount);

lazyCollection.take(8).all();
console.log(computeCount);
```

The first `take(5)` computes and caches values 1-5, with `computeCount` at 5. The second `take(8)` uses cached values for 1-5 and only computes 6-8, bringing `computeCount` to 8.

