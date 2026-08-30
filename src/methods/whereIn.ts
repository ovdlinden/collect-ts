/**
 * whereIn/whereNotIn methods - Category A (standalone + method)
 * Filter items where key value is in/not in a set.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * Standalone whereIn function.
 */
export function whereIn<T>(items: readonly T[], key: string, values: readonly unknown[]): T[] {
	const set = new Set(values);
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		if (set.has(dataGet(items[i], key))) result.push(items[i]);
	}
	return result;
}

/**
 * Standalone whereNotIn function.
 */
export function whereNotIn<T>(items: readonly T[], key: string, values: readonly unknown[]): T[] {
	const set = new Set(values);
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		if (!set.has(dataGet(items[i], key))) result.push(items[i]);
	}
	return result;
}

export const whereInMethod: MethodDefinition<'whereIn'> = {
	name: 'whereIn',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string,
		values: readonly unknown[],
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const set = new Set(values);

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			if (set.has(dataGet(items[i], key))) result.push(items[i]);
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export const whereNotInMethod: MethodDefinition<'whereNotIn'> = {
	name: 'whereNotIn',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string,
		values: readonly unknown[],
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const set = new Set(values);

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			if (!set.has(dataGet(items[i], key))) result.push(items[i]);
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default whereInMethod;
