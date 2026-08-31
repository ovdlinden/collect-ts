/**
 * pad/splice methods - array manipulation.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `pad` method fills the array with the given value until the array reaches
 * the specified size. This method behaves like PHP's `array_pad` function.
 *
 * To pad to the left, specify a negative size. No padding occurs if the absolute
 * value of the given size is less than or equal to the length of the array.
 *
 * @param size - Target size (negative for left padding)
 * @param value - Value to pad with
 * @returns New padded collection
 *
 * @example Pad to the right:
 * collect([1, 2, 3])
 *     .pad(5, 0)
 *     .all()
 * // → [1, 2, 3, 0, 0]
 *
 * @example Pad to the left:
 * collect([1, 2, 3])
 *     .pad(-5, 0)
 *     .all()
 * // → [0, 0, 1, 2, 3]
 *
 * @example No padding needed:
 * collect([1, 2, 3])
 *     .pad(2, 0)
 *     .all()
 * // → [1, 2, 3]
 *
 * @see {@link take} - Take items from start or end
 * @see {@link splice} - Insert items at position
 *
 * @category Transforming
 */
export const padMethod: MethodDefinition<'pad'> = {
	name: 'pad',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, size: number, value: T): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ? [...arr] : Object.values(this.getItems());

		const absSize = Math.abs(size);
		if (items.length >= absSize) {
			return this.newInstance(items) as CoreCollection<T, CK>;
		}

		const padding = Array(absSize - items.length).fill(value);

		if (size < 0) {
			return this.newInstance([...padding, ...items]) as CoreCollection<T, CK>;
		}

		return this.newInstance([...items, ...padding]) as CoreCollection<T, CK>;
	},
};

/**
 * The `splice` method removes and returns a slice of items starting at the
 * specified index. You may pass a second argument to limit the size of the
 * removed slice, and a third argument containing replacement items.
 * This method modifies the original collection.
 *
 * @param start - Starting index
 * @param deleteCount - Number of items to remove
 * @param replacement - Items to insert
 * @returns Collection of removed items
 *
 * @example Remove from an index:
 * const collection = collect([1, 2, 3, 4, 5])
 * const chunk = collection.splice(2)
 * // chunk      → [3, 4, 5]
 * // collection → [1, 2]
 *
 * @example Remove a specific length:
 * const collection = collect([1, 2, 3, 4, 5])
 * const chunk = collection.splice(2, 1)
 * // chunk      → [3]
 * // collection → [1, 2, 4, 5]
 *
 * @example Replace items:
 * const collection = collect([1, 2, 3, 4, 5])
 * collection.splice(2, 1, [10, 11])
 * collection.all()
 * // → [1, 2, 10, 11, 4, 5]
 *
 * @see {@link slice} - Extract without mutation
 * @see {@link take} - Take from start or end
 *
 * @category Transforming
 */
export const spliceMethod: MethodDefinition<'splice'> = {
	name: 'splice',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		start: number,
		deleteCount?: number,
		replacement?: T[],
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr === null) {
			throw new Error('splice() only works on array collections');
		}

		const args: [number, number, ...T[]] =
			deleteCount !== undefined
				? replacement
					? [start, deleteCount, ...replacement]
					: [start, deleteCount]
				: [start, arr.length - start];

		const removed = arr.splice(...args);
		return this.newInstance(removed) as CoreCollection<T, CK>;
	},
};

export default padMethod;
