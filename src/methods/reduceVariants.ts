/**
 * reduceInto/reduceSpread/reduceWithKeys methods.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `reduceInto` method reduces the collection into an existing object, mutating it.
 *
 * Unlike `reduce`, the callback does not return a value. Instead, it modifies the carry
 * object directly. The same object is returned at the end.
 *
 * @param initial - Object to mutate
 * @param callback - Function receiving (carry, value, key) that mutates carry
 * @returns The mutated initial object
 *
 * @example
 * collect([1, 2, 3])
 *     .reduceInto({ total: 0 }, (carry, item) => {
 *         carry.total += item
 *     })
 * // → { total: 6 }
 *
 * @example Populate an existing array:
 * collect([
 *   { name: 'Taylor', active: true },
 *   { name: 'Abigail', active: true },
 *   { name: 'James', active: false },
 * ])
 *   .reduceInto([], (carry, user) => {
 *     if (user.active) carry.push(user.name)
 *   })
 * // → ['Taylor', 'Abigail']
 *
 * @see {@link reduce} - Reduce with immutable accumulator
 * @see {@link reduceSpread} - Reduce to multiple values
 *
 * @category Aggregating
 */
export const reduceIntoMethod: MethodDefinition<'reduceInto'> = {
	name: 'reduceInto',
	chainable: false,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		initial: U,
		callback: (carry: U, value: T, key: string) => void,
	): U {
		const arr = this.getArrayItems();
		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				callback(initial, arr[i], String(i));
			}
		} else {
			for (const [key, value] of Object.entries(this.getItems())) {
				callback(initial, value, key);
			}
		}
		return initial;
	},
};

/**
 * The `reduceSpread` method reduces the collection to multiple values using spread arguments.
 *
 * @param callback - Function receiving (...accumulators, item, key) and returning new accumulators
 * @param initial - Starting values for each accumulator
 * @returns Final accumulated values as a tuple
 *
 * @example Calculate sum and product together:
 * collect([1, 2, 3, 4])
 *     .reduceSpread(
 *         (sum, product, item) => [sum + item, product * item],
 *         0, 1
 *     )
 * // → [10, 24]
 *
 * @see {@link reduce} - Single accumulator
 * @see {@link reduceInto} - Reduce by mutating an object
 *
 * @category Aggregating
 */
export const reduceSpreadMethod: MethodDefinition<'reduceSpread'> = {
	name: 'reduceSpread',
	chainable: false,
	fn<T, U extends unknown[], CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (...args: [...U, T, string]) => U,
		...initial: U
	): U {
		let result = initial;
		const arr = this.getArrayItems();

		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				result = callback(...result, arr[i], String(i));
			}
		} else {
			for (const [key, value] of Object.entries(this.getItems())) {
				result = callback(...result, value, key);
			}
		}

		return result;
	},
};

/**
 * The `reduceWithKeys` method reduces the collection with access to both value and key.
 *
 * This method works identically to `reduce` since the key is always provided as the third
 * argument. It exists for API compatibility with Laravel.
 *
 * @param callback - Function receiving (carry, value, key) and returning next carry
 * @param initial - Starting value for the carry
 * @returns Final accumulated value
 *
 * @example Build a keyed object:
 * collect({ a: 1, b: 2, c: 3 })
 *     .reduceWithKeys((carry, value, key) => {
 *         carry[key] = value * 2
 *         return carry
 *     }, {})
 * // → { a: 2, b: 4, c: 6 }
 *
 * @see {@link reduce} - Primary reduce method
 *
 * @category Aggregating
 */
export const reduceWithKeysMethod: MethodDefinition<'reduceWithKeys'> = {
	name: 'reduceWithKeys',
	chainable: false,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (carry: U, value: T, key: string) => U,
		initial: U,
	): U {
		let result = initial;
		const arr = this.getArrayItems();

		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				result = callback(result, arr[i], String(i));
			}
		} else {
			for (const [key, value] of Object.entries(this.getItems())) {
				result = callback(result, value, key);
			}
		}

		return result;
	},
};

export default reduceIntoMethod;
