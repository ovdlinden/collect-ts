/**
 * all/toArray methods - get underlying items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `all` method returns the underlying array or object represented by the collection.
 *
 * @returns The underlying items as an array or object
 *
 * @example With an array:
 * collect([1, 2, 3])
 *     .all()
 * // → [1, 2, 3]
 *
 * @example With an object:
 * collect({ name: 'Taylor', role: 'Developer' })
 *     .all()
 * // → { name: 'Taylor', role: 'Developer' }
 *
 * @example After transformations:
 * collect([1, 2, 3])
 *     .map(n => n * 2)
 *     .all()
 * // → [2, 4, 6]
 *
 * @see {@link toArray} - Always returns an array (values only)
 * @see {@link values} - Get values as a new collection
 *
 * @category Finding
 */
export const allMethod: MethodDefinition<'all'> = {
	name: 'all',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): T[] | Record<string, T> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return arr;
		}
		return this.getItems();
	},
};

/**
 * The `toArray` method converts the collection into a plain array.
 * For associative collections, only the values are returned.
 *
 * @returns Plain array of values
 *
 * @example
 * collect([1, 2, 3])
 *     .toArray()
 * // → [1, 2, 3]
 *
 * @example From an object (values only):
 * collect({ a: 1, b: 2, c: 3 })
 *     .toArray()
 * // → [1, 2, 3]
 *
 * @see {@link all} - Returns array or object depending on collection type
 * @see {@link values} - Get values as a new collection
 *
 * @category Finding
 */
export const toArrayMethod: MethodDefinition<'toArray'> = {
	name: 'toArray',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): T[] {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return arr;
		}
		return Object.values(this.getItems());
	},
};

export default allMethod;
