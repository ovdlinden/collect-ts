/**
 * percentage method - calculate percentage of matching items.
 */

import type { CollectionKey, CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `percentage` method may be used to quickly determine the percentage of
 * items in the collection that pass a given truth test.
 *
 * @param callback - Function to test each item
 * @param precision - Decimal places (default: 2)
 * @returns Percentage of items passing the test, or null if empty
 *
 * @example
 * collect([1, 1, 2, 2, 2, 3])
 *     .percentage(value => value === 1)
 * // → 33.33
 *
 * @example With objects:
 * collect([
 *   { product: 'Desk', active: true },
 *   { product: 'Chair', active: true },
 *   { product: 'Lamp', active: false },
 * ])
 *   .percentage(item => item.active)
 * // → 66.67
 *
 * @example Custom precision:
 * collect([1, 2, 3, 4, 5])
 *     .percentage(n => n > 3, 0)
 * // → 40
 *
 * @see {@link count} - Count items
 * @see {@link filter} - Filter matching items
 *
 * @category Aggregating
 */
export const percentageMethod: MethodDefinition<'percentage'> = {
	name: 'percentage',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: CollectionKey<CK>) => boolean,
		precision = 2,
	): number | null {
		const total = this.count();
		if (total === 0) return null;

		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		let matchCount = 0;

		for (let i = 0; i < items.length; i++) {
			const key = arr ? i : Object.keys(this.getItems())[i];
			if (callback(items[i], key as CollectionKey<CK>)) {
				matchCount++;
			}
		}

		return Number(((matchCount / total) * 100).toFixed(precision));
	},
};

export default percentageMethod;
