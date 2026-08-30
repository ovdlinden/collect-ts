/**
 * flip method - Category A (standalone + method)
 * Swap keys and values.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone flip function.
 */
export function flip<T extends string | number>(items: Record<string, T>): Record<string, string> {
	const result: Record<string, string> = Object.create(null);
	for (const [key, value] of Object.entries(items)) {
		result[String(value)] = key;
	}
	return result;
}

export const flipMethod: MethodDefinition<'flip'> = {
	name: 'flip',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<string, 'assoc'> {
		const arr = this.getArrayItems();
		const result: Record<string, string> = Object.create(null);

		if (arr) {
			for (let i = 0; i < arr.length; i++) {
				result[String(arr[i])] = String(i);
			}
		} else {
			const items = this.getItems();
			for (const [key, value] of Object.entries(items)) {
				result[String(value)] = key;
			}
		}

		return this.newInstance(result, true) as CoreCollection<string, 'assoc'>;
	},
};

export default flipMethod;
