/**
 * whereInstanceOf/whereInStrict/whereNotInStrict methods.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `whereInstanceOf` method filters the collection by a given class type,
 * keeping only items that are instances of the specified class.
 *
 * @param type - Constructor class to check against
 * @returns New collection containing only instances of the given type
 *
 * @example
 * class User {}
 * class Admin extends User {}
 * collect([new User(), new Admin(), { name: 'plain' }])
 *     .whereInstanceOf(User)
 *     .count()
 * // → 2 (User and Admin)
 *
 * @see {@link filter} - Filter with a custom callback
 *
 * @category Filtering
 */
export const whereInstanceOfMethod: MethodDefinition<'whereInstanceOf'> = {
	name: 'whereInstanceOf',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		type: new (...args: unknown[]) => U,
	): CoreCollection<U, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result = items.filter((item) => item instanceof type) as unknown as U[];
		return this.newInstance(result) as unknown as CoreCollection<U, CK>;
	},
};

/**
 * The `whereInStrict` method filters the collection using strict comparison.
 *
 * @param key - Property key to check
 * @param values - Array of values to match
 * @returns New collection with matching items
 *
 * @example
 * collect([
 *   { id: 1, value: '1' },
 *   { id: 2, value: 1 },
 * ])
 *   .whereInStrict('value', [1])
 *   .all()
 * // → [{ id: 2, value: 1 }]
 *
 * @see {@link whereIn} - Loose comparison
 * @see {@link whereNotInStrict} - Inverse
 *
 * @category Filtering
 */
export const whereInStrictMethod: MethodDefinition<'whereInStrict'> = {
	name: 'whereInStrict',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string, values: unknown[]): CoreCollection<T, CK> {
		const whereIn = (this as unknown as { whereIn: (k: string, v: unknown[], s: boolean) => CoreCollection<T, CK> })
			.whereIn;
		return whereIn.call(this, key, values, true);
	},
};

/**
 * The `whereNotInStrict` method filters the collection using strict comparison.
 *
 * @param key - Property key to check
 * @param values - Array of values to exclude
 * @returns New collection with non-matching items
 *
 * @example
 * collect([
 *   { id: 1, value: '1' },
 *   { id: 2, value: 1 },
 * ])
 *   .whereNotInStrict('value', [1])
 *   .all()
 * // → [{ id: 1, value: '1' }]
 *
 * @see {@link whereNotIn} - Loose comparison
 * @see {@link whereInStrict} - Inverse
 *
 * @category Filtering
 */
export const whereNotInStrictMethod: MethodDefinition<'whereNotInStrict'> = {
	name: 'whereNotInStrict',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string, values: unknown[]): CoreCollection<T, CK> {
		const whereNotIn = (
			this as unknown as { whereNotIn: (k: string, v: unknown[], s: boolean) => CoreCollection<T, CK> }
		).whereNotIn;
		return whereNotIn.call(this, key, values, true);
	},
};

export default whereInstanceOfMethod;
