/**
 * where method - Category A (standalone + method)
 * Filter items by key/value comparison.
 */

import type { CoreCollection, CollectionKind, MethodDefinition, WhereOperator } from '../core/index.js';
import { dataGet, operatorForWhere } from '../core/utils.js';

/**
 * Standalone where function.
 */
export function where<T>(
	items: readonly T[],
	key: string,
	operatorOrValue?: WhereOperator | unknown,
	value?: unknown,
): T[] {
	const predicate = operatorForWhere<T>(key, operatorOrValue, value);
	const result: T[] = [];
	for (let i = 0; i < items.length; i++) {
		if (predicate(items[i], i)) result.push(items[i]);
	}
	return result;
}

export const whereMethod: MethodDefinition<'where'> = {
	name: 'where',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string | ((item: T, key: number | string) => boolean),
		operatorOrValue?: WhereOperator | unknown,
		value?: unknown,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const predicate = operatorForWhere<T>(key, operatorOrValue, value);

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const k = arr ? i : Object.keys(this.getItems())[i];
			if (predicate(items[i], k)) result.push(items[i]);
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export const whereStrictMethod: MethodDefinition<'whereStrict'> = {
	name: 'whereStrict',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string,
		value: unknown,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			if (dataGet(items[i], key) === value) result.push(items[i]);
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default whereMethod;
