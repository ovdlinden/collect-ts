/**
 * duplicatesStrict method - find duplicates using strict equality.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

type ValueRetriever<T> = string | ((value: T, key: string | number) => unknown);

/**
 * The `duplicatesStrict` method retrieves duplicate values from the collection using strict
 * equality (`===`). Unlike `duplicates`, this method distinguishes between values like `1` and `'1'`.
 *
 * @param callback - Optional key or callback to derive comparison value
 * @returns Collection of duplicate items
 *
 * @example
 * collect([1, 2, 2, '2', 3, 3])
 *     .duplicatesStrict()
 *     .all()
 * // → [2, 3]
 *
 * @example With a key:
 * collect([
 *   { id: 1, email: 'a@test.com' },
 *   { id: 2, email: 'b@test.com' },
 *   { id: 3, email: 'a@test.com' },
 * ])
 *   .duplicatesStrict('email')
 *   .all()
 * // → [{ id: 3, email: 'a@test.com' }]
 *
 * @example Strict vs loose comparison:
 * // duplicatesStrict: 1 !== '1'
 * collect([1, '1', 1])
 *     .duplicatesStrict()
 *     .all()
 * // → [1]
 *
 * // duplicates (loose): 1 == '1'
 * collect([1, '1', 1])
 *     .duplicates()
 *     .all()
 * // → ['1', 1]
 *
 * @see {@link duplicates} - Loose equality comparison
 * @see {@link unique} - Remove duplicates
 *
 * @category Filtering
 */
export const duplicatesStrictMethod: MethodDefinition<'duplicatesStrict'> = {
	name: 'duplicatesStrict',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, callback?: ValueRetriever<T>): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const seen = new Set<unknown>();
		const duplicates: T[] = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			let value: unknown;

			if (callback === undefined) {
				value = item;
			} else if (typeof callback === 'function') {
				value = callback(item, arr ? i : Object.keys(this.getItems())[i]);
			} else {
				value = dataGet(item, callback);
			}

			if (seen.has(value)) {
				duplicates.push(item);
			} else {
				seen.add(value);
			}
		}

		return this.newInstance(duplicates) as CoreCollection<T, CK>;
	},
};

export default duplicatesStrictMethod;
