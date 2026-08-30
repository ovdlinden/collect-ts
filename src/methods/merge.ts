/**
 * merge method - Category A (standalone + method)
 * Merge arrays or objects.
 */

import { CoreCollection, type CollectionKind, type MethodDefinition } from '../core/index.js';

/**
 * Standalone merge function for arrays.
 */
export function merge<T>(items: readonly T[], other: readonly T[]): T[] {
	return [...items, ...other];
}

export const mergeMethod: MethodDefinition<'merge'> = {
	name: 'merge',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		other: T[] | Record<string, T> | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();

		if (other instanceof CoreCollection) {
			other = other.all() as T[] | Record<string, T>;
		}

		if (arr && Array.isArray(other)) {
			return this.newInstance([...arr, ...other]) as CoreCollection<T, CK>;
		}

		const items = this.getItems();
		const otherItems = Array.isArray(other)
			? Object.fromEntries(other.map((v, i) => [String(i), v]))
			: other;

		return this.newInstance({ ...items, ...otherItems }, true) as CoreCollection<T, CK>;
	},
};

export default mergeMethod;
