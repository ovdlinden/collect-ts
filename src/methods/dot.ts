/**
 * dot/undot methods - flatten/expand dot notation.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `dot` method flattens a multi-dimensional collection into a single level
 * collection that uses "dot" notation to indicate depth. This is useful for
 * working with nested configuration or form data.
 *
 * @returns New collection with dot notation keys
 *
 * @example
 * collect({
 *     user: { name: 'John', address: { city: 'NYC' } }
 * }).dot().all()
 * // → { 'user.name': 'John', 'user.address.city': 'NYC' }
 *
 * @example Flatten configuration:
 * collect({
 *     database: { host: 'localhost', port: 3306 },
 *     cache: { driver: 'redis' }
 * }).dot().all()
 * // → {
 * //     'database.host': 'localhost',
 * //     'database.port': 3306,
 * //     'cache.driver': 'redis'
 * //   }
 *
 * @see {@link undot} - Expand dot notation back to nested structure
 * @see {@link flatten} - Flatten nested arrays
 *
 * @category Transforming
 */
export const dotMethod: MethodDefinition<'dot'> = {
	name: 'dot',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<unknown, 'assoc'> {
		const result: Record<string, unknown> = {};

		const flatten = (obj: unknown, prefix = ''): void => {
			if (obj === null || typeof obj !== 'object') {
				result[prefix] = obj;
				return;
			}

			if (Array.isArray(obj)) {
				for (let i = 0; i < obj.length; i++) {
					flatten(obj[i], prefix ? `${prefix}.${i}` : String(i));
				}
				return;
			}

			for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
				flatten(value, prefix ? `${prefix}.${key}` : key);
			}
		};

		const items = this.getItems();
		flatten(items);

		return this.newInstance(result, true) as unknown as CoreCollection<unknown, 'assoc'>;
	},
};

/**
 * The `undot` method expands a single-level collection that uses "dot" notation
 * into a multi-dimensional collection. This is the inverse of the `dot` method.
 *
 * @returns New collection with nested structure
 *
 * @example
 * collect({
 *     'user.name': 'John',
 *     'user.address.city': 'NYC'
 * }).undot().all()
 * // → { user: { name: 'John', address: { city: 'NYC' } } }
 *
 * @example Expand form data:
 * collect({
 *     'items.0.name': 'Widget',
 *     'items.0.price': 100,
 *     'items.1.name': 'Gadget',
 *     'items.1.price': 200
 * }).undot().all()
 * // → {
 * //     items: {
 * //       0: { name: 'Widget', price: 100 },
 * //       1: { name: 'Gadget', price: 200 }
 * //     }
 * //   }
 *
 * @see {@link dot} - Flatten to dot notation
 *
 * @category Transforming
 */
export const undotMethod: MethodDefinition<'undot'> = {
	name: 'undot',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<unknown, 'assoc'> {
		const result: Record<string, unknown> = {};
		const items = this.getItems();

		for (const [key, value] of Object.entries(items)) {
			const parts = key.split('.');
			let current: Record<string, unknown> = result;

			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i];
				if (!(part in current)) {
					current[part] = {};
				}
				current = current[part] as Record<string, unknown>;
			}

			current[parts[parts.length - 1]] = value;
		}

		return this.newInstance(result, true) as unknown as CoreCollection<unknown, 'assoc'>;
	},
};

export default dotMethod;
