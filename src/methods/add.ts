/**
 * add/unshift methods - add items to collection.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `add` method appends an item to the end of the collection.
 * This is an alias for {@link push}.
 *
 * @param item - Item to add
 * @returns This collection (mutated)
 *
 * @example
 * collect([1, 2, 3])
 *     .add(4)
 *     .all()
 * // → [1, 2, 3, 4]
 *
 * @see {@link push} - Add to end
 * @see {@link prepend} - Add to beginning
 * @see {@link put} - Set by key
 *
 * @category Transforming
 */
export const addMethod: MethodDefinition<'add'> = {
	name: 'add',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, item: T): CoreCollection<T, CK> {
		return (this as unknown as { push: (...items: T[]) => CoreCollection<T, CK> }).push(item);
	},
};

/**
 * The `unshift` method adds one or more items to the beginning of the collection.
 *
 * @param values - Items to prepend
 * @returns This collection (mutated)
 *
 * @example
 * collect([3, 4, 5])
 *     .unshift(1, 2)
 *     .all()
 * // → [1, 2, 3, 4, 5]
 *
 * @see {@link prepend} - Add single item to beginning
 * @see {@link push} - Add to end
 *
 * @category Transforming
 */
export const unshiftMethod: MethodDefinition<'unshift'> = {
	name: 'unshift',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, ...values: T[]): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			arr.unshift(...values);
			return this;
		}

		const items = this.getItems();
		const newItems: Record<string, T> = {};
		let idx = 0;
		for (const val of values) {
			newItems[String(idx++)] = val;
		}
		for (const [key, val] of Object.entries(items)) {
			newItems[key] = val;
		}
		Object.assign(items, newItems);
		return this;
	},
};

export default addMethod;
