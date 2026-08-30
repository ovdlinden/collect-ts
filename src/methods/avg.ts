/**
 * avg/average method - Category A (standalone + method)
 * Average of items or extracted values.
 */

import type { CoreCollection, CollectionKind, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * Standalone avg function.
 */
export function avg(items: readonly number[]): number | null;
export function avg<T>(items: readonly T[], key: keyof T | ((item: T) => number)): number | null;
export function avg<T>(items: readonly T[], key?: keyof T | ((item: T) => number)): number | null {
	if (items.length === 0) return null;

	if (!key) {
		let total = 0;
		for (let i = 0; i < items.length; i++) {
			total += items[i] as number;
		}
		return total / items.length;
	}

	const getValue = typeof key === 'function' ? key : (item: T) => (item as Record<string, number>)[key as string];
	let total = 0;
	for (let i = 0; i < items.length; i++) {
		total += getValue(items[i]) || 0;
	}
	return total / items.length;
}

export const avgMethod: MethodDefinition<'avg'> = {
	name: 'avg',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: ValueRetriever<T, number>): number | null {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) return null;

		if (!key) {
			let total = 0;
			for (let i = 0; i < items.length; i++) {
				total += (items[i] as number) || 0;
			}
			return total / items.length;
		}

		const getValue = valueRetriever<T, number>(key);
		let total = 0;
		for (let i = 0; i < items.length; i++) {
			total += getValue(items[i], i) || 0;
		}
		return total / items.length;
	},
};

export const averageMethod: MethodDefinition<'average'> = {
	...avgMethod,
	name: 'average',
};

export default avgMethod;
