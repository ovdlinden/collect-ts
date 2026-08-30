/**
 * transform method - mutating map operation.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `transform` method iterates over the collection and calls the given callback
 * with each item in the collection. The items in the collection will be replaced
 * by the values returned by the callback. Unlike `map`, this method modifies the
 * collection in place.
 *
 * @param callback - Function to transform each item
 * @returns The collection (for chaining)
 *
 * @example
 * const collection = collect([1, 2, 3])
 * collection.transform(n => n * 2)
 * collection.all()
 * // → [2, 4, 6]
 *
 * @example You may chain after transform:
 * collect({ price: 100, tax: 10 })
 *     .transform((v, k) => k === 'price' ? v * 1.1 : v)
 *     .sum()
 * // → 120
 *
 * @example Transform object values:
 * const collection = collect({ a: 1, b: 2 })
 * collection.transform(v => v * 10)
 * collection.all()
 * // → { a: 10, b: 20 }
 *
 * @see {@link map} - Transform without mutation (returns new collection)
 * @see {@link each} - Iterate without transforming
 *
 * @category Transforming
 */
export const transformMethod: MethodDefinition<'transform'> = {
	name: 'transform',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: number | string) => T,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				arr[i] = callback(arr[i], i);
			}
		} else {
			const items = this.getItems();
			for (const key of Object.keys(items)) {
				items[key] = callback(items[key], key);
			}
		}

		return this;
	},
};

export default transformMethod;
