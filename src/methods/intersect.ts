/**
 * intersect methods - set intersection operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `intersect` method removes any values from the original collection that are not
 * present in the given array or collection.
 *
 * @param values - Array or collection to intersect with
 * @returns New collection with only values present in both
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .intersect([2, 4, 6])
 *     .all()
 * // → [2, 4]
 *
 * @example With strings:
 * collect(['a', 'b', 'c'])
 *     .intersect(['b', 'c', 'd'])
 *     .all()
 * // → ['b', 'c']
 *
 * @see {@link intersectByKeys} - Intersect by keys
 * @see {@link diff} - Get values NOT in the other collection
 *
 * @category Combining
 */
export const intersectMethod: MethodDefinition<'intersect'> = {
	name: 'intersect',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		values: T[] | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const compareValues = Array.isArray(values) ? values : values.toArray();

		const result: T[] = [];
		for (const item of items) {
			if (compareValues.includes(item)) {
				result.push(item);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

/**
 * The `intersectByKeys` method removes any keys from the original collection that are
 * not present in the given array or collection.
 *
 * @param values - Object or collection to intersect keys with
 * @returns New collection with only key/value pairs whose keys are in both
 *
 * @example
 * collect({ a: 1, b: 2, c: 3 })
 *     .intersectByKeys({ a: 10, c: 30, d: 40 })
 *     .all()
 * // → { a: 1, c: 3 }
 *
 * @see {@link intersect} - Intersect by values
 * @see {@link diffKeys} - Get keys NOT in the other collection
 *
 * @category Combining
 */
export const intersectByKeysMethod: MethodDefinition<'intersectByKeys'> = {
	name: 'intersectByKeys',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		values: Record<string, unknown> | CoreCollection<unknown, CollectionKind>,
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const compareObj =
			'all' in values && typeof (values as CoreCollection<unknown, CollectionKind>).all === 'function'
				? ((values as CoreCollection<unknown, CollectionKind>).all() as Record<string, unknown>)
				: (values as Record<string, unknown>);
		const compareKeys = new Set(Object.keys(compareObj));

		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(items)) {
			if (compareKeys.has(key)) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * Type for array-like inputs.
 */
type Arrayable<T> = T[] | CoreCollection<T, CollectionKind>;

function arrayableToArray<T>(value: Arrayable<T>): T[] {
	if (Array.isArray(value)) return value;
	return value.toArray() as T[];
}

function collectableToRecord<T>(items: Record<string, T> | CoreCollection<T, CollectionKind>): Record<string, T> {
	if ('all' in items && typeof (items as CoreCollection<T, CollectionKind>).all === 'function') {
		return (items as CoreCollection<T, CollectionKind>).all() as Record<string, T>;
	}
	return items as Record<string, T>;
}

/**
 * The `intersectUsing` method removes values not present in the given array or collection,
 * using a callback for comparison. The callback should return 0 when two values are
 * considered equal.
 *
 * @param items - Array or collection to intersect with
 * @param callback - Comparison function returning 0 for equal values
 * @returns New collection containing only items that match via the callback
 *
 * @example Case-insensitive intersection:
 * collect(['Apple', 'Banana', 'Cherry'])
 *     .intersectUsing(['apple', 'cherry'], (a, b) =>
 *         a.toLowerCase().localeCompare(b.toLowerCase())
 *     )
 *     .all()
 * // → ['Apple', 'Cherry']
 *
 * @see {@link intersect} - Intersect using default equality
 *
 * @category Combining
 */
export const intersectUsingMethod: MethodDefinition<'intersectUsing'> = {
	name: 'intersectUsing',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Arrayable<T>,
		callback: (a: T, b: T) => number,
	): CoreCollection<T, CK> {
		const otherValues = arrayableToArray(items);
		const arr = this.getArrayItems();
		const selfItems = arr ?? Object.values(this.getItems());

		const result: T[] = [];
		for (const item of selfItems) {
			if (otherValues.some((other) => callback(item, other) === 0)) {
				result.push(item);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

/**
 * The `intersectAssoc` method compares the collection against another array or collection,
 * returning key/value pairs that are present in both. Unlike `intersect`, this method
 * considers both keys and values when determining matches.
 *
 * @param items - Object or collection to intersect with
 * @returns New collection containing items with matching key/value pairs
 *
 * @example Find matching key-value pairs:
 * collect({ name: 'Alice', age: 30, city: 'NYC' })
 *     .intersectAssoc({ name: 'Alice', age: 25, city: 'NYC' })
 *     .all()
 * // → { name: 'Alice', city: 'NYC' }
 *
 * @see {@link intersect} - Intersect by values only
 * @see {@link intersectByKeys} - Intersect by keys only
 * @see {@link intersectAssocUsing} - Intersect with a custom key callback
 *
 * @category Combining
 */
export const intersectAssocMethod: MethodDefinition<'intersectAssoc'> = {
	name: 'intersectAssoc',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Record<string, T> | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const other = collectableToRecord(items) as Record<string, unknown>;

		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.getItems())) {
			if (key in other && other[key] === value) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `intersectAssocUsing` method compares the collection against another array or collection
 * based on both keys and values, using a callback for key comparison. The callback should
 * return 0 when two keys are considered equal.
 *
 * @param items - Object or collection to intersect with
 * @param callback - Comparison function returning 0 for equal keys
 * @returns New collection containing items with matching key/value pairs via the callback
 *
 * @example Case-insensitive key matching:
 * collect({ Name: 'Alice', AGE: 30 })
 *     .intersectAssocUsing({ name: 'Alice', age: 30 }, (a, b) =>
 *         a.toLowerCase().localeCompare(b.toLowerCase())
 *     )
 *     .all()
 * // → { Name: 'Alice', AGE: 30 }
 *
 * @see {@link intersectAssoc} - Intersect using default key equality
 *
 * @category Combining
 */
export const intersectAssocUsingMethod: MethodDefinition<'intersectAssocUsing'> = {
	name: 'intersectAssocUsing',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Record<string, T> | CoreCollection<T, CollectionKind>,
		callback: (a: string, b: string) => number,
	): CoreCollection<T, CK> {
		const other = collectableToRecord(items) as Record<string, unknown>;
		const otherKeys = Object.keys(other);

		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.getItems())) {
			const matchingKey = otherKeys.find((k) => callback(key, k) === 0);
			if (matchingKey !== undefined && other[matchingKey] === value) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default intersectMethod;
