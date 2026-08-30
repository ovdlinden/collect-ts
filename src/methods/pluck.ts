/**
 * pluck method - Category A (standalone + method)
 * Extracts values for a given key from each item.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * Standalone pluck function.
 * Extracts values for a given key.
 */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][];
export function pluck<T>(items: readonly T[], key: string): unknown[];
export function pluck<T>(items: readonly T[], key: string): unknown[] {
	const result: unknown[] = new Array(items.length);
	const simple = !key.includes('.');

	for (let i = 0; i < items.length; i++) {
		result[i] = simple ? (items[i] as Record<string, unknown>)[key] : dataGet(items[i], key);
	}
	return result;
}

export const pluckMethod: MethodDefinition<'pluck'> = {
	name: 'pluck',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: string,
		key?: string,
	): CoreCollection<unknown, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const simple = !value.includes('.');

		if (key) {
			const result: Record<string, unknown> = {};
			const keySimple = !key.includes('.');
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const k = keySimple ? (item as Record<string, unknown>)[key] : dataGet(item, key);
				const v = simple ? (item as Record<string, unknown>)[value] : dataGet(item, value);
				result[String(k)] = v;
			}
			return this.newInstance(result, true) as CoreCollection<unknown, CK>;
		}

		const result: unknown[] = new Array(items.length);
		for (let i = 0; i < items.length; i++) {
			result[i] = simple ? (items[i] as Record<string, unknown>)[value] : dataGet(items[i], value);
		}
		return this.newInstance(result) as CoreCollection<unknown, CK>;
	},
};

export default pluckMethod;
