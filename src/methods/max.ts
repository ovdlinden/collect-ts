/**
 * max method - Category A (standalone + method)
 * Maximum value of items or extracted values.
 */

import type { CoreCollection, CollectionKind, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * Standalone max function.
 */
export function max(items: readonly number[]): number | null;
export function max<T>(items: readonly T[], key: keyof T | ((item: T) => number)): number | null;
export function max<T>(items: readonly T[], key?: keyof T | ((item: T) => number)): number | null {
	if (items.length === 0) return null;

	if (!key) {
		let result = items[0] as number;
		for (let i = 1; i < items.length; i++) {
			const v = items[i] as number;
			if (v > result) result = v;
		}
		return result;
	}

	const getValue = typeof key === 'function' ? key : (item: T) => (item as Record<string, number>)[key as string];
	let result = getValue(items[0]);
	for (let i = 1; i < items.length; i++) {
		const v = getValue(items[i]);
		if (v > result) result = v;
	}
	return result;
}

export const maxMethod: MethodDefinition<'max'> = {
	name: 'max',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: ValueRetriever<T, number>): number | null {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) return null;

		if (!key) {
			let result = items[0] as number;
			for (let i = 1; i < items.length; i++) {
				const v = items[i] as number;
				if (v > result) result = v;
			}
			return result;
		}

		const getValue = valueRetriever<T, number>(key);
		let result = getValue(items[0], 0);
		for (let i = 1; i < items.length; i++) {
			const v = getValue(items[i], i);
			if (v > result) result = v;
		}
		return result;
	},
};

export default maxMethod;
