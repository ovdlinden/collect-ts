/**
 * sliding/forPage methods - windowing operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `sliding` method returns a new collection of chunks representing a
 * "sliding window" view of the items in the collection.
 *
 * @param size - Window size (default: 2)
 * @param step - Step between windows (default: 1)
 * @returns Collection of collections representing windows
 *
 * @example Default size=2, step=1:
 * collect([1, 2, 3, 4, 5])
 *     .sliding()
 *     .toArray()
 * // → [[1, 2], [2, 3], [3, 4], [4, 5]]
 *
 * @example With step=2:
 * collect([1, 2, 3, 4, 5])
 *     .sliding(2, 2)
 *     .toArray()
 * // → [[1, 2], [3, 4]]
 *
 * @example With size=3:
 * collect([1, 2, 3, 4, 5])
 *     .sliding(3)
 *     .toArray()
 * // → [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
 *
 * @see {@link chunk} - Fixed-size chunks without overlap
 * @see {@link split} - Split into N groups
 *
 * @category Grouping
 */
export const slidingMethod: MethodDefinition<'sliding'> = {
	name: 'sliding',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		size = 2,
		step = 1,
	): CoreCollection<CoreCollection<T, CK>, 'array'> {
		if (size < 1) {
			throw new Error('Size value must be at least 1.');
		}
		if (step < 1) {
			throw new Error('Step value must be at least 1.');
		}

		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const count = items.length;
		const chunks = Math.floor((count - size) / step) + 1;

		if (chunks < 1) {
			return this.newInstance([]) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
		}

		const result: CoreCollection<T, CK>[] = [];
		for (let i = 0; i < chunks; i++) {
			const start = i * step;
			const chunk = items.slice(start, start + size);
			result.push(this.newInstance(chunk) as CoreCollection<T, CK>);
		}

		return this.newInstance(result) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
	},
};

/**
 * The `forPage` method returns a new collection containing the items that
 * would be present on a given page number.
 *
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @returns Collection of items for that page
 *
 * @example
 * collect([1, 2, 3, 4, 5, 6, 7, 8, 9])
 *     .forPage(2, 3)
 *     .all()
 * // → [4, 5, 6]
 *
 * @example First page:
 * collect([1, 2, 3, 4, 5])
 *     .forPage(1, 2)
 *     .all()
 * // → [1, 2]
 *
 * @see {@link chunk} - Split into fixed-size chunks
 * @see {@link take} - Take first N items
 * @see {@link skip} - Skip first N items
 *
 * @category Filtering
 */
export const forPageMethod: MethodDefinition<'forPage'> = {
	name: 'forPage',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, page: number, perPage: number): CoreCollection<T, CK> {
		const offset = Math.max(0, (page - 1) * perPage);
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		return this.newInstance(items.slice(offset, offset + perPage)) as CoreCollection<T, CK>;
	},
};

export default slidingMethod;
