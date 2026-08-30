/**
 * crossJoin/multiply methods - combinatorial operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

type Arrayable<T> = T[] | CoreCollection<T, CollectionKind>;

function arrayableToArray<T>(value: Arrayable<T>): T[] {
	if (Array.isArray(value)) return value;
	return value.toArray() as T[];
}

/**
 * The `crossJoin` method cross joins the collection's values among the given
 * arrays or collections, returning a Cartesian product with all possible permutations.
 *
 * @param lists - Arrays or collections to cross join with
 * @returns Collection of arrays representing all combinations
 *
 * @example Two-way cross join:
 * collect(['S', 'M', 'L'])
 *     .crossJoin(['red', 'blue'])
 *     .all()
 * // → [
 * //   ['S', 'red'], ['S', 'blue'],
 * //   ['M', 'red'], ['M', 'blue'],
 * //   ['L', 'red'], ['L', 'blue']
 * // ]
 *
 * @example Three-way cross join:
 * collect([1, 2])
 *     .crossJoin(['a', 'b'], [true, false])
 *     .all()
 * // → [[1, 'a', true], [1, 'a', false], [1, 'b', true], ...]
 *
 * @see {@link zip} - Pair by index instead of creating all combinations
 *
 * @category Combining
 */
export const crossJoinMethod: MethodDefinition<'crossJoin'> = {
	name: 'crossJoin',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		...lists: Arrayable<U>[]
	): CoreCollection<(T | U)[], 'array'> {
		const arrays = lists.map((list) => arrayableToArray(list));
		const result: (T | U)[][] = [];
		const arr = this.getArrayItems();
		const values = arr ?? Object.values(this.getItems());

		const combine = (current: (T | U)[], remaining: unknown[][]): void => {
			if (remaining.length === 0) {
				result.push(current);
				return;
			}
			const [first, ...rest] = remaining;
			for (const item of first) {
				combine([...current, item as T | U], rest);
			}
		};

		combine([], [values, ...arrays]);
		return this.newInstance(result) as unknown as CoreCollection<(T | U)[], 'array'>;
	},
};

/**
 * The `multiply` method creates multiple copies of all items in the collection.
 *
 * @param multiplier - Number of times to repeat
 * @returns New collection with repeated items
 *
 * @example
 * collect([1, 2])
 *     .multiply(3)
 *     .all()
 * // → [1, 2, 1, 2, 1, 2]
 *
 * @see {@link pad} - Pad to a specific size
 *
 * @category Transforming
 */
export const multiplyMethod: MethodDefinition<'multiply'> = {
	name: 'multiply',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, multiplier: number): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const values = arr ?? Object.values(this.getItems());
		const result: T[] = [];

		for (let i = 0; i < multiplier; i++) {
			result.push(...values);
		}

		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default crossJoinMethod;
