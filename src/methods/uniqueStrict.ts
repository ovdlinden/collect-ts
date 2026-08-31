/**
 * uniqueStrict method - strict unique filtering.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * The `uniqueStrict` method has the same signature as the `unique` method
 * but uses strict comparison (`===`) to filter unique values.
 *
 * @param keyOrCallback - Property key or callback to determine uniqueness
 * @returns Collection with unique items (strict comparison)
 *
 * @example
 * collect([1, '1', 2, '2', 3])
 *     .uniqueStrict()
 *     .all()
 * // → [1, '1', 2, '2', 3]
 *
 * @example Compare with loose unique:
 * collect([1, '1', 2, '2', 3])
 *     .unique()
 *     .all()
 * // → [1, 2, 3] (loose comparison treats 1 and '1' as equal)
 *
 * @see {@link unique} - Loose equality comparison
 * @see {@link duplicatesStrict} - Find duplicates using strict comparison
 *
 * @category Filtering
 */
export const uniqueStrictMethod: MethodDefinition<'uniqueStrict'> = {
	name: 'uniqueStrict',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrCallback?: ValueRetriever<T, unknown>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (keyOrCallback === undefined) {
			const seen = new Set<T>();
			const result: T[] = [];
			for (const item of items) {
				if (!seen.has(item)) {
					seen.add(item);
					result.push(item);
				}
			}
			return this.newInstance(result) as CoreCollection<T, CK>;
		}

		const getValue = valueRetriever<T, unknown>(keyOrCallback);
		const seen = new Set<unknown>();
		const result: T[] = [];

		for (let i = 0; i < items.length; i++) {
			const value = getValue(items[i], i);
			if (!seen.has(value)) {
				seen.add(value);
				result.push(items[i]);
			}
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default uniqueStrictMethod;
