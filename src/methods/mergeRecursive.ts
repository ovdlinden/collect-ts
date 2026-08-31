/**
 * mergeRecursive method - deep merge of nested objects.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

function collectableToRecord<T>(items: Record<string, T> | CoreCollection<T, CollectionKind>): Record<string, T> {
	if ('all' in items && typeof (items as CoreCollection<T, CollectionKind>).all === 'function') {
		return (items as CoreCollection<T, CollectionKind>).all() as Record<string, T>;
	}
	return items as Record<string, T>;
}

/**
 * The `mergeRecursive` method merges the given array or collection recursively with
 * the original collection. If a string key in the given items matches a string key
 * in the original collection, then the values for these keys are merged together
 * into an array, and this is done recursively.
 *
 * @param items - Object or collection to merge recursively
 * @returns New collection with deeply merged values
 *
 * @example Deep merge of settings:
 * collect({ user: { name: 'Alice', settings: { theme: 'dark' } } })
 *     .mergeRecursive({ user: { settings: { language: 'en' } } })
 *     .all()
 * // → { user: { name: 'Alice', settings: { theme: 'dark', language: 'en' } } }
 *
 * @example Merging nested objects:
 * collect({ a: { b: 1 } })
 *     .mergeRecursive({ a: { c: 2 } })
 *     .all()
 * // → { a: { b: 1, c: 2 } }
 *
 * @see {@link merge} - Shallow merge (overwrites nested objects)
 * @see {@link replaceRecursive} - Similar but overwrites instead of merging arrays
 *
 * @category Combining
 */
export const mergeRecursiveMethod: MethodDefinition<'mergeRecursive'> = {
	name: 'mergeRecursive',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Record<string, unknown> | CoreCollection<unknown, CollectionKind>,
	): CoreCollection<unknown, CK> {
		const other = collectableToRecord(items as CoreCollection<unknown, CollectionKind>) as Record<string, unknown>;

		const mergeDeep = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
			const result = { ...target };
			for (const key of Object.keys(source)) {
				if (
					typeof result[key] === 'object' &&
					result[key] !== null &&
					typeof source[key] === 'object' &&
					source[key] !== null
				) {
					result[key] = mergeDeep(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					result[key] = source[key];
				}
			}
			return result;
		};

		const selfItems = this.getItems() as unknown as Record<string, unknown>;
		const arr = this.getArrayItems();

		return this.newInstance(mergeDeep(selfItems, other), arr === null) as CoreCollection<unknown, CK>;
	},
};

export default mergeRecursiveMethod;
