/**
 * lazy method - convert to LazyCollection for deferred processing.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `lazy` method returns a new LazyCollection instance from the underlying items.
 *
 * This is particularly useful when you need to perform transformations on a large collection
 * and want to defer processing until the items are actually needed. LazyCollection only
 * processes items as they're consumed, which can significantly reduce memory usage and
 * improve performance for large datasets.
 *
 * @returns A LazyCollection wrapping the same items
 *
 * @example Convert to lazy for deferred processing:
 * collect([1, 2, 3, 4, 5])
 *     .lazy()
 *     .map(n => n * 2)
 *     .filter(n => n > 4)
 *     .take(2)
 *     .all()
 * // → [6, 8]
 *
 * @example Memory-efficient processing of large data:
 * const hugeArray = Array.from({ length: 1000000 }, (_, i) => i)
 * collect(hugeArray)
 *     .lazy()
 *     .filter(n => n % 1000 === 0)
 *     .map(n => n * 2)
 *     .take(10)
 *     .all()
 * // Only processes items until 10 matches found
 *
 * @example Chaining with eager collection methods:
 * collect(['a', 'b', 'c'])
 *     .lazy()
 *     .map(s => s.toUpperCase())
 *     .collect()  // Convert back to eager Collection
 *     .join(', ')
 * // → 'A, B, C'
 *
 * @see {@link collect} - Convert back to eager Collection
 *
 * @category Transforming
 */
export const lazyMethod: MethodDefinition<'lazy'> = {
	name: 'lazy',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): unknown {
		// Implementation delegates to LazyCollection
		// The actual implementation lives in Collection.ts as it needs LazyCollection import
		const arr = this.getArrayItems();
		if (arr !== null) {
			// Return items for wrapping by LazyCollection
			return arr;
		}
		return Object.values(this.getItems());
	},
};

/**
 * Find the first item matching a predicate without creating LazyCollection.
 * Faster than `.lazy().first()` for simple lookups.
 *
 * @param callback - Optional predicate function to test each item
 * @returns The first matching item, or undefined if none found
 *
 * @example Get first item:
 * collect([1, 2, 3]).lazyFirst()
 * // → 1
 *
 * @example Find first matching item:
 * collect([1, 2, 3, 4, 5])
 *     .lazyFirst(n => n > 3)
 * // → 4
 *
 * @see {@link first} - Standard first method
 * @see {@link lazy} - Convert to lazy collection
 *
 * @category Searching
 */
export const lazyFirstMethod: MethodDefinition<'lazyFirst'> = {
	name: 'lazyFirst',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: (value: T, key: number) => boolean,
	): T | undefined {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (!callback) return items[0];

		for (let i = 0; i < items.length; i++) {
			if (callback(items[i], i)) return items[i];
		}

		return undefined;
	},
};

export default lazyMethod;
