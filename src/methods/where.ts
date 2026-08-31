/**
 * where method - Category A (standalone + method)
 * Filter items by key/value comparison.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, WhereOperator } from '../core/index.js';
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

/**
 * The `whereStrict` method filters the collection by a given key/value pair using strict
 * comparison (`===`). Unlike `where`, this method distinguishes between values like `1` and `'1'`.
 *
 * @param key - Property key to check
 * @param value - Value to match with strict equality
 * @returns New collection with matching items
 *
 * @example
 * collect([
 *   { name: 'Jim', age: 27 },
 *   { name: 'Anna', age: '27' },
 *   { name: 'Mark', age: 27 },
 * ])
 *   .whereStrict('age', 27)
 *   .pluck('name')
 *   .all()
 * // → ['Jim', 'Mark']
 *
 * @example Distinguish between null and undefined:
 * collect([
 *   { id: 1, value: null },
 *   { id: 2, value: undefined },
 *   { id: 3, value: 0 },
 * ])
 *   .whereStrict('value', null)
 *   .all()
 * // → [{ id: 1, value: null }]
 *
 * @see {@link where} - Loose equality comparison
 * @see {@link whereIn} - Match against array of values
 *
 * @category Filtering
 */
export const whereStrictMethod: MethodDefinition<'whereStrict'> = {
	name: 'whereStrict',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string, value: unknown): CoreCollection<T, CK> {
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
