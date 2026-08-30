/**
 * take method - Category A (standalone + method)
 * Take first N items (or last N if negative).
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone take function.
 */
export function take<T>(items: readonly T[], count: number): T[] {
	if (count < 0) {
		return items.slice(count);
	}
	return items.slice(0, count);
}

export const takeMethod: MethodDefinition<'take'> = {
	name: 'take',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, count: number): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (count < 0) {
			return this.newInstance(items.slice(count)) as CoreCollection<T, CK>;
		}
		return this.newInstance(items.slice(0, count)) as CoreCollection<T, CK>;
	},
};

export default takeMethod;
