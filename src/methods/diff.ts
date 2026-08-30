/**
 * diff methods - set difference operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `diff` method compares the collection against another array or collection
 * based on its values. This method returns the values in the original collection
 * that are not present in the given collection.
 *
 * @param values - Array or collection to compare against
 * @returns New collection with values not in the given collection
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .diff([2, 4, 6])
 *     .all()
 * // → [1, 3, 5]
 *
 * @example With strings:
 * collect(['a', 'b', 'c'])
 *     .diff(['b', 'd'])
 *     .all()
 * // → ['a', 'c']
 *
 * @see {@link diffKeys} - Compare by keys
 * @see {@link diffAssoc} - Compare by key and value
 * @see {@link intersect} - Get values present in both
 *
 * @category Combining
 */
export const diffMethod: MethodDefinition<'diff'> = {
	name: 'diff',
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
			if (!compareValues.includes(item)) {
				result.push(item);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

/**
 * The `diffKeys` method compares the collection against another array or collection
 * based on its keys. This method returns the key/value pairs in the original collection
 * that are not present in the given collection.
 *
 * @param values - Object or collection to compare keys against
 * @returns New collection with key/value pairs whose keys are not in the given collection
 *
 * @example
 * collect({ a: 1, b: 2, c: 3 })
 *     .diffKeys({ a: 10, c: 30, d: 40 })
 *     .all()
 * // → { b: 2 }
 *
 * @see {@link diff} - Compare by values
 * @see {@link diffAssoc} - Compare by key and value
 *
 * @category Combining
 */
export const diffKeysMethod: MethodDefinition<'diffKeys'> = {
	name: 'diffKeys',
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
			if (!compareKeys.has(key)) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `diffAssoc` method compares the collection against another array or collection
 * based on its keys and values. This method returns the key/value pairs in the original
 * collection that are not present in the given collection.
 *
 * @param values - Object or collection to compare against
 * @returns New collection with key/value pairs not in the given collection
 *
 * @example
 * collect({ a: 1, b: 2, c: 3 })
 *     .diffAssoc({ a: 1, b: 20, d: 4 })
 *     .all()
 * // → { b: 2, c: 3 }
 *
 * @see {@link diff} - Compare by values only
 * @see {@link diffKeys} - Compare by keys only
 *
 * @category Combining
 */
export const diffAssocMethod: MethodDefinition<'diffAssoc'> = {
	name: 'diffAssoc',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		values: Record<string, T> | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const compareItems =
			'all' in values && typeof (values as CoreCollection<T, CollectionKind>).all === 'function'
				? ((values as CoreCollection<T, CollectionKind>).all() as Record<string, T>)
				: (values as Record<string, T>);

		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(items)) {
			if (!(key in compareItems) || compareItems[key] !== value) {
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
 * The `diffUsing` method compares the collection against another array or collection
 * using a callback for comparison. The callback should return 0 when two values are
 * considered equal.
 *
 * @param items - Array or collection to compare against
 * @param callback - Comparison function returning 0 for equal values
 * @returns New collection with values not matching via the callback
 *
 * @example Case-insensitive diff:
 * collect(['Apple', 'Banana', 'Cherry'])
 *     .diffUsing(['apple', 'cherry'], (a, b) =>
 *         a.toLowerCase().localeCompare(b.toLowerCase())
 *     )
 *     .all()
 * // → ['Banana']
 *
 * @see {@link diff} - Compare using default equality
 *
 * @category Combining
 */
export const diffUsingMethod: MethodDefinition<'diffUsing'> = {
	name: 'diffUsing',
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
			if (!otherValues.some((other) => callback(item, other) === 0)) {
				result.push(item);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

/**
 * The `diffKeysUsing` method compares the collection against another array or collection
 * based on its keys using a callback. The callback should return 0 when two keys are
 * considered equal.
 *
 * @param items - Object or collection to compare keys against
 * @param callback - Comparison function returning 0 for equal keys
 * @returns New collection containing items whose keys don't match via the callback
 *
 * @example Case-insensitive key comparison:
 * collect({ Name: 'Alice', AGE: 30 })
 *     .diffKeysUsing({ name: '', age: 0 }, (a, b) =>
 *         a.toLowerCase().localeCompare(b.toLowerCase())
 *     )
 *     .all()
 * // → {} (all keys match case-insensitively)
 *
 * @see {@link diffKeys} - Compare keys using default equality
 *
 * @category Combining
 */
export const diffKeysUsingMethod: MethodDefinition<'diffKeysUsing'> = {
	name: 'diffKeysUsing',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Record<string, unknown> | CoreCollection<unknown, CollectionKind>,
		callback: (a: string, b: string) => number,
	): CoreCollection<T, CK> {
		const compareObj =
			'all' in items && typeof (items as CoreCollection<unknown, CollectionKind>).all === 'function'
				? ((items as CoreCollection<unknown, CollectionKind>).all() as Record<string, unknown>)
				: (items as Record<string, unknown>);
		const otherKeys = Object.keys(compareObj);

		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.getItems())) {
			if (!otherKeys.some((other) => callback(key, other) === 0)) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `diffAssocUsing` method compares the collection against another array or collection
 * based on its keys and values, using a callback for key comparison. The callback should
 * return 0 when two keys are considered equal.
 *
 * @param items - Object or collection to compare against
 * @param callback - Comparison function returning 0 for equal keys
 * @returns New collection containing items whose key/value pairs don't match
 *
 * @example Case-insensitive key comparison:
 * collect({ Name: 'Alice', Age: 30 })
 *     .diffAssocUsing({ name: 'Alice', age: 25 }, (a, b) =>
 *         a.toLowerCase().localeCompare(b.toLowerCase())
 *     )
 *     .all()
 * // → { Age: 30 } (Name matches, Age differs in value)
 *
 * @see {@link diffAssoc} - Compare using default key equality
 * @see {@link diffUsing} - Compare values with a custom callback
 *
 * @category Combining
 */
export const diffAssocUsingMethod: MethodDefinition<'diffAssocUsing'> = {
	name: 'diffAssocUsing',
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
			if (!matchingKey || other[matchingKey] !== value) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default diffMethod;
