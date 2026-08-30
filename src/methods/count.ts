/**
 * count/countBy methods - Category A (standalone + method)
 * Count items, optionally grouped by key.
 */

import type { CoreCollection, CollectionKind, MethodDefinition, ValueRetriever } from '../core/index.js';
import { toGroupKey, valueRetriever } from '../core/utils.js';

/**
 * Standalone count function.
 */
export function count<T>(items: readonly T[]): number {
	return items.length;
}

/**
 * Standalone countBy function.
 */
export function countBy<T>(items: readonly T[], key: keyof T | ((item: T) => string)): Record<string, number> {
	const getValue = typeof key === 'function' ? key : (item: T) => String((item as Record<string, unknown>)[key as string]);
	const result: Record<string, number> = Object.create(null);

	for (let i = 0; i < items.length; i++) {
		const k = toGroupKey(getValue(items[i]));
		result[k] = (result[k] || 0) + 1;
	}
	return result;
}

export const countByMethod: MethodDefinition<'countBy'> = {
	name: 'countBy',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key?: ValueRetriever<T, string>,
	): CoreCollection<number, 'assoc'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (!key) {
			const result: Record<string, number> = Object.create(null);
			for (let i = 0; i < items.length; i++) {
				const k = toGroupKey(items[i]);
				result[k] = (result[k] || 0) + 1;
			}
			return this.newInstance(result, true) as CoreCollection<number, 'assoc'>;
		}

		const getValue = valueRetriever<T, string>(key);
		const result: Record<string, number> = Object.create(null);
		for (let i = 0; i < items.length; i++) {
			const k = toGroupKey(getValue(items[i], i));
			result[k] = (result[k] || 0) + 1;
		}
		return this.newInstance(result, true) as CoreCollection<number, 'assoc'>;
	},
};

export default countByMethod;
