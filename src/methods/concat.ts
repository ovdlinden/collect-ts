/**
 * concat method - Category A (standalone + method)
 * Concatenate arrays.
 */

import { CoreCollection, type CollectionKind, type MethodDefinition } from '../core/index.js';

/**
 * Standalone concat function.
 */
export function concat<T>(items: readonly T[], ...others: readonly (readonly T[])[]): T[] {
	const result = [...items];
	for (const arr of others) {
		for (let i = 0; i < arr.length; i++) {
			result.push(arr[i]);
		}
	}
	return result;
}

export const concatMethod: MethodDefinition<'concat'> = {
	name: 'concat',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		other: T[] | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const otherItems =
			other instanceof CoreCollection ? (other.all() as T[]) : Array.isArray(other) ? other : Object.values(other);

		return this.newInstance([...items, ...otherItems]) as CoreCollection<T, CK>;
	},
};

export default concatMethod;
