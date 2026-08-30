/**
 * pull/forget methods - remove items by key.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `pull` method removes and returns an item from the collection by its key.
 * This method modifies the collection in place.
 *
 * @param key - Key to pull
 * @param defaultValue - Default value if key doesn't exist
 * @returns The removed value, or default if not found
 *
 * @example
 * const collection = collect({ name: 'Taylor', role: 'Developer' })
 * collection.pull('role')
 * // → 'Developer'
 * collection.all()
 * // → { name: 'Taylor' }
 *
 * @example With default value:
 * const collection = collect({ name: 'Taylor' })
 * collection.pull('age', 25)
 * // → 25
 *
 * @see {@link get} - Get without removing
 * @see {@link forget} - Remove without returning
 * @see {@link pop} - Remove last item
 *
 * @category Finding
 */
export const pullMethod: MethodDefinition<'pull'> = {
	name: 'pull',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | number, defaultValue?: T): T | undefined {
		const items = this.getItems();
		const strKey = String(key);

		if (strKey in items) {
			const value = items[strKey];
			delete items[strKey];
			return value;
		}

		return defaultValue;
	},
};

/**
 * The `forget` method removes an item from the collection by its key.
 * This method modifies the collection in place. Unlike `except`, this method
 * modifies the collection directly.
 *
 * @param keys - Key or array of keys to remove
 * @returns The collection (for chaining)
 *
 * @example Remove a single key:
 * collect({ a: 1, b: 2, c: 3 })
 *     .forget('b')
 *     .all()
 * // → { a: 1, c: 3 }
 *
 * @example Remove multiple keys:
 * collect({ a: 1, b: 2, c: 3 })
 *     .forget(['a', 'c'])
 *     .all()
 * // → { b: 2 }
 *
 * @see {@link except} - Return new collection without keys (immutable)
 * @see {@link pull} - Remove and return value
 * @see {@link only} - Keep only specified keys
 *
 * @category Transforming
 */
export const forgetMethod: MethodDefinition<'forget'> = {
	name: 'forget',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keys: string | number | (string | number)[],
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const keyArray = Array.isArray(keys) ? keys : [keys];

		for (const key of keyArray) {
			delete items[String(key)];
		}

		return this;
	},
};

export default pullMethod;
