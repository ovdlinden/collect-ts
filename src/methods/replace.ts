/**
 * replace methods - value replacement operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

function collectableToRecord<T>(items: Record<string, T> | CoreCollection<T, CollectionKind>): Record<string, T> {
	if ('all' in items && typeof (items as CoreCollection<T, CollectionKind>).all === 'function') {
		return (items as CoreCollection<T, CollectionKind>).all() as Record<string, T>;
	}
	return items as Record<string, T>;
}

/**
 * The `replace` method replaces items in the collection by key. Existing keys will be
 * overwritten with the new values. This is useful for merging settings or configurations
 * where you want to ensure certain keys are updated.
 *
 * @param items - Object or collection with replacement values
 * @returns New collection with replaced values
 *
 * @example Replace by numeric index:
 * collect(['a', 'b', 'c'])
 *     .replace({ 1: 'B', 2: 'C' })
 *     .all()
 * // → ['a', 'B', 'C']
 *
 * @example Replace object properties:
 * collect({ name: 'Alice', age: 30 })
 *     .replace({ age: 31 })
 *     .all()
 * // → { name: 'Alice', age: 31 }
 *
 * @see {@link merge} - Merge without replacing by numeric key
 * @see {@link replaceRecursive} - Replace nested objects recursively
 *
 * @category Combining
 */
export const replaceMethod: MethodDefinition<'replace'> = {
	name: 'replace',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Record<string, T> | CoreCollection<T, CollectionKind>,
	): CoreCollection<T, CK> {
		const other = collectableToRecord(items);
		const selfItems = this.getItems();

		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(selfItems)) {
			result[key] = key in other ? other[key] : value;
		}
		for (const [key, value] of Object.entries(other)) {
			if (!(key in result)) {
				result[key] = value;
			}
		}

		const arr = this.getArrayItems();
		return this.newInstance(result, arr === null) as CoreCollection<T, CK>;
	},
};

/**
 * The `replaceRecursive` method works like `replace`, but it will recurse into
 * nested objects and apply the same replacement process to the inner values.
 *
 * @param items - Object or collection with replacement values
 * @returns New collection with recursively replaced values
 *
 * @example Recursive replacement:
 * collect({
 *     user: { name: 'Alice', settings: { theme: 'dark', lang: 'en' } }
 * }).replaceRecursive({
 *     user: { settings: { theme: 'light' } }
 * }).all()
 * // → { user: { name: 'Alice', settings: { theme: 'light', lang: 'en' } } }
 *
 * @see {@link replace} - Shallow replacement
 * @see {@link mergeRecursive} - Similar but merges arrays instead of replacing
 *
 * @category Combining
 */
export const replaceRecursiveMethod: MethodDefinition<'replaceRecursive'> = {
	name: 'replaceRecursive',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		items: Record<string, unknown> | CoreCollection<unknown, CollectionKind>,
	): CoreCollection<unknown, CK> {
		const other = collectableToRecord(items as CoreCollection<unknown, CollectionKind>) as Record<string, unknown>;

		const replaceDeep = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
			const result = { ...target };
			for (const key of Object.keys(source)) {
				if (
					typeof result[key] === 'object' &&
					result[key] !== null &&
					typeof source[key] === 'object' &&
					source[key] !== null
				) {
					result[key] = replaceDeep(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					result[key] = source[key];
				}
			}
			return result;
		};

		const selfItems = this.getItems() as unknown as Record<string, unknown>;
		const arr = this.getArrayItems();

		return this.newInstance(replaceDeep(selfItems, other), arr === null) as CoreCollection<unknown, CK>;
	},
};

export default replaceMethod;
