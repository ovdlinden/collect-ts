/**
 * average method - alias for avg.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

type ValueRetriever<T> = string | ((value: T, key: string | number) => number);

/**
 * The `average` method returns the average value of a given key.
 * This is an alias for the {@link avg} method.
 *
 * @param keyOrCallback - Property key or callback returning number
 * @returns Average value, or null if collection is empty
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .average()
 * // → 3
 *
 * @example With a key:
 * collect([
 *   { name: 'Chair', price: 100 },
 *   { name: 'Desk', price: 200 },
 *   { name: 'Lamp', price: 50 },
 * ])
 *   .average('price')
 * // → 116.67 (rounded: 350 / 3)
 *
 * @example With a callback:
 * collect([
 *   { quantity: 2, price: 10 },
 *   { quantity: 3, price: 20 },
 * ])
 *   .average(item => item.quantity * item.price)
 * // → 40 ((20 + 60) / 2)
 *
 * @see {@link avg} - Primary method
 * @see {@link sum} - Sum all values
 * @see {@link median} - Get median value
 *
 * @category Aggregating
 */
export const averageMethod: MethodDefinition<'average'> = {
	name: 'average',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, keyOrCallback?: ValueRetriever<T>): number | null {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) return null;

		let total = 0;
		let count = 0;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			let value: number;

			if (keyOrCallback === undefined) {
				value = Number(item);
			} else if (typeof keyOrCallback === 'function') {
				value = keyOrCallback(item, arr ? i : Object.keys(this.getItems())[i]);
			} else {
				value = Number(dataGet(item, keyOrCallback));
			}

			if (!Number.isNaN(value)) {
				total += value;
				count++;
			}
		}

		return count > 0 ? total / count : null;
	},
};

export default averageMethod;
