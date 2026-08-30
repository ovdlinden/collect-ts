/**
 * except method - Category A (standalone + method)
 * Get all except the specified keys.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone except function.
 */
export function except<T, K extends keyof T>(items: T, keys: K[]): Omit<T, K> {
	const result = { ...items } as Omit<T, K>;
	for (const key of keys) {
		delete (result as Record<string, unknown>)[key as string];
	}
	return result;
}

export const exceptMethod: MethodDefinition<'except'> = {
	name: 'except',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keys: string[],
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const keySet = new Set(keys);
		const result: Record<string, T> = {};

		for (const [key, value] of Object.entries(items)) {
			if (!keySet.has(key)) {
				result[key] = value;
			}
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default exceptMethod;
