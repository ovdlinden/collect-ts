/**
 * all/toArray methods - get underlying items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `all` method returns the underlying array or object represented by the collection:
 *
 * @returns The underlying items as an array or object
 *
 * @example
 * collect([1, 2, 3])
 *     .all()
 * // → [1, 2, 3]
 *
 * @example
 * collect({ name: 'Taylor', role: 'Developer' })
 *     .all()
 * // → { name: 'Taylor', role: 'Developer' }
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
 * The `toArray` method converts the collection into a plain array. For
 * associative collections, only the values are returned:
 *
 * @returns Plain array of values
 *
 * @example
 * collect([1, 2, 3])
 *     .toArray()
 * // → [1, 2, 3]
 *
 * @example
 * collect({ a: 1, b: 2, c: 3 })
 *     .toArray()
 * // → [1, 2, 3]
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
