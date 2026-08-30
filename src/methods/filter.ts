/**
 * filter method - Category A (standalone + method)
 *
 * @example Standalone usage
 * import { filter } from 'collect-ts/fn';
 * const active = filter(users, u => u.active);
 *
 * @example Method usage
 * collect(users).filter(u => u.active);
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone filter function.
 * Works on plain arrays without Collection overhead.
 *
 * @param items - Array to filter
 * @param callback - Predicate function (defaults to truthy check)
 * @returns Filtered array
 *
 * @example Filter truthy values
 * filter([0, 1, false, 2, '', 3])
 * // → [1, 2, 3]
 *
 * @example Filter with predicate
 * filter(users, u => u.age >= 18)
 * // → adult users
 */
export function filter<T>(items: readonly T[], callback?: (value: T, index: number) => boolean): T[] {
	const cb = callback ?? Boolean;
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		if (cb(items[i], i)) result.push(items[i]);
	}
	return result;
}

/**
 * Method definition for Collection attachment.
 * The SWC plugin imports this to build tree-shakeable Collections.
 */
export const filterMethod: MethodDefinition<'filter'> = {
	name: 'filter',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: (value: T, key: number | string) => boolean,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr) {
			if (!callback) {
				return this.newInstance(arr.filter(Boolean)) as CoreCollection<T, CK>;
			}
			const result: T[] = [];
			for (let i = 0; i < arr.length; i++) {
				if (callback(arr[i], i)) result.push(arr[i]);
			}
			return this.newInstance(result) as CoreCollection<T, CK>;
		}

		// Object path
		const items = this.getItems();
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(items)) {
			if (callback ? callback(value, key) : value) {
				result[key] = value;
			}
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default filterMethod;
