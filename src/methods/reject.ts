/**
 * reject method - Category A (standalone + method)
 * Inverse of filter - removes items matching the predicate.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone reject function.
 * Returns items that do NOT match the predicate.
 */
export function reject<T>(items: readonly T[], callback?: (value: T, index: number) => boolean): T[] {
	const cb = callback ?? Boolean;
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		if (!cb(items[i], i)) result.push(items[i]);
	}
	return result;
}

export const rejectMethod: MethodDefinition<'reject'> = {
	name: 'reject',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: (value: T, key: number | string) => boolean,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr) {
			if (!callback) {
				return this.newInstance(arr.filter((v) => !v)) as CoreCollection<T, CK>;
			}
			const result: T[] = [];
			for (let i = 0; i < arr.length; i++) {
				if (!callback(arr[i], i)) result.push(arr[i]);
			}
			return this.newInstance(result) as CoreCollection<T, CK>;
		}

		const items = this.getItems();
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(items)) {
			if (!(callback ? callback(value, key) : value)) {
				result[key] = value;
			}
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default rejectMethod;
