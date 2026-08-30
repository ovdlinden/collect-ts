/**
 * keyBy method - Category A (standalone + method)
 * Key the collection by the given key.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
import { toGroupKey, valueRetriever } from '../core/utils.js';

/**
 * Standalone keyBy function.
 */
export function keyBy<T>(items: readonly T[], key: keyof T | ((item: T, index: number) => string)): Record<string, T> {
	const getValue =
		typeof key === 'function' ? key : (item: T) => String((item as Record<string, unknown>)[key as string]);
	const result: Record<string, T> = Object.create(null);
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		result[getValue(item, i)] = item;
	}
	return result;
}

export const keyByMethod: MethodDefinition<'keyBy'> = {
	name: 'keyBy',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: ValueRetriever<T, string>,
	): CoreCollection<T, 'assoc'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const getValue = valueRetriever<T, string>(key);

		const result: Record<string, T> = Object.create(null);
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			result[toGroupKey(getValue(item, i))] = item;
		}
		return this.newInstance(result, true) as CoreCollection<T, 'assoc'>;
	},
};

export default keyByMethod;
