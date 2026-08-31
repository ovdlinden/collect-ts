/**
 * pop/shift methods - remove items from ends.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `pop` method removes and returns the last item from the collection.
 * This method modifies the collection in place.
 *
 * @param count - Optional number of items to pop
 * @returns The removed item(s), or undefined if empty
 *
 * @example
 * const collection = collect([1, 2, 3, 4, 5])
 * collection.pop()
 * // → 5
 * collection.all()
 * // → [1, 2, 3, 4]
 *
 * @example Pop multiple items:
 * const collection = collect([1, 2, 3, 4, 5])
 * collection.pop(2)
 * // → [4, 5]
 * collection.all()
 * // → [1, 2, 3]
 *
 * @see {@link push} - Add to end
 * @see {@link shift} - Remove from beginning
 * @see {@link last} - Get last without removing
 *
 * @category Transforming
 */
export const popMethod: MethodDefinition<'pop'> = {
	name: 'pop',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, count?: number): T | T[] | undefined {
		const arr = this.getArrayItems();
		if (arr !== null) {
			if (count === undefined) {
				return arr.pop();
			}
			return arr.splice(-count, count);
		}

		const items = this.getItems();
		const keys = Object.keys(items);
		if (keys.length === 0) return undefined;

		if (count === undefined) {
			const lastKey = keys[keys.length - 1];
			const value = items[lastKey];
			delete items[lastKey];
			return value;
		}

		const result: T[] = [];
		for (let i = 0; i < count && keys.length > 0; i++) {
			const lastKey = keys.pop();
			if (lastKey === undefined) break;
			result.unshift(items[lastKey]);
			delete items[lastKey];
		}
		return result;
	},
};

/**
 * The `shift` method removes and returns the first item from the collection.
 * This method modifies the collection in place.
 *
 * @param count - Optional number of items to shift
 * @returns The removed item(s), or undefined if empty
 *
 * @example
 * const collection = collect([1, 2, 3, 4, 5])
 * collection.shift()
 * // → 1
 * collection.all()
 * // → [2, 3, 4, 5]
 *
 * @example Shift multiple items:
 * const collection = collect([1, 2, 3, 4, 5])
 * collection.shift(2)
 * // → [1, 2]
 * collection.all()
 * // → [3, 4, 5]
 *
 * @see {@link prepend} - Add to beginning
 * @see {@link pop} - Remove from end
 * @see {@link first} - Get first without removing
 *
 * @category Transforming
 */
export const shiftMethod: MethodDefinition<'shift'> = {
	name: 'shift',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, count?: number): T | T[] | undefined {
		const arr = this.getArrayItems();
		if (arr !== null) {
			if (count === undefined) {
				return arr.shift();
			}
			return arr.splice(0, count);
		}

		const items = this.getItems();
		const keys = Object.keys(items);
		if (keys.length === 0) return undefined;

		if (count === undefined) {
			const firstKey = keys[0];
			const value = items[firstKey];
			delete items[firstKey];
			return value;
		}

		const result: T[] = [];
		for (let i = 0; i < count && keys.length > 0; i++) {
			const firstKey = keys.shift();
			if (firstKey === undefined) break;
			result.push(items[firstKey]);
			delete items[firstKey];
		}
		return result;
	},
};

export default popMethod;
