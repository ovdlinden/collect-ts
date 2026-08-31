/**
 * count/countBy methods - Category A (standalone + method)
 * Count items, optionally grouped by key.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
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
	const getValue =
		typeof key === 'function' ? key : (item: T) => String((item as Record<string, unknown>)[key as string]);
	const result: Record<string, number> = Object.create(null);

	for (let i = 0; i < items.length; i++) {
		const k = toGroupKey(getValue(items[i]));
		result[k] = (result[k] || 0) + 1;
	}
	return result;
}

/**
 * The `count` method returns the total number of items in the collection.
 *
 * @returns Number of items
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .count()
 * // → 5
 *
 * @see {@link countBy} - Count grouped by key
 * @see {@link isEmpty} - Check if empty
 *
 * @category Aggregating
 */
export const countMethod: MethodDefinition<'count'> = {
	name: 'count',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): number {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return arr.length;
		}
		return Object.keys(this.getItems()).length;
	},
};

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
