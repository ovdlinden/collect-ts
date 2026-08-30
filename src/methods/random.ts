/**
 * random/shuffle methods - randomization operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `random` method returns a random item from the collection.
 *
 * @param count - Optional number of random items to return
 * @returns Random item(s), or undefined if empty
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .random()
 * // → 3 (random)
 *
 * @example Multiple random items:
 * collect([1, 2, 3, 4, 5])
 *     .random(2)
 * // → [2, 5] (random pair)
 *
 * @see {@link shuffle} - Randomize entire collection
 * @see {@link first} - Get first item
 *
 * @category Finding
 */
export const randomMethod: MethodDefinition<'random'> = {
	name: 'random',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, count?: number): T | T[] | undefined {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) return undefined;

		if (count === undefined) {
			return items[Math.floor(Math.random() * items.length)];
		}

		const shuffled = [...items].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, Math.min(count, items.length));
	},
};

/**
 * The `nth` method returns every n-th element of the collection.
 *
 * @param step - Take every nth item
 * @param offset - Starting offset
 * @returns New collection with every nth item
 *
 * @example
 * collect([1, 2, 3, 4, 5, 6])
 *     .nth(2)
 *     .all()
 * // → [1, 3, 5]
 *
 * @example With offset:
 * collect([1, 2, 3, 4, 5, 6])
 *     .nth(2, 1)
 *     .all()
 * // → [2, 4, 6]
 *
 * @see {@link filter} - Filter with custom callback
 * @see {@link take} - Take first n items
 *
 * @category Finding
 */
export const nthMethod: MethodDefinition<'nth'> = {
	name: 'nth',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, step: number, offset = 0): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result: T[] = [];
		for (let i = offset; i < items.length; i += step) {
			result.push(items[i]);
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default randomMethod;
