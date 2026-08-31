/**
 * with method - ORM-style relation helper for pairing collections.
 */

import type { CollectionKey, CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Interface for collections with map/filter/each methods.
 * Used internally to type the full collection with dynamically attached methods.
 */
interface FullCollection<T, CK extends CollectionKind = 'array'> extends CoreCollection<T, CK> {
	map<R>(callback: (item: T, key: CollectionKey<CK>) => R): FullCollection<R, CK>;
	filter(callback?: (item: T, key: CollectionKey<CK>) => boolean): FullCollection<T, CK>;
	each(callback: (item: T) => unknown): FullCollection<T, CK>;
	all(): CK extends 'array' ? T[] : Record<string, T>;
	count(): number;
}

/**
 * A collection wrapper that pairs a primary collection with a related collection,
 * allowing ORM-style operations where each primary item is paired with filtered
 * related items.
 *
 * @example Pair users with their orders:
 * const users = collect([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
 * const orders = collect([{ userId: 1, total: 100 }, { userId: 1, total: 200 }]);
 * users.with(orders).map((user, related) => ({
 *   ...user,
 *   orderCount: related.count(),
 * }));
 */
export class WithCollection<T, U, CK extends CollectionKind = 'array'> {
	private readonly primary: FullCollection<T, CK>;
	private readonly related: FullCollection<U, CollectionKind>;

	constructor(primary: CoreCollection<T, CK>, related: CoreCollection<U, CollectionKind>) {
		this.primary = primary as FullCollection<T, CK>;
		this.related = related as FullCollection<U, CollectionKind>;
	}

	/**
	 * Map over the primary collection with access to filtered related items.
	 *
	 * @param fn - Function receiving each primary item and its related items
	 * @returns New collection with mapped results
	 */
	map<R>(fn: (item: T, related: FullCollection<U, CollectionKind>) => R): FullCollection<R, CK> {
		return this.primary.map((item: T) => {
			const filtered = this.related.filter((value: U) => (value as unknown) === (item as unknown));
			return fn(item, filtered);
		});
	}

	/**
	 * Map over the primary collection with key and access to filtered related items.
	 *
	 * @param fn - Function receiving each primary item, its key, and related items
	 * @returns New collection with mapped results
	 */
	mapWithKey<R>(
		fn: (item: T, key: CollectionKey<CK>, related: FullCollection<U, CollectionKind>) => R,
	): FullCollection<R, CK> {
		return this.primary.map((item: T, key: CollectionKey<CK>) => {
			const filtered = this.related.filter((value: U) => (value as unknown) === (item as unknown));
			return fn(item, key, filtered);
		});
	}

	/**
	 * Iterate over the primary collection with access to filtered related items.
	 *
	 * @param fn - Function receiving each primary item and its related items
	 * @returns This WithCollection for chaining
	 */
	each(fn: (item: T, related: FullCollection<U, CollectionKind>) => unknown): this {
		this.primary.each((item: T) => {
			const filtered = this.related.filter((value: U) => (value as unknown) === (item as unknown));
			return fn(item, filtered);
		});
		return this;
	}

	/**
	 * Get all items from the primary collection.
	 *
	 * @returns Array or record of primary items
	 */
	all(): CK extends 'array' ? T[] : Record<string, T> {
		return this.primary.all();
	}
}

/**
 * The `with` method pairs the collection with a related collection, creating a
 * WithCollection that allows ORM-style operations where each primary item can be
 * processed alongside filtered related items.
 *
 * @param related - Collection of related items
 * @returns WithCollection for chained operations
 *
 * @example Pair users with their orders:
 * const users = collect([{ id: 1, name: 'Alice' }]);
 * const orders = collect([{ userId: 1, total: 100 }]);
 * users.with(orders).map((user, related) => ({
 *   ...user,
 *   orderCount: related.count(),
 * }))
 *
 * @see {@link crossJoin} - Create cartesian product of two collections
 * @see {@link zip} - Pair items by index
 *
 * @category Combining
 */
export const withMethod: MethodDefinition<'with'> = {
	name: 'with',
	chainable: false,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		related: CoreCollection<U, CollectionKind>,
	): WithCollection<T, U, CK> {
		return new WithCollection(this, related);
	},
};

export default withMethod;
