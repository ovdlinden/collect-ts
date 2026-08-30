/**
 * get method - retrieve item by key with optional default.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `get` method returns the item at a given key. If the key does not exist,
 * `null` is returned. You may optionally pass a default value as the second argument.
 *
 * @param key - The key to retrieve
 * @param defaultValue - Default value if key doesn't exist (can be a callback)
 * @returns The value at the key, or the default value
 *
 * @example
 * collect({ name: 'Taylor', role: 'Developer' })
 *     .get('name')
 * // → 'Taylor'
 *
 * @example With default value:
 * collect({ name: 'Taylor' })
 *     .get('age', 25)
 * // → 25
 *
 * @example With callback default:
 * collect({ name: 'Taylor' })
 *     .get('age', () => Date.now())
 * // → current timestamp
 *
 * @example Nested key with dot notation:
 * collect({ user: { name: 'Taylor' } })
 *     .get('user.name')
 * // → 'Taylor'
 *
 * @see {@link pull} - Get and remove from collection
 * @see {@link first} - Get first item
 * @see {@link has} - Check if key exists
 *
 * @category Finding
 */
export const getMethod: MethodDefinition<'get'> = {
	name: 'get',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string | number,
		defaultValue?: T | (() => T),
	): T | null {
		const items = this.getItems();
		const value = dataGet(items, String(key));

		if (value !== undefined) {
			return value as T;
		}

		if (defaultValue !== undefined) {
			return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
		}

		return null;
	},
};

export default getMethod;
