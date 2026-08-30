/**
 * map method - Category A (standalone + method)
 *
 * @example Standalone usage
 * import { map } from 'collect-ts/fn';
 * const names = map(users, u => u.name);
 *
 * @example Method usage
 * collect(users).map(u => u.name);
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone map function.
 * Works on plain arrays without Collection overhead.
 *
 * @param items - Array to map
 * @param callback - Transform function
 * @returns Mapped array
 *
 * @example
 * map([1, 2, 3], x => x * 2)
 * // → [2, 4, 6]
 */
export function map<T, U>(items: readonly T[], callback: (value: T, index: number) => U): U[] {
	const result: U[] = new Array(items.length);
	for (let i = 0; i < items.length; i++) {
		result[i] = callback(items[i], i);
	}
	return result;
}

/**
 * Method definition for Collection attachment.
 */
export const mapMethod: MethodDefinition<'map'> = {
	name: 'map',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: number | string) => U,
	): CoreCollection<U, CK> {
		const arr = this.getArrayItems();
		if (arr) {
			const result: U[] = new Array(arr.length);
			for (let i = 0; i < arr.length; i++) {
				result[i] = callback(arr[i], i);
			}
			return this.newInstance(result) as CoreCollection<U, CK>;
		}

		// Object path
		const items = this.getItems();
		const result: Record<string, U> = {};
		for (const [key, value] of Object.entries(items)) {
			result[key] = callback(value, key);
		}
		return this.newInstance(result, true) as CoreCollection<U, CK>;
	},
};

export default mapMethod;
