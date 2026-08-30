/**
 * flatMap method - Category A (standalone + method)
 * Maps and flattens in one pass.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone flatMap function.
 * Maps each item and flattens the result by one level.
 */
export function flatMap<T, U>(items: readonly T[], callback: (value: T, index: number) => U | U[]): U[] {
	const result: U[] = [];
	for (let i = 0; i < items.length; i++) {
		const mapped = callback(items[i], i);
		if (Array.isArray(mapped)) {
			for (let j = 0; j < mapped.length; j++) {
				result.push(mapped[j]);
			}
		} else {
			result.push(mapped);
		}
	}
	return result;
}

export const flatMapMethod: MethodDefinition<'flatMap'> = {
	name: 'flatMap',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: number | string) => U | U[],
	): CoreCollection<U, CK> {
		const arr = this.getArrayItems();
		if (arr) {
			const result: U[] = [];
			for (let i = 0; i < arr.length; i++) {
				const mapped = callback(arr[i], i);
				if (Array.isArray(mapped)) {
					for (let j = 0; j < mapped.length; j++) {
						result.push(mapped[j]);
					}
				} else {
					result.push(mapped);
				}
			}
			return this.newInstance(result) as CoreCollection<U, CK>;
		}

		const items = this.getItems();
		const result: U[] = [];
		for (const [key, value] of Object.entries(items)) {
			const mapped = callback(value, key);
			if (Array.isArray(mapped)) {
				for (let j = 0; j < mapped.length; j++) {
					result.push(mapped[j]);
				}
			} else {
				result.push(mapped);
			}
		}
		return this.newInstance(result) as CoreCollection<U, CK>;
	},
};

export default flatMapMethod;
