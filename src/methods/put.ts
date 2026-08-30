/**
 * put/push/prepend methods - add items to collection.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `put` method sets the given key and value in the collection.
 * This method modifies the collection in place.
 *
 * @param key - Key to set
 * @param value - Value to set
 * @returns The collection (for chaining)
 *
 * @example
 * collect({ name: 'Taylor' })
 *     .put('age', 25)
 *     .all()
 * // → { name: 'Taylor', age: 25 }
 *
 * @example Update existing key:
 * collect({ name: 'Taylor', age: 25 })
 *     .put('age', 26)
 *     .all()
 * // → { name: 'Taylor', age: 26 }
 *
 * @see {@link push} - Append to end of array
 * @see {@link prepend} - Add to beginning
 * @see {@link get} - Retrieve value by key
 *
 * @category Transforming
 */
export const putMethod: MethodDefinition<'put'> = {
	name: 'put',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | number, value: T): CoreCollection<T, CK> {
		const items = this.getItems();
		items[String(key)] = value;
		return this;
	},
};

/**
 * The `push` method appends an item to the end of the collection.
 * This method modifies the collection in place.
 *
 * @param values - Values to append
 * @returns The collection (for chaining)
 *
 * @example
 * collect([1, 2, 3])
 *     .push(4)
 *     .all()
 * // → [1, 2, 3, 4]
 *
 * @example Multiple values:
 * collect([1, 2])
 *     .push(3, 4, 5)
 *     .all()
 * // → [1, 2, 3, 4, 5]
 *
 * @see {@link prepend} - Add to beginning
 * @see {@link put} - Set by key
 * @see {@link pop} - Remove from end
 *
 * @category Transforming
 */
export const pushMethod: MethodDefinition<'push'> = {
	name: 'push',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, ...values: T[]): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			arr.push(...values);
		} else {
			const items = this.getItems();
			const keys = Object.keys(items)
				.map(Number)
				.filter((n) => !Number.isNaN(n));
			let nextKey = keys.length > 0 ? Math.max(...keys) + 1 : 0;
			for (const value of values) {
				items[String(nextKey++)] = value;
			}
		}
		return this;
	},
};

/**
 * The `prepend` method adds an item to the beginning of the collection.
 * This method modifies the collection in place.
 *
 * @param value - Value to prepend
 * @param key - Optional key for the value (for associative collections)
 * @returns The collection (for chaining)
 *
 * @example
 * collect([2, 3, 4])
 *     .prepend(1)
 *     .all()
 * // → [1, 2, 3, 4]
 *
 * @example With key:
 * collect({ b: 2, c: 3 })
 *     .prepend(1, 'a')
 *     .all()
 * // → { a: 1, b: 2, c: 3 }
 *
 * @see {@link push} - Add to end
 * @see {@link shift} - Remove from beginning
 *
 * @category Transforming
 */
export const prependMethod: MethodDefinition<'prepend'> = {
	name: 'prepend',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T,
		key?: string | number,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null && key === undefined) {
			arr.unshift(value);
		} else {
			const items = this.getItems();
			const newItems: Record<string, T> = {};

			if (key !== undefined) {
				newItems[String(key)] = value;
			} else {
				newItems['0'] = value;
			}

			for (const [k, v] of Object.entries(items)) {
				newItems[k] = v;
			}

			for (const k of Object.keys(items)) delete items[k];
			Object.assign(items, newItems);
		}
		return this;
	},
};

export default putMethod;
