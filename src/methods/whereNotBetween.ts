/**
 * whereNotBetween method - filter items outside a range.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `whereNotBetween` method filters the collection by determining if a specified item value
 * is outside of a given range.
 *
 * @param key - Property key to check
 * @param values - Tuple of [min, max] values defining the range to exclude
 * @returns New collection with items where the value is outside the range
 *
 * @example
 * collect([
 *   { product: 'Desk', price: 200 },
 *   { product: 'Chair', price: 80 },
 *   { product: 'Bookcase', price: 150 },
 *   { product: 'Pencil', price: 5 },
 *   { product: 'Monitor', price: 300 },
 * ])
 *   .whereNotBetween('price', [100, 200])
 *   .all()
 * // → [
 * //     { product: 'Chair', price: 80 },
 * //     { product: 'Pencil', price: 5 },
 * //     { product: 'Monitor', price: 300 },
 * //   ]
 *
 * @example Filter ages outside working age:
 * collect([
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 17 },
 *   { name: 'Carol', age: 65 },
 *   { name: 'Dave', age: 40 },
 * ])
 *   .whereNotBetween('age', [18, 64])
 *   .pluck('name')
 *   .all()
 * // → ['Bob', 'Carol']
 *
 * @see {@link whereBetween} - Include items within a range
 * @see {@link where} - Filter by key/value comparison
 *
 * @category Filtering
 */
export const whereNotBetweenMethod: MethodDefinition<'whereNotBetween'> = {
	name: 'whereNotBetween',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string,
		values: [number, number],
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const [min, max] = values;

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const value = dataGet(items[i], key) as number;
			if (value < min || value > max) {
				result.push(items[i]);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default whereNotBetweenMethod;
