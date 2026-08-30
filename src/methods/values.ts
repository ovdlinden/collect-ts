/**
 * values method - Category A (standalone + method)
 * Get values as a new collection with reset keys.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone values function.
 */
export function values<T>(items: Record<string, T> | readonly T[]): T[] {
	return Array.isArray(items) ? [...items] : Object.values(items);
}

export const valuesMethod: MethodDefinition<'values'> = {
	name: 'values',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, 'array'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		return this.newInstance([...items], false) as CoreCollection<T, 'array'>;
	},
};

export default valuesMethod;
