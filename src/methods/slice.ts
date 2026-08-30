/**
 * slice method - Category A (standalone + method)
 * Extract a slice of items.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone slice function.
 */
export function slice<T>(items: readonly T[], start: number, length?: number): T[] {
	if (length === undefined) {
		return items.slice(start);
	}
	return items.slice(start, start + length);
}

export const sliceMethod: MethodDefinition<'slice'> = {
	name: 'slice',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		start: number,
		length?: number,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result = length === undefined ? items.slice(start) : items.slice(start, start + length);
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default sliceMethod;
