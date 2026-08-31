/**
 * split/splitIn methods - divide into groups.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `split` method breaks a collection into the given number of groups,
 * distributing extra items across earlier groups to balance sizes.
 *
 * @param numberOfGroups - Number of groups to create
 * @returns Collection of collections
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .split(3)
 *     .toArray()
 * // → [[1, 2], [3, 4], [5]]
 *
 * @example With even division:
 * collect([1, 2, 3, 4, 5, 6])
 *     .split(3)
 *     .toArray()
 * // → [[1, 2], [3, 4], [5, 6]]
 *
 * @see {@link splitIn} - Split with fewer groups allowed
 * @see {@link chunk} - Fixed-size chunks
 *
 * @category Grouping
 */
export const splitMethod: MethodDefinition<'split'> = {
	name: 'split',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		numberOfGroups: number,
	): CoreCollection<CoreCollection<T, CK>, 'array'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (numberOfGroups < 1 || items.length === 0) {
			return this.newInstance([]) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
		}

		const groupSize = Math.floor(items.length / numberOfGroups);
		const remainder = items.length % numberOfGroups;
		const result: CoreCollection<T, CK>[] = [];
		let offset = 0;

		for (let i = 0; i < numberOfGroups; i++) {
			const size = groupSize + (i < remainder ? 1 : 0);
			if (size > 0) {
				result.push(this.newInstance(items.slice(offset, offset + size)) as CoreCollection<T, CK>);
				offset += size;
			}
		}

		return this.newInstance(result) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
	},
};

/**
 * The `splitIn` method breaks a collection into the given number of groups,
 * filling non-terminal groups completely before allocating the remainder
 * to the final group.
 *
 * @param numberOfGroups - Number of groups to create
 * @returns Collection of collections
 *
 * @example
 * collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
 *     .splitIn(3)
 *     .toArray()
 * // → [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
 *
 * @see {@link split} - Balanced distribution
 * @see {@link chunk} - Fixed-size chunks
 *
 * @category Grouping
 */
export const splitInMethod: MethodDefinition<'splitIn'> = {
	name: 'splitIn',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		numberOfGroups: number,
	): CoreCollection<CoreCollection<T, CK>, 'array'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (numberOfGroups < 1 || items.length === 0) {
			return this.newInstance([]) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
		}

		const groupSize = Math.ceil(items.length / numberOfGroups);
		const result: CoreCollection<T, CK>[] = [];

		for (let i = 0; i < items.length; i += groupSize) {
			result.push(this.newInstance(items.slice(i, i + groupSize)) as CoreCollection<T, CK>);
		}

		return this.newInstance(result) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
	},
};

export default splitMethod;
