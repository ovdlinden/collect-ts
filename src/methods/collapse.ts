/**
 * collapse method - Category A (standalone + method)
 * Collapse a collection of arrays into a single flat collection.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone collapse function.
 */
export function collapse<T>(items: readonly (readonly T[])[]): T[] {
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		const arr = items[i];
		if (Array.isArray(arr)) {
			for (let j = 0; j < arr.length; j++) {
				result.push(arr[j]);
			}
		}
	}
	return result;
}

export const collapseMethod: MethodDefinition<'collapse'> = {
	name: 'collapse',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<unknown, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: unknown[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (Array.isArray(item)) {
				for (let j = 0; j < item.length; j++) {
					result.push(item[j]);
				}
			}
		}
		return this.newInstance(result) as CoreCollection<unknown, CK>;
	},
};

export default collapseMethod;
