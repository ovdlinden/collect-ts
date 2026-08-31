/**
 * combine/union/zip methods - combine collections.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `combine` method combines the values of the collection, as keys, with the
 * values of another array or collection.
 *
 * @param values - Values to combine with
 * @returns New associative collection
 *
 * @example
 * collect(['name', 'age'])
 *     .combine(['Taylor', 25])
 *     .all()
 * // → { name: 'Taylor', age: 25 }
 *
 * @example With more keys than values:
 * collect(['a', 'b', 'c'])
 *     .combine([1, 2])
 *     .all()
 * // → { a: 1, b: 2, c: undefined }
 *
 * @see {@link zip} - Merge collections element-by-element
 * @see {@link mapWithKeys} - Create key/value pairs from callback
 *
 * @category Combining
 */
export const combineMethod: MethodDefinition<'combine'> = {
	name: 'combine',
	chainable: true,
	fn<T, V, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		values: V[] | CoreCollection<V, CollectionKind>,
	): CoreCollection<V, 'assoc'> {
		const arr = this.getArrayItems();
		const keys = arr ?? Object.values(this.getItems());
		const vals = Array.isArray(values) ? values : values.toArray();

		const result: Record<string, V> = {};
		for (let i = 0; i < keys.length; i++) {
			result[String(keys[i])] = vals[i];
		}

		return this.newInstance(result, true) as unknown as CoreCollection<V, 'assoc'>;
	},
};

/**
 * The `union` method adds the given array to the collection. If the given array
 * contains keys that are already in the original collection, the original
 * collection's values will be preferred.
 *
 * @param values - Values to union with
 * @returns New collection with merged values
 *
 * @example
 * collect({ a: 1, b: 2 })
 *     .union({ b: 3, c: 4 })
 *     .all()
 * // → { a: 1, b: 2, c: 4 }
 *
 * @see {@link merge} - Overwrites existing keys
 * @see {@link combine} - Use values as keys
 *
 * @category Combining
 */
export const unionMethod: MethodDefinition<'union'> = {
	name: 'union',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		values: Record<string, T> | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const unionItems =
			'all' in values && typeof (values as CoreCollection<T, CollectionKind>).all === 'function'
				? ((values as CoreCollection<T, CollectionKind>).all() as Record<string, T>)
				: (values as Record<string, T>);

		const result: Record<string, T> = { ...items };
		for (const [key, value] of Object.entries(unionItems)) {
			if (!(key in result)) {
				result[key] = value;
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `zip` method merges together the values of the given array with the values
 * of the original collection at their corresponding index.
 *
 * @param values - Values to zip with
 * @returns New collection of tuples
 *
 * @example
 * collect(['a', 'b', 'c'])
 *     .zip([1, 2, 3])
 *     .all()
 * // → [['a', 1], ['b', 2], ['c', 3]]
 *
 * @example With different lengths:
 * collect(['a', 'b'])
 *     .zip([1, 2, 3])
 *     .all()
 * // → [['a', 1], ['b', 2]]
 *
 * @see {@link combine} - Use values as keys/values
 *
 * @category Combining
 */
export const zipMethod: MethodDefinition<'zip'> = {
	name: 'zip',
	chainable: true,
	fn<T, V, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		values: V[] | CoreCollection<V, CollectionKind>,
	): CoreCollection<[T, V], 'array'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const zipValues = Array.isArray(values) ? values : values.toArray();

		const result: [T, V][] = [];
		const len = Math.min(items.length, zipValues.length);
		for (let i = 0; i < len; i++) {
			result.push([items[i] as T, zipValues[i]]);
		}

		return this.newInstance(result) as unknown as CoreCollection<[T, V], 'array'>;
	},
};

export default combineMethod;
