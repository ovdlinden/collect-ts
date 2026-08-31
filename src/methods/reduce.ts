/**
 * reduce method - Category A (standalone + method)
 *
 * @example Standalone usage
 * import { reduce } from 'collect-ts/fn';
 * const total = reduce(prices, (sum, p) => sum + p, 0);
 *
 * @example Method usage
 * collect(prices).reduce((sum, p) => sum + p, 0);
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone reduce function.
 * Reduces an array to a single value.
 *
 * @param items - Array to reduce
 * @param callback - Reducer function
 * @param initial - Initial value
 * @returns Reduced value
 *
 * @example Sum numbers
 * reduce([1, 2, 3], (sum, n) => sum + n, 0)
 * // → 6
 *
 * @example Build object
 * reduce(users, (acc, u) => ({ ...acc, [u.id]: u }), {})
 * // → { 1: {...}, 2: {...} }
 */
export function reduce<T, U>(items: readonly T[], callback: (carry: U, value: T, index: number) => U, initial: U): U {
	let result = initial;
	for (let i = 0; i < items.length; i++) {
		result = callback(result, items[i], i);
	}
	return result;
}

/**
 * Method definition for Collection attachment.
 */
export const reduceMethod: MethodDefinition<'reduce'> = {
	name: 'reduce',
	chainable: false,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (carry: U, value: T, key: number | string) => U,
		initial: U,
	): U {
		const arr = this.getArrayItems();
		if (arr) {
			let result = initial;
			for (let i = 0; i < arr.length; i++) {
				result = callback(result, arr[i], i);
			}
			return result;
		}

		// Object path
		const items = this.getItems();
		let result = initial;
		for (const [key, value] of Object.entries(items)) {
			result = callback(result, value, key);
		}
		return result;
	},
};

export default reduceMethod;
