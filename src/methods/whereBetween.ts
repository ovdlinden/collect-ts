/**
 * whereBetween method - filter items within a range.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `whereBetween` method filters the collection by determining if a specified
 * item value is within a given range (inclusive).
 *
 * @param key - Property key to check
 * @param values - Tuple of [min, max] values defining the range
 * @returns New collection with items where the value is within the range
 *
 * @example
 * collect([
 *   { product: 'Desk', price: 200 },
 *   { product: 'Chair', price: 80 },
 *   { product: 'Bookcase', price: 150 },
 *   { product: 'Pencil', price: 5 },
 *   { product: 'Monitor', price: 300 },
 * ])
 *   .whereBetween('price', [100, 200])
 *   .all()
 * // → [
 * //     { product: 'Desk', price: 200 },
 * //     { product: 'Bookcase', price: 150 },
 * //   ]
 *
 * @example Filter by age range:
 * collect([
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 17 },
 *   { name: 'Carol', age: 65 },
 *   { name: 'Dave', age: 40 },
 * ])
 *   .whereBetween('age', [18, 64])
 *   .pluck('name')
 *   .all()
 * // → ['Alice', 'Dave']
 *
 * @see {@link whereNotBetween} - Exclude items within a range
 * @see {@link where} - Filter by key/value comparison
 *
 * @category Filtering
 */
export const whereBetweenMethod: MethodDefinition<'whereBetween'> = {
	name: 'whereBetween',
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
			if (value >= min && value <= max) {
				result.push(items[i]);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default whereBetweenMethod;
