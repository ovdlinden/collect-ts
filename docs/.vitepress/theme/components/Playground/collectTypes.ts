/**
 * TypeScript type definitions for the playground's Monaco editor.
 * Includes JSDoc comments for IntelliSense hover documentation.
 */
export const collectTypeDefinitions = `
/**
 * Creates a new Collection from an array or object.
 *
 * The collect function is the primary way to create a Collection instance.
 * It accepts arrays, objects, and iterables.
 *
 * @param items - The items to collect. Can be an array, object, or iterable.
 * @returns A new Collection instance
 * @example
 * // From an array
 * collect([1, 2, 3])
 *
 * @example
 * // From an object
 * collect({ name: 'Taylor', role: 'admin' })
 *
 * @see https://laravel.com/docs/collections#creating-collections
 */
declare function collect<T>(items?: T[] | Record<string, T> | Iterable<T>): Collection<T>;

/**
 * A fluent, chainable wrapper around arrays with 80+ utility methods.
 * Inspired by Laravel's Collection class.
 *
 * @template T - The type of items in the collection
 */
interface Collection<T> {
  /**
   * Returns all items in the collection as an array.
   * @example
   * collect([1, 2, 3]).all() // [1, 2, 3]
   * @see https://laravel.com/docs/collections#method-all
   */
  all(): T[];

  /**
   * Returns the average of all items, or of a specific key.
   * @param key - The key to average, or a callback function
   * @example
   * collect([1, 2, 3]).avg() // 2
   * collect([{ price: 100 }, { price: 200 }]).avg('price') // 150
   * @see https://laravel.com/docs/collections#method-avg
   */
  avg(key?: string | ((item: T) => number)): number;

  /**
   * Breaks the collection into multiple smaller collections of a given size.
   * @param size - The size of each chunk
   * @example
   * collect([1, 2, 3, 4, 5]).chunk(2).all()
   * // [[1, 2], [3, 4], [5]]
   * @see https://laravel.com/docs/collections#method-chunk
   */
  chunk(size: number): Collection<Collection<T>>;

  /**
   * Collapses a collection of arrays into a single, flat collection.
   * @example
   * collect([[1, 2], [3, 4], [5]]).collapse().all()
   * // [1, 2, 3, 4, 5]
   * @see https://laravel.com/docs/collections#method-collapse
   */
  collapse(): Collection<T extends (infer U)[] ? U : T>;

  /**
   * Appends the given array or collection values onto the end.
   * @param items - Items to concatenate
   * @example
   * collect([1, 2]).concat([3, 4]).all() // [1, 2, 3, 4]
   * @see https://laravel.com/docs/collections#method-concat
   */
  concat(...items: (T | T[] | Collection<T>)[]): Collection<T>;

  /**
   * Determines whether the collection contains a given item.
   * @example
   * collect([1, 2, 3]).contains(2) // true
   * collect([{ name: 'Taylor' }]).contains('name', 'Taylor') // true
   * @see https://laravel.com/docs/collections#method-contains
   */
  contains(key: T | string | ((item: T, index: number) => boolean), value?: any): boolean;

  /**
   * Returns the total number of items in the collection.
   * @example
   * collect([1, 2, 3]).count() // 3
   * @see https://laravel.com/docs/collections#method-count
   */
  count(): number;

  /**
   * Counts the occurrences of values or callback results.
   * @param key - The key to count by, or a callback
   * @example
   * collect(['a', 'a', 'b']).countBy().all()
   * // { a: 2, b: 1 }
   * @see https://laravel.com/docs/collections#method-countBy
   */
  countBy(key?: string | ((item: T) => string)): Collection<number>;

  /**
   * Dumps the collection and continues execution.
   * @param label - Optional label for the dump
   * @see https://laravel.com/docs/collections#method-dd
   */
  dd(label?: string): never;

  /**
   * Returns a new collection with duplicate values removed.
   * @param key - The key to dedupe by, or a callback
   * @example
   * collect([1, 1, 2, 2, 3]).unique().all() // [1, 2, 3]
   * @see https://laravel.com/docs/collections#method-unique
   */
  unique(key?: string | ((item: T) => any)): Collection<T>;

  /**
   * Iterates over items and passes each to a callback.
   * Return false to break out of the loop.
   * @param callback - Function to call for each item
   * @example
   * collect([1, 2, 3]).each(item => console.log(item))
   * @see https://laravel.com/docs/collections#method-each
   */
  each(callback: (item: T, index: number) => void | false): Collection<T>;

  /**
   * Determines if all items pass the given truth test.
   * @param callback - The truth test
   * @example
   * collect([1, 2, 3]).every(n => n < 10) // true
   * @see https://laravel.com/docs/collections#method-every
   */
  every(callback: (item: T, index: number) => boolean): boolean;

  /**
   * Filters the collection using the given callback.
   * @param callback - Return true to keep the item
   * @example
   * collect([1, 2, 3, 4]).filter(n => n > 2).all() // [3, 4]
   * @see https://laravel.com/docs/collections#method-filter
   */
  filter(callback?: (item: T, index: number) => boolean): Collection<T>;

  /**
   * Returns the first element matching the condition.
   * @param callback - Optional truth test
   * @param defaultValue - Returned if no match found
   * @example
   * collect([1, 2, 3]).first() // 1
   * collect([1, 2, 3]).first(n => n > 1) // 2
   * @see https://laravel.com/docs/collections#method-first
   */
  first(callback?: (item: T) => boolean, defaultValue?: T): T | undefined;

  /**
   * Returns the first element where the key equals the value.
   * @param key - The key to match
   * @param value - The value to match
   * @example
   * collect([{ id: 1 }, { id: 2 }]).firstWhere('id', 2)
   * // { id: 2 }
   * @see https://laravel.com/docs/collections#method-first-where
   */
  firstWhere(key: string, value: any): T | undefined;
  firstWhere(key: string, operator: string, value: any): T | undefined;

  /**
   * Maps items and then flattens the result by one level.
   * @param callback - Mapping function that returns an array
   * @example
   * collect([1, 2]).flatMap(n => [n, n * 2]).all()
   * // [1, 2, 2, 4]
   * @see https://laravel.com/docs/collections#method-flatmap
   */
  flatMap<U>(callback: (item: T, index: number) => U[]): Collection<U>;

  /**
   * Flattens a multi-dimensional collection.
   * @param depth - The depth to flatten to (default: Infinity)
   * @example
   * collect([[1, [2]], [3]]).flatten().all()
   * // [1, 2, 3]
   * @see https://laravel.com/docs/collections#method-flatten
   */
  flatten(depth?: number): Collection<any>;

  /**
   * Swaps the collection's keys with their values.
   * @example
   * collect({ a: 1, b: 2 }).flip().all()
   * // { 1: 'a', 2: 'b' }
   * @see https://laravel.com/docs/collections#method-flip
   */
  flip(): Collection<T>;

  /**
   * Groups the collection's items by a given key.
   * @param key - The key to group by, or a callback
   * @example
   * collect([
   *   { category: 'fruit', name: 'apple' },
   *   { category: 'fruit', name: 'banana' }
   * ]).groupBy('category')
   * @see https://laravel.com/docs/collections#method-groupby
   */
  groupBy(key: string | ((item: T) => string)): Collection<Collection<T>>;

  /**
   * Determines if a given key exists in the collection.
   * @param key - The key to check
   * @example
   * collect({ name: 'Taylor' }).has('name') // true
   * @see https://laravel.com/docs/collections#method-has
   */
  has(key: string | number): boolean;

  /**
   * Determines if the collection is empty.
   * @example
   * collect([]).isEmpty() // true
   * @see https://laravel.com/docs/collections#method-isempty
   */
  isEmpty(): boolean;

  /**
   * Determines if the collection is not empty.
   * @example
   * collect([1]).isNotEmpty() // true
   * @see https://laravel.com/docs/collections#method-isnotempty
   */
  isNotEmpty(): boolean;

  /**
   * Joins items into a string.
   * @param glue - Separator between items
   * @param finalGlue - Separator before the last item
   * @example
   * collect(['a', 'b', 'c']).join(', ') // 'a, b, c'
   * collect(['a', 'b', 'c']).join(', ', ' and ') // 'a, b and c'
   * @see https://laravel.com/docs/collections#method-join
   */
  join(glue?: string, finalGlue?: string): string;

  /**
   * Keys the collection by the given key.
   * @param key - The key to use, or a callback
   * @example
   * collect([{ id: 1, name: 'Taylor' }]).keyBy('id')
   * // { 1: { id: 1, name: 'Taylor' } }
   * @see https://laravel.com/docs/collections#method-keyby
   */
  keyBy(key: string | ((item: T) => string)): Collection<T>;

  /**
   * Returns all of the collection's keys.
   * @example
   * collect({ a: 1, b: 2 }).keys().all() // ['a', 'b']
   * @see https://laravel.com/docs/collections#method-keys
   */
  keys(): Collection<string>;

  /**
   * Returns the last element matching the condition.
   * @param callback - Optional truth test
   * @param defaultValue - Returned if no match found
   * @example
   * collect([1, 2, 3]).last() // 3
   * @see https://laravel.com/docs/collections#method-last
   */
  last(callback?: (item: T) => boolean, defaultValue?: T): T | undefined;

  /**
   * Transforms each item using a callback function.
   * @param callback - The transformation function
   * @example
   * collect([1, 2, 3]).map(n => n * 2).all() // [2, 4, 6]
   * @see https://laravel.com/docs/collections#method-map
   */
  map<U>(callback: (item: T, index: number) => U): Collection<U>;

  /**
   * Returns the maximum value of a key.
   * @param key - The key or callback to get the max of
   * @example
   * collect([1, 5, 3]).max() // 5
   * collect([{ price: 100 }, { price: 50 }]).max('price') // 100
   * @see https://laravel.com/docs/collections#method-max
   */
  max(key?: string | ((item: T) => number)): number;

  /**
   * Merges the given items into the collection.
   * @param items - Items to merge
   * @example
   * collect([1, 2]).merge([3, 4]).all() // [1, 2, 3, 4]
   * @see https://laravel.com/docs/collections#method-merge
   */
  merge(...items: (T[] | Record<string, T> | Collection<T>)[]): Collection<T>;

  /**
   * Returns the minimum value of a key.
   * @param key - The key or callback to get the min of
   * @example
   * collect([1, 5, 3]).min() // 1
   * @see https://laravel.com/docs/collections#method-min
   */
  min(key?: string | ((item: T) => number)): number;

  /**
   * Returns the items with only the specified keys.
   * @param keys - The keys to keep
   * @example
   * collect({ a: 1, b: 2, c: 3 }).only(['a', 'c']).all()
   * // { a: 1, c: 3 }
   * @see https://laravel.com/docs/collections#method-only
   */
  only(keys: string[]): Collection<T>;

  /**
   * Separates items that pass a truth test from those that don't.
   * @param callback - The truth test
   * @example
   * const [pass, fail] = collect([1, 2, 3, 4])
   *   .partition(n => n > 2)
   *   .map(c => c.all())
   *   .all()
   * // pass: [3, 4], fail: [1, 2]
   * @see https://laravel.com/docs/collections#method-partition
   */
  partition(callback: (item: T) => boolean): Collection<Collection<T>>;

  /**
   * Extracts an array of values for a given key.
   * @param key - The key to pluck
   * @example
   * collect([{ name: 'Taylor' }, { name: 'Abigail' }])
   *   .pluck('name').all() // ['Taylor', 'Abigail']
   * @see https://laravel.com/docs/collections#method-pluck
   */
  pluck<K extends keyof T>(key: K): Collection<T[K]>;
  pluck(key: string): Collection<any>;

  /**
   * Reduces the collection to a single value.
   * @param callback - The reducer function
   * @param initial - The initial value
   * @example
   * collect([1, 2, 3]).reduce((sum, n) => sum + n, 0) // 6
   * @see https://laravel.com/docs/collections#method-reduce
   */
  reduce<U>(callback: (carry: U, item: T, index: number) => U, initial: U): U;

  /**
   * Filters items that fail the given truth test.
   * @param callback - Items returning true are removed
   * @example
   * collect([1, 2, 3, 4]).reject(n => n > 2).all() // [1, 2]
   * @see https://laravel.com/docs/collections#method-reject
   */
  reject(callback: (item: T, index: number) => boolean): Collection<T>;

  /**
   * Reverses the order of items.
   * @example
   * collect([1, 2, 3]).reverse().all() // [3, 2, 1]
   * @see https://laravel.com/docs/collections#method-reverse
   */
  reverse(): Collection<T>;

  /**
   * Randomly shuffles the items.
   * @example
   * collect([1, 2, 3]).shuffle().all() // e.g. [2, 3, 1]
   * @see https://laravel.com/docs/collections#method-shuffle
   */
  shuffle(): Collection<T>;

  /**
   * Skips the first N items.
   * @param count - Number of items to skip
   * @example
   * collect([1, 2, 3, 4]).skip(2).all() // [3, 4]
   * @see https://laravel.com/docs/collections#method-skip
   */
  skip(count: number): Collection<T>;

  /**
   * Returns a slice of the collection.
   * @param start - Starting index
   * @param length - Number of items to take
   * @example
   * collect([1, 2, 3, 4]).slice(1, 2).all() // [2, 3]
   * @see https://laravel.com/docs/collections#method-slice
   */
  slice(start: number, length?: number): Collection<T>;

  /**
   * Determines if any items pass the truth test.
   * @param callback - The truth test
   * @example
   * collect([1, 2, 3]).some(n => n > 2) // true
   * @see https://laravel.com/docs/collections#method-some
   */
  some(callback: (item: T, index: number) => boolean): boolean;

  /**
   * Sorts the collection.
   * @param callback - Optional comparison function
   * @example
   * collect([3, 1, 2]).sort().all() // [1, 2, 3]
   * @see https://laravel.com/docs/collections#method-sort
   */
  sort(callback?: (a: T, b: T) => number): Collection<T>;

  /**
   * Sorts by a key in ascending order.
   * @param key - The key or callback to sort by
   * @example
   * collect([{ name: 'Taylor' }, { name: 'Abigail' }])
   *   .sortBy('name').pluck('name').all() // ['Abigail', 'Taylor']
   * @see https://laravel.com/docs/collections#method-sortby
   */
  sortBy(key: string | ((item: T) => any)): Collection<T>;

  /**
   * Sorts by a key in descending order.
   * @param key - The key or callback to sort by
   * @example
   * collect([{ age: 20 }, { age: 30 }])
   *   .sortByDesc('age').pluck('age').all() // [30, 20]
   * @see https://laravel.com/docs/collections#method-sortbydesc
   */
  sortByDesc(key: string | ((item: T) => any)): Collection<T>;

  /**
   * Returns the sum of all items, or of a specific key.
   * @param key - The key to sum, or a callback
   * @example
   * collect([1, 2, 3]).sum() // 6
   * collect([{ price: 100 }, { price: 200 }]).sum('price') // 300
   * @see https://laravel.com/docs/collections#method-sum
   */
  sum(key?: string | ((item: T) => number)): number;

  /**
   * Returns the first N items.
   * @param count - Number of items to take (or negative to take from end)
   * @example
   * collect([1, 2, 3, 4]).take(2).all() // [1, 2]
   * collect([1, 2, 3, 4]).take(-2).all() // [3, 4]
   * @see https://laravel.com/docs/collections#method-take
   */
  take(count: number): Collection<T>;

  /**
   * Passes the collection to a callback and returns the collection.
   * Useful for side effects without breaking the chain.
   * @param callback - The callback to execute
   * @example
   * collect([1, 2, 3])
   *   .tap(c => console.log('Count:', c.count()))
   *   .map(n => n * 2)
   * @see https://laravel.com/docs/collections#method-tap
   */
  tap(callback: (collection: Collection<T>) => void): Collection<T>;

  /**
   * Returns all items as a plain array.
   * @example
   * collect([1, 2, 3]).toArray() // [1, 2, 3]
   * @see https://laravel.com/docs/collections#method-toarray
   */
  toArray(): T[];

  /**
   * Converts the collection to a JSON string.
   * @example
   * collect([1, 2, 3]).toJson() // '[1,2,3]'
   * @see https://laravel.com/docs/collections#method-tojson
   */
  toJson(): string;

  /**
   * Returns all values without keys.
   * @example
   * collect({ a: 1, b: 2 }).values().all() // [1, 2]
   * @see https://laravel.com/docs/collections#method-values
   */
  values(): Collection<T>;

  /**
   * Conditionally executes a callback.
   * @param condition - When true, executes the callback
   * @param callback - The callback to execute when condition is true
   * @param fallback - Optional callback when condition is false
   * @example
   * collect([1, 2, 3])
   *   .when(true, c => c.filter(n => n > 1))
   *   .all() // [2, 3]
   * @see https://laravel.com/docs/collections#method-when
   */
  when(condition: boolean, callback: (c: Collection<T>) => Collection<T>, fallback?: (c: Collection<T>) => Collection<T>): Collection<T>;

  /**
   * Filters items where key equals value.
   * @param key - The key to match
   * @param value - The value to match (or operator if 3 args)
   * @example
   * collect([{ active: true }, { active: false }])
   *   .where('active', true).all()
   * // [{ active: true }]
   * @see https://laravel.com/docs/collections#method-where
   */
  where(key: string, value: any): Collection<T>;
  where(key: string, operator: '=' | '!=' | '<' | '>' | '<=' | '>=', value: any): Collection<T>;

  /**
   * Filters items where key is in the given values.
   * @param key - The key to match
   * @param values - The values to match against
   * @example
   * collect([{ id: 1 }, { id: 2 }, { id: 3 }])
   *   .whereIn('id', [1, 3]).pluck('id').all() // [1, 3]
   * @see https://laravel.com/docs/collections#method-wherein
   */
  whereIn(key: string, values: any[]): Collection<T>;

  /**
   * Filters items where key is NOT in the given values.
   * @param key - The key to match
   * @param values - The values to exclude
   * @example
   * collect([{ id: 1 }, { id: 2 }, { id: 3 }])
   *   .whereNotIn('id', [1, 3]).pluck('id').all() // [2]
   * @see https://laravel.com/docs/collections#method-wherenotin
   */
  whereNotIn(key: string, values: any[]): Collection<T>;

  /**
   * Filters items where key is between two values (inclusive).
   * @param key - The key to match
   * @param values - Tuple of [min, max]
   * @example
   * collect([{ price: 50 }, { price: 150 }, { price: 250 }])
   *   .whereBetween('price', [100, 200]).pluck('price').all() // [150]
   * @see https://laravel.com/docs/collections#method-wherebetween
   */
  whereBetween(key: string, values: [any, any]): Collection<T>;

  /**
   * Filters items where key is null.
   * @param key - The key to check
   * @example
   * collect([{ name: 'Taylor' }, { name: null }])
   *   .whereNull('name').all() // [{ name: null }]
   * @see https://laravel.com/docs/collections#method-wherenull
   */
  whereNull(key: string): Collection<T>;

  /**
   * Filters items where key is NOT null.
   * @param key - The key to check
   * @example
   * collect([{ name: 'Taylor' }, { name: null }])
   *   .whereNotNull('name').all() // [{ name: 'Taylor' }]
   * @see https://laravel.com/docs/collections#method-wherenotnull
   */
  whereNotNull(key: string): Collection<T>;
}
`;
