/**
 * search/value methods - find items and values.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `search` method searches the collection for the given value and returns
 * its key if found. If the item is not found, `false` is returned.
 *
 * @param value - Value to search for, or predicate function
 * @param strict - Use strict comparison
 * @returns The key of the found item, or false
 *
 * @example
 * collect([2, 4, 6, 8])
 *     .search(4)
 * // → 1
 *
 * @example Not found:
 * collect([2, 4, 6, 8])
 *     .search(5)
 * // → false
 *
 * @example With callback:
 * collect([
 *   { name: 'Taylor', age: 25 },
 *   { name: 'Abigail', age: 28 },
 * ])
 *   .search(user => user.name === 'Abigail')
 * // → 1
 *
 * @see {@link contains} - Check if value exists
 * @see {@link firstWhere} - Get first matching item
 *
 * @category Finding
 */
export const searchMethod: MethodDefinition<'search'> = {
	name: 'search',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((item: T, key: number | string) => boolean),
		strict = false,
	): string | number | false {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const keys = arr ? items.map((_, i) => i) : Object.keys(this.getItems());

		for (let i = 0; i < items.length; i++) {
			if (typeof value === 'function') {
				if ((value as (item: T, key: number | string) => boolean)(items[i] as T, keys[i])) {
					return keys[i];
				}
			} else {
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel loose comparison
				const match = strict ? items[i] === value : items[i] == value;
				if (match) return keys[i];
			}
		}

		return false;
	},
};

/**
 * The `value` method retrieves a given value from the first element of the collection.
 *
 * @param key - Property key to retrieve
 * @param defaultValue - Default value if not found
 * @returns The value at the key from the first item
 *
 * @example
 * collect([
 *   { name: 'Taylor', role: 'Developer' },
 *   { name: 'Abigail', role: 'Designer' },
 * ])
 *   .value('name')
 * // → 'Taylor'
 *
 * @example With default:
 * collect([])
 *     .value('name', 'Unknown')
 * // → 'Unknown'
 *
 * @see {@link pluck} - Get values from all items
 * @see {@link first} - Get first item
 *
 * @category Finding
 */
export const valueMethod: MethodDefinition<'value'> = {
	name: 'value',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string, defaultValue?: unknown): unknown {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) {
			return defaultValue;
		}

		const value = dataGet(items[0], key);
		return value !== undefined ? value : defaultValue;
	},
};

export default searchMethod;
