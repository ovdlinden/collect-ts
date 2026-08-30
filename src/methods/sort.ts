/**
 * sort methods - sorting operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `sort` method sorts the collection. The sorted collection keeps the original
 * array keys for associative collections, but resets numeric keys for array collections.
 *
 * @param callback - Optional comparison function
 * @returns New sorted collection
 *
 * @example
 * collect([3, 1, 4, 1, 5])
 *     .sort()
 *     .all()
 * // → [1, 1, 3, 4, 5]
 *
 * @example With custom comparator:
 * collect(['banana', 'apple', 'cherry'])
 *     .sort((a, b) => a.length - b.length)
 *     .all()
 * // → ['apple', 'banana', 'cherry']
 *
 * @example Descending order:
 * collect([1, 2, 3])
 *     .sort((a, b) => b - a)
 *     .all()
 * // → [3, 2, 1]
 *
 * @see {@link sortDesc} - Sort in descending order
 * @see {@link sortBy} - Sort by a key or callback
 * @see {@link sortKeys} - Sort by keys
 *
 * @category Sorting
 */
export const sortMethod: MethodDefinition<'sort'> = {
	name: 'sort',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: (a: T, b: T) => number,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ? [...arr] : Object.values(this.getItems());

		if (callback) {
			items.sort(callback);
		} else {
			items.sort((a, b) => {
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			});
		}

		return this.newInstance(items) as CoreCollection<T, CK>;
	},
};

/**
 * The `sortDesc` method sorts the collection in descending order.
 *
 * @returns New sorted collection (descending)
 *
 * @example
 * collect([1, 3, 2, 5, 4])
 *     .sortDesc()
 *     .all()
 * // → [5, 4, 3, 2, 1]
 *
 * @example With strings:
 * collect(['apple', 'cherry', 'banana'])
 *     .sortDesc()
 *     .all()
 * // → ['cherry', 'banana', 'apple']
 *
 * @see {@link sort} - Sort in ascending order
 * @see {@link sortByDesc} - Sort by key in descending order
 *
 * @category Sorting
 */
export const sortDescMethod: MethodDefinition<'sortDesc'> = {
	name: 'sortDesc',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ? [...arr] : Object.values(this.getItems());

		items.sort((a, b) => {
			if (a > b) return -1;
			if (a < b) return 1;
			return 0;
		});

		return this.newInstance(items) as CoreCollection<T, CK>;
	},
};

/**
 * The `sortKeys` method sorts the collection by its keys.
 *
 * @returns New collection sorted by keys
 *
 * @example
 * collect({ b: 2, a: 1, c: 3 })
 *     .sortKeys()
 *     .all()
 * // → { a: 1, b: 2, c: 3 }
 *
 * @see {@link sortKeysDesc} - Sort keys in descending order
 * @see {@link sort} - Sort by values
 *
 * @category Sorting
 */
export const sortKeysMethod: MethodDefinition<'sortKeys'> = {
	name: 'sortKeys',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const items = this.getItems();
		const sortedKeys = Object.keys(items).sort();
		const result: Record<string, T> = {};

		for (const key of sortedKeys) {
			result[key] = items[key];
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `sortKeysDesc` method sorts the collection by its keys in descending order.
 *
 * @returns New collection sorted by keys (descending)
 *
 * @example
 * collect({ a: 1, c: 3, b: 2 })
 *     .sortKeysDesc()
 *     .all()
 * // → { c: 3, b: 2, a: 1 }
 *
 * @see {@link sortKeys} - Sort keys in ascending order
 * @see {@link sortDesc} - Sort values in descending order
 *
 * @category Sorting
 */
export const sortKeysDescMethod: MethodDefinition<'sortKeysDesc'> = {
	name: 'sortKeysDesc',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const items = this.getItems();
		const sortedKeys = Object.keys(items).sort().reverse();
		const result: Record<string, T> = {};

		for (const key of sortedKeys) {
			result[key] = items[key];
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `sortKeysUsing` method sorts the collection by its keys using a callback.
 * The callback should return a negative, zero, or positive integer based on comparison.
 *
 * @param callback - Comparison function for keys
 * @returns New collection sorted by keys using the callback
 *
 * @example Numeric string sorting:
 * collect({ '10': 'ten', '2': 'two', '1': 'one' })
 *     .sortKeysUsing((a, b) => a.localeCompare(b, undefined, { numeric: true }))
 *     .all()
 * // → { '1': 'one', '2': 'two', '10': 'ten' }
 *
 * @example Case-insensitive sorting:
 * collect({ B: 2, a: 1, C: 3 })
 *     .sortKeysUsing((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
 *     .all()
 * // → { a: 1, B: 2, C: 3 }
 *
 * @see {@link sortKeys} - Sort keys with default comparison
 * @see {@link sortKeysDesc} - Sort keys in descending order
 *
 * @category Sorting
 */
export const sortKeysUsingMethod: MethodDefinition<'sortKeysUsing'> = {
	name: 'sortKeysUsing',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (a: string, b: string) => number,
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const entries = Object.entries(items);
		entries.sort(([a], [b]) => callback(a, b));

		const result: Record<string, T> = {};
		for (const [key, value] of entries) {
			result[key] = value;
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default sortMethod;
