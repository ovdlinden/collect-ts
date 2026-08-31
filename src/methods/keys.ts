/**
 * keys method - Category A (standalone + method)
 * Get keys as a collection.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone keys function.
 */
export function keys<T>(items: Record<string, T> | readonly T[]): (string | number)[] {
	if (Array.isArray(items)) {
		const result: number[] = new Array(items.length);
		for (let i = 0; i < items.length; i++) {
			result[i] = i;
		}
		return result;
	}
	return Object.keys(items);
}

export const keysMethod: MethodDefinition<'keys'> = {
	name: 'keys',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<string | number, 'array'> {
		const arr = this.getArrayItems();
		if (arr) {
			const result: number[] = new Array(arr.length);
			for (let i = 0; i < arr.length; i++) {
				result[i] = i;
			}
			return this.newInstance(result, false) as CoreCollection<string | number, 'array'>;
		}
		return this.newInstance(Object.keys(this.getItems()), false) as CoreCollection<string | number, 'array'>;
	},
};

export default keysMethod;
