/**
 * firstWhere/firstOrFail/sole methods - find first matching items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';
import { ItemNotFoundException, MultipleItemsFoundException } from '../exceptions/index.js';

/**
 * The `firstWhere` method returns the first element in the collection with the
 * given key/value pair.
 *
 * @param key - Property key to check
 * @param operatorOrValue - Operator or value
 * @param value - Value (if operator provided)
 * @returns First matching item, or undefined
 *
 * @example
 * collect([
 *   { name: 'Taylor', age: 25 },
 *   { name: 'Abigail', age: 28 },
 *   { name: 'James', age: 25 },
 * ])
 *   .firstWhere('age', 25)
 * // → { name: 'Taylor', age: 25 }
 *
 * @example With operator:
 * collect([
 *   { name: 'Taylor', age: 25 },
 *   { name: 'Abigail', age: 28 },
 * ])
 *   .firstWhere('age', '>', 26)
 * // → { name: 'Abigail', age: 28 }
 *
 * @see {@link first} - Get first item with callback
 * @see {@link where} - Get all matching items
 *
 * @category Finding
 */
export const firstWhereMethod: MethodDefinition<'firstWhere'> = {
	name: 'firstWhere',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string,
		operatorOrValue?: string | unknown,
		value?: unknown,
	): T | undefined {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		let operator: string;
		let compareValue: unknown;

		if (value !== undefined) {
			operator = operatorOrValue as string;
			compareValue = value;
		} else if (operatorOrValue !== undefined) {
			operator = '=';
			compareValue = operatorOrValue;
		} else {
			// Just check for truthy value at key
			for (const item of items) {
				if (dataGet(item, key)) {
					return item as T;
				}
			}
			return undefined;
		}

		for (const item of items) {
			const itemValue = dataGet(item, key);
			let matches = false;

			switch (operator) {
				case '=':
				case '==':
					// biome-ignore lint/suspicious/noDoubleEquals: Laravel loose comparison
					matches = itemValue == compareValue;
					break;
				case '===':
					matches = itemValue === compareValue;
					break;
				case '!=':
				case '<>':
					// biome-ignore lint/suspicious/noDoubleEquals: Laravel loose comparison
					matches = itemValue != compareValue;
					break;
				case '<':
					matches = (itemValue as number) < (compareValue as number);
					break;
				case '<=':
					matches = (itemValue as number) <= (compareValue as number);
					break;
				case '>':
					matches = (itemValue as number) > (compareValue as number);
					break;
				case '>=':
					matches = (itemValue as number) >= (compareValue as number);
					break;
			}

			if (matches) {
				return item as T;
			}
		}

		return undefined;
	},
};

/**
 * The `firstOrFail` method returns the first element in the collection, or throws
 * an exception if the collection is empty.
 *
 * @param callback - Optional predicate function
 * @returns First (matching) item
 * @throws ItemNotFoundException if no item found
 *
 * @example
 * collect([1, 2, 3])
 *     .firstOrFail()
 * // → 1
 *
 * @example With callback:
 * collect([1, 2, 3])
 *     .firstOrFail(n => n > 1)
 * // → 2
 *
 * @example Empty collection throws:
 * collect([])
 *     .firstOrFail()
 * // throws ItemNotFoundException
 *
 * @see {@link first} - Returns undefined instead of throwing
 * @see {@link sole} - Requires exactly one match
 *
 * @category Finding
 */
export const firstOrFailMethod: MethodDefinition<'firstOrFail'> = {
	name: 'firstOrFail',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: (item: T, key: number | string) => boolean,
	): T {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const keys = arr ? items.map((_, i) => i) : Object.keys(this.getItems());

		if (callback) {
			for (let i = 0; i < items.length; i++) {
				if (callback(items[i] as T, keys[i])) {
					return items[i] as T;
				}
			}
			throw new ItemNotFoundException('No item found matching the given criteria.');
		}

		if (items.length === 0) {
			throw new ItemNotFoundException('Collection is empty.');
		}

		return items[0] as T;
	},
};

/**
 * The `sole` method returns the first element in the collection that passes
 * a given truth test, but only if exactly one element matches. If no elements
 * match or more than one element matches, an exception is thrown.
 *
 * @param callback - Optional predicate function
 * @returns The sole matching item
 * @throws ItemNotFoundException if no item found
 * @throws MultipleItemsFoundException if more than one found
 *
 * @example
 * collect([1, 2, 3])
 *     .sole(n => n === 2)
 * // → 2
 *
 * @example Throws on multiple matches:
 * collect([1, 2, 2, 3])
 *     .sole(n => n === 2)
 * // throws MultipleItemsFoundException
 *
 * @example With key/value:
 * collect([{ id: 1 }, { id: 2 }])
 *     .sole('id', 1)
 * // → { id: 1 }
 *
 * @see {@link first} - Get first without uniqueness check
 * @see {@link firstOrFail} - Get first, throw if empty
 *
 * @category Finding
 */
export const soleMethod: MethodDefinition<'sole'> = {
	name: 'sole',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrCallback?: string | ((item: T, key: number | string) => boolean),
		value?: unknown,
	): T {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const keys = arr ? items.map((_, i) => i) : Object.keys(this.getItems());

		const matches: T[] = [];

		for (let i = 0; i < items.length; i++) {
			let isMatch = false;

			if (keyOrCallback === undefined) {
				isMatch = true;
			} else if (typeof keyOrCallback === 'function') {
				isMatch = keyOrCallback(items[i] as T, keys[i]);
			} else if (value !== undefined) {
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel loose comparison
				isMatch = dataGet(items[i], keyOrCallback) == value;
			} else {
				isMatch = Boolean(dataGet(items[i], keyOrCallback));
			}

			if (isMatch) {
				matches.push(items[i] as T);
			}
		}

		if (matches.length === 0) {
			throw new ItemNotFoundException('No item found matching the given criteria.');
		}

		if (matches.length > 1) {
			throw new MultipleItemsFoundException(matches.length, 'sole');
		}

		return matches[0];
	},
};

export default firstWhereMethod;
