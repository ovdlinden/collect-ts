/**
 * getOrPut/select methods - conditional retrieval and selection.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `getOrPut` method retrieves the value for the given key. If the key does not
 * exist, the default value is stored in the collection and returned.
 *
 * @param key - Key to retrieve or set
 * @param value - Default value or callback to generate it
 * @returns The existing or newly set value
 *
 * @example
 * const collection = collect({ name: 'Taylor' })
 * collection.getOrPut('age', 25)
 * // → 25 (and collection now contains { name: 'Taylor', age: 25 })
 *
 * @example With callback:
 * const collection = collect({ name: 'Taylor' })
 * collection.getOrPut('timestamp', () => Date.now())
 * // → current timestamp (computed only if key doesn't exist)
 *
 * @see {@link get} - Get without setting default
 * @see {@link put} - Set value by key
 *
 * @category Finding
 */
export const getOrPutMethod: MethodDefinition<'getOrPut'> = {
	name: 'getOrPut',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string | number | null,
		value: T | (() => T) | null,
	): T {
		const k = key === null ? '' : String(key);
		const items = this.getItems();

		if (k in items) {
			return items[k];
		}

		const resolvedValue = (typeof value === 'function' ? (value as () => T)() : value) as T;
		items[k] = resolvedValue;
		return resolvedValue;
	},
};

/**
 * The `select` method selects the given keys from the collection, similar to
 * an SQL SELECT statement.
 *
 * @param keys - Keys to select from each item
 * @returns Collection of partial objects
 *
 * @example
 * collect([
 *   { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
 *   { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
 * ])
 *   .select(['name', 'email'])
 *   .all()
 * // → [
 * //   { name: 'Alice', email: 'alice@example.com' },
 * //   { name: 'Bob', email: 'bob@example.com' },
 * // ]
 *
 * @see {@link only} - Select keys from the collection itself
 * @see {@link pluck} - Extract single key values
 *
 * @category Transforming
 */
export const selectMethod: MethodDefinition<'select'> = {
	name: 'select',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keys: (string | number)[] | CoreCollection<string | number, CollectionKind> | null,
	): CoreCollection<Partial<T>, CK> {
		if (keys === null) {
			return this as unknown as CoreCollection<Partial<T>, CK>;
		}

		const keysArray = Array.isArray(keys) ? keys : keys.toArray();
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result = items.map((item) => {
			const selected: Partial<T> = {};
			for (const key of keysArray) {
				const value = dataGet(item, String(key));
				if (value !== undefined) {
					(selected as Record<string, unknown>)[String(key)] = value;
				}
			}
			return selected;
		});

		return this.newInstance(result) as unknown as CoreCollection<Partial<T>, CK>;
	},
};

export default getOrPutMethod;
