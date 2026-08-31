/**
 * chunk method - Category A (standalone + method)
 * Split into chunks of given size.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone chunk function.
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
	if (size <= 0) return [];
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
}

export const chunkMethod: MethodDefinition<'chunk'> = {
	name: 'chunk',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		size: number,
	): CoreCollection<CoreCollection<T, CK>, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (size <= 0) return this.newInstance([]) as CoreCollection<CoreCollection<T, CK>, CK>;

		const result: CoreCollection<T, CK>[] = [];
		for (let i = 0; i < items.length; i += size) {
			result.push(this.newInstance(items.slice(i, i + size)) as CoreCollection<T, CK>);
		}
		return this.newInstance(result) as CoreCollection<CoreCollection<T, CK>, CK>;
	},
};

export default chunkMethod;
