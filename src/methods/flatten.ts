/**
 * flatten method - Category A (standalone + method)
 * Flatten nested arrays to given depth.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone flatten function.
 */
export function flatten<T>(items: readonly unknown[], depth = Infinity): T[] {
	const result: T[] = [];

	function flattenRecursive(arr: readonly unknown[], currentDepth: number): void {
		for (let i = 0; i < arr.length; i++) {
			const item = arr[i];
			if (Array.isArray(item) && currentDepth < depth) {
				flattenRecursive(item, currentDepth + 1);
			} else {
				result.push(item as T);
			}
		}
	}

	flattenRecursive(items, 0);
	return result;
}

export const flattenMethod: MethodDefinition<'flatten'> = {
	name: 'flatten',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, depth = Infinity): CoreCollection<unknown, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: unknown[] = [];

		function flattenRecursive(arr: readonly unknown[], currentDepth: number): void {
			for (let i = 0; i < arr.length; i++) {
				const item = arr[i];
				if (Array.isArray(item) && currentDepth < depth) {
					flattenRecursive(item, currentDepth + 1);
				} else {
					result.push(item);
				}
			}
		}

		flattenRecursive(items, 0);
		return this.newInstance(result) as CoreCollection<unknown, CK>;
	},
};

export default flattenMethod;
