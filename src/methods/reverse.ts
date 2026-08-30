/**
 * reverse method - Category A (standalone + method)
 * Reverse the order of items.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone reverse function.
 */
export function reverse<T>(items: readonly T[]): T[] {
	const result: T[] = new Array(items.length);
	for (let i = 0, j = items.length - 1; j >= 0; i++, j--) {
		result[i] = items[j];
	}
	return result;
}

export const reverseMethod: MethodDefinition<'reverse'> = {
	name: 'reverse',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: T[] = new Array(items.length);
		for (let i = 0, j = items.length - 1; j >= 0; i++, j--) {
			result[i] = items[j];
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default reverseMethod;
