/**
 * whereNull/whereNotNull methods - filter by null/undefined values.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `whereNull` method filters the collection by determining if a specified
 * item value is null or undefined.
 *
 * @param key - Property key to check (if omitted, checks item itself)
 * @returns New collection with null/undefined values
 *
 * @example
 * collect([
 *   { name: 'Taylor', email: 'taylor@example.com' },
 *   { name: 'James', email: null },
 *   { name: 'Victoria', email: undefined },
 * ])
 *   .whereNull('email')
 *   .all()
 * // → [
 * //     { name: 'James', email: null },
 * //     { name: 'Victoria', email: undefined },
 * //   ]
 *
 * @example Filter items that are null:
 * collect([1, null, 3, undefined, 5])
 *     .whereNull()
 *     .all()
 * // → [null, undefined]
 *
 * @see {@link whereNotNull} - Filter items that are not null
 * @see {@link where} - Filter by key/value comparison
 *
 * @category Filtering
 */
export const whereNullMethod: MethodDefinition<'whereNull'> = {
	name: 'whereNull',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: string): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const value = key ? dataGet(items[i], key) : items[i];
			if (value === null || value === undefined) {
				result.push(items[i]);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

/**
 * The `whereNotNull` method filters the collection by determining if a specified
 * item value is not null and not undefined.
 *
 * @param key - Property key to check (if omitted, checks item itself)
 * @returns New collection with non-null values
 *
 * @example
 * collect([
 *   { name: 'Taylor', email: 'taylor@example.com' },
 *   { name: 'James', email: null },
 *   { name: 'Victoria', email: undefined },
 * ])
 *   .whereNotNull('email')
 *   .all()
 * // → [{ name: 'Taylor', email: 'taylor@example.com' }]
 *
 * @example Filter truthy items:
 * collect([1, null, 3, undefined, 5])
 *     .whereNotNull()
 *     .all()
 * // → [1, 3, 5]
 *
 * @see {@link whereNull} - Filter items that are null
 * @see {@link filter} - Filter with custom callback
 *
 * @category Filtering
 */
export const whereNotNullMethod: MethodDefinition<'whereNotNull'> = {
	name: 'whereNotNull',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: string): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const value = key ? dataGet(items[i], key) : items[i];
			if (value !== null && value !== undefined) {
				result.push(items[i]);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default whereNullMethod;
