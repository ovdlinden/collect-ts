/**
 * has/hasAny/hasMany methods - check for key existence.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `has` method determines if one or more keys exist in the collection.
 * When checking multiple keys, all must exist for the method to return true.
 *
 * @param keys - Key or array of keys to check
 * @returns True if all keys exist
 *
 * @example Single key:
 * collect({ name: 'Taylor', age: 25 })
 *     .has('name')
 * // → true
 *
 * @example Multiple keys (all must exist):
 * collect({ name: 'Taylor', age: 25 })
 *     .has(['name', 'age'])
 * // → true
 *
 * @example Missing key:
 * collect({ name: 'Taylor' })
 *     .has('age')
 * // → false
 *
 * @example With dot notation:
 * collect({ user: { name: 'Taylor' } })
 *     .has('user.name')
 * // → true
 *
 * @see {@link hasAny} - True if ANY key exists
 * @see {@link get} - Get value at key
 * @see {@link contains} - Check if value exists
 *
 * @category Checking
 */
export const hasMethod: MethodDefinition<'has'> = {
	name: 'has',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, keys: string | number | (string | number)[]): boolean {
		const items = this.getItems();
		const keyArray = Array.isArray(keys) ? keys : [keys];

		for (const key of keyArray) {
			if (dataGet(items, String(key)) === undefined) {
				return false;
			}
		}

		return true;
	},
};

/**
 * The `hasAny` method determines if any of the given keys exist in the collection.
 * Returns true if at least one key exists.
 *
 * @param keys - Array of keys to check
 * @returns True if any key exists
 *
 * @example
 * collect({ name: 'Taylor', age: 25 })
 *     .hasAny(['name', 'email'])
 * // → true (name exists)
 *
 * @example None exist:
 * collect({ name: 'Taylor' })
 *     .hasAny(['age', 'email'])
 * // → false
 *
 * @see {@link has} - True only if ALL keys exist
 * @see {@link contains} - Check if value exists
 *
 * @category Checking
 */
export const hasAnyMethod: MethodDefinition<'hasAny'> = {
	name: 'hasAny',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, keys: (string | number)[]): boolean {
		const items = this.getItems();

		for (const key of keys) {
			if (dataGet(items, String(key)) !== undefined) {
				return true;
			}
		}

		return false;
	},
};

export default hasMethod;
