/**
 * skip method - Category A (standalone + method)
 * Skip first N items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone skip function.
 */
export function skip<T>(items: readonly T[], count: number): T[] {
	return items.slice(count);
}

export const skipMethod: MethodDefinition<'skip'> = {
	name: 'skip',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, count: number): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		return this.newInstance(items.slice(count)) as CoreCollection<T, CK>;
	},
};

export default skipMethod;
