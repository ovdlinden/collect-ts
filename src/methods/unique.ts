/**
 * unique method - Category A (standalone + method)
 * Returns unique items, optionally by key.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * Standalone unique function.
 */
export function unique<T>(items: readonly T[], key?: keyof T | ((item: T) => unknown)): T[] {
	if (!key) {
		const seen = new Set<T>();
		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!seen.has(item)) {
				seen.add(item);
				result.push(item);
			}
		}
		return result;
	}

	const getValue = typeof key === 'function' ? key : (item: T) => (item as Record<string, unknown>)[key as string];
	const seen = new Set<unknown>();
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const k = getValue(item);
		if (!seen.has(k)) {
			seen.add(k);
			result.push(item);
		}
	}
	return result;
}

export const uniqueMethod: MethodDefinition<'unique'> = {
	name: 'unique',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key?: ValueRetriever<T, unknown>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (!key) {
			const seen = new Set<T>();
			const result: T[] = [];
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (!seen.has(item)) {
					seen.add(item);
					result.push(item);
				}
			}
			return this.newInstance(result) as CoreCollection<T, CK>;
		}

		const getValue = valueRetriever<T, unknown>(key);
		const seen = new Set<unknown>();
		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const k = getValue(item, i);
			if (!seen.has(k)) {
				seen.add(k);
				result.push(item);
			}
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default uniqueMethod;
