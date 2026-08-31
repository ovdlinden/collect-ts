/**
 * eachSpread method - iterate with spread arguments.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `eachSpread` method iterates over the collection's items, passing each nested
 * item value into the given callback as separate arguments.
 *
 * @param callback - Function that receives spread arguments
 * @returns The collection (for chaining)
 *
 * @example
 * collect([['John', 35], ['Jane', 28]])
 *     .eachSpread((name, age) => {
 *         console.log(`${name} is ${age} years old`);
 *     })
 * // Logs: "John is 35 years old"
 * // Logs: "Jane is 28 years old"
 *
 * @example You may also access the key:
 * collect([['a', 'b'], ['c', 'd']])
 *     .eachSpread((first, second, key) => {
 *         console.log(`${key}: ${first}, ${second}`);
 *     })
 *
 * @example Return false to stop iteration:
 * collect([[1, 2], [3, 4], [5, 6]])
 *     .eachSpread((a, b) => {
 *         if (a > 3) return false;
 *         console.log(a + b);
 *     })
 * // Logs: 3, 7 (stops before [5, 6])
 *
 * @see {@link mapSpread} - Transform with spread arguments
 * @see {@link each} - Iterate without spreading
 *
 * @category Transforming
 */
export const eachSpreadMethod: MethodDefinition<'eachSpread'> = {
	name: 'eachSpread',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (...args: unknown[]) => boolean | undefined,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				const item = arr[i];
				const result = Array.isArray(item) ? callback(...item, i) : callback(item, i);
				if (result === false) break;
			}
		} else {
			const items = this.getItems();
			for (const [key, value] of Object.entries(items)) {
				const result = Array.isArray(value) ? callback(...value, key) : callback(value, key);
				if (result === false) break;
			}
		}

		return this;
	},
};

export default eachSpreadMethod;
