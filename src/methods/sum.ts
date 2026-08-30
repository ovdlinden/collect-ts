/**
 * sum method - Category A (standalone + method)
 * Sum of items or extracted values.
 */

import type { CoreCollection, CollectionKind, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * Standalone sum function.
 */
export function sum(items: readonly number[]): number;
export function sum<T>(items: readonly T[], key: keyof T | ((item: T) => number)): number;
export function sum<T>(items: readonly T[], key?: keyof T | ((item: T) => number)): number {
	if (!key) {
		let total = 0;
		for (let i = 0; i < items.length; i++) {
			total += items[i] as number;
		}
		return total;
	}

	const getValue = typeof key === 'function' ? key : (item: T) => (item as Record<string, number>)[key as string];
	let total = 0;
	for (let i = 0; i < items.length; i++) {
		total += getValue(items[i]) || 0;
	}
	return total;
}

export const sumMethod: MethodDefinition<'sum'> = {
	name: 'sum',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: ValueRetriever<T, number>): number {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (!key) {
			let total = 0;
			for (let i = 0; i < items.length; i++) {
				total += (items[i] as number) || 0;
			}
			return total;
		}

		const getValue = valueRetriever<T, number>(key);
		let total = 0;
		for (let i = 0; i < items.length; i++) {
			total += getValue(items[i], i) || 0;
		}
		return total;
	},
};

export default sumMethod;
