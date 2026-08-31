/**
 * offset methods - ArrayAccess interface implementation.
 * Provides bracket-style access to collection items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `offsetExists` method determines if a key exists at the given offset.
 *
 * This method implements the ArrayAccess interface pattern, allowing bracket-style
 * key existence checks. It is used internally for array-like access.
 *
 * @param key - Key to check
 * @returns True if the key exists
 *
 * @example
 * collect({ a: 1, b: 2 })
 *     .offsetExists('a')
 * // → true
 *
 * @example Check numeric index:
 * collect(['x', 'y', 'z'])
 *     .offsetExists(1)
 * // → true
 *
 * @see {@link has} - Primary method for key existence checks
 * @see {@link offsetGet} - Get value at offset
 *
 * @category Checking
 */
export const offsetExistsMethod: MethodDefinition<'offsetExists'> = {
	name: 'offsetExists',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | number): boolean {
		return String(key) in this.getItems();
	},
};

/**
 * The `offsetGet` method returns the value at a given offset.
 *
 * Part of the ArrayAccess interface for bracket-style access. Unlike
 * `get()`, this method does not support default values and returns
 * `undefined` for missing keys.
 *
 * @param key - The key to retrieve
 * @returns The value at the given key, or `undefined` if not found
 *
 * @example
 * collect({ name: 'Taylor', role: 'Developer' })
 *     .offsetGet('name')
 * // → 'Taylor'
 *
 * @example With numeric index:
 * collect(['a', 'b', 'c'])
 *     .offsetGet(1)
 * // → 'b'
 *
 * @see {@link get} - Primary method with default value support
 * @see {@link offsetExists} - Check if key exists
 * @see {@link offsetSet} - Set value at offset
 *
 * @category Finding
 */
export const offsetGetMethod: MethodDefinition<'offsetGet'> = {
	name: 'offsetGet',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | number): T | undefined {
		return this.getItems()[String(key)];
	},
};

/**
 * The `offsetSet` method sets the value at a given offset.
 *
 * Part of the ArrayAccess interface for bracket-style assignment. If the key is `null`,
 * the value is appended to the collection (like `push`). This method modifies the
 * collection in place.
 *
 * @param key - The key to set, or null to append
 * @param value - The value to set
 *
 * @example Set a value by key:
 * const collection = collect({ a: 1 })
 * collection.offsetSet('b', 2)
 * collection.all()
 * // → { a: 1, b: 2 }
 *
 * @example Append with null key:
 * const collection = collect([1, 2])
 * collection.offsetSet(null, 3)
 * collection.all()
 * // → [1, 2, 3]
 *
 * @example Update existing value:
 * const collection = collect({ name: 'John' })
 * collection.offsetSet('name', 'Jane')
 * collection.get('name')
 * // → 'Jane'
 *
 * @see {@link put} - Primary method for setting values
 * @see {@link push} - Append to collection
 * @see {@link offsetGet} - Get value at offset
 *
 * @category Transforming
 */
export const offsetSetMethod: MethodDefinition<'offsetSet'> = {
	name: 'offsetSet',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | number | null, value: T): void {
		const items = this.getItems();
		if (key === null) {
			// Append: find next numeric key
			const keys = Object.keys(items)
				.map(Number)
				.filter((n) => !Number.isNaN(n));
			const nextKey = keys.length > 0 ? Math.max(...keys) + 1 : 0;
			items[String(nextKey)] = value;
		} else {
			items[String(key)] = value;
		}
	},
};

/**
 * The `offsetUnset` method removes the value at a given offset.
 *
 * Part of the ArrayAccess interface for bracket-style deletion. This method modifies
 * the collection in place. For arrays, this does not re-index the remaining items.
 *
 * @param key - The key to remove
 *
 * @example Remove by key:
 * const collection = collect({ a: 1, b: 2, c: 3 })
 * collection.offsetUnset('b')
 * collection.all()
 * // → { a: 1, c: 3 }
 *
 * @example Remove by index:
 * const collection = collect(['x', 'y', 'z'])
 * collection.offsetUnset(1)
 * collection.all()
 * // → { '0': 'x', '2': 'z' }  // Note: does not re-index
 *
 * @see {@link forget} - Primary method for removing items
 * @see {@link pull} - Remove and return a value
 * @see {@link offsetSet} - Set value at offset
 *
 * @category Transforming
 */
export const offsetUnsetMethod: MethodDefinition<'offsetUnset'> = {
	name: 'offsetUnset',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | number): void {
		const items = this.getItems();
		delete items[String(key)];
	},
};

export default offsetSetMethod;
