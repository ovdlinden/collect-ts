/**
 * mapToDictionary/mapToGroups/mapWithKey methods.
 */

import type { CollectionKey, CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `mapToDictionary` method runs the given callback over each item and groups
 * the returned values by their keys.
 *
 * @param callback - Function returning a [groupKey, value] tuple for each item
 * @returns Collection of arrays grouped by the returned keys
 *
 * @example
 * collect([
 *   { name: 'John', department: 'Sales' },
 *   { name: 'Jane', department: 'Sales' },
 *   { name: 'Bob', department: 'Marketing' },
 * ])
 *   .mapToDictionary(emp => [emp.department, emp.name])
 *   .all()
 * // → { Sales: ['John', 'Jane'], Marketing: ['Bob'] }
 *
 * @see {@link mapToGroups} - Similar but returns nested Collections
 * @see {@link groupBy} - Group by key without value transformation
 *
 * @category Transforming
 */
export const mapToDictionaryMethod: MethodDefinition<'mapToDictionary'> = {
	name: 'mapToDictionary',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: string) => [string, U],
	): CoreCollection<U[], 'assoc'> {
		const arr = this.getArrayItems();
		const dictionary: Record<string, U[]> = {};

		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				const [dictKey, dictValue] = callback(arr[i], String(i));
				if (!dictionary[dictKey]) {
					dictionary[dictKey] = [];
				}
				dictionary[dictKey].push(dictValue);
			}
		} else {
			for (const [key, value] of Object.entries(this.getItems())) {
				const [dictKey, dictValue] = callback(value, key);
				if (!dictionary[dictKey]) {
					dictionary[dictKey] = [];
				}
				dictionary[dictKey].push(dictValue);
			}
		}

		return this.newInstance(dictionary, true) as unknown as CoreCollection<U[], 'assoc'>;
	},
};

/**
 * The `mapToGroups` method groups the collection's items by the given callback.
 * The callback returns a [key, value] tuple that determines the grouping.
 *
 * @param callback - Function returning a [groupKey, value] tuple for each item
 * @returns Collection of Collections grouped by the returned keys
 *
 * @example
 * collect([
 *   { name: 'John', department: 'Sales' },
 *   { name: 'Jane', department: 'Sales' },
 *   { name: 'Bob', department: 'Marketing' },
 * ])
 *   .mapToGroups(emp => [emp.department, emp.name])
 * // → { Sales: Collection(['John', 'Jane']), Marketing: Collection(['Bob']) }
 *
 * @see {@link mapToDictionary} - Similar but returns plain arrays
 * @see {@link groupBy} - Group by key without value transformation
 *
 * @category Transforming
 */
export const mapToGroupsMethod: MethodDefinition<'mapToGroups'> = {
	name: 'mapToGroups',
	chainable: true,
	fn<T, K extends string, V, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: string) => [K, V],
	): CoreCollection<CoreCollection<V, 'array'>, 'assoc'> {
		const arr = this.getArrayItems();
		const dictionary: Record<string, V[]> = {};

		if (arr !== null) {
			for (let i = 0; i < arr.length; i++) {
				const [dictKey, dictValue] = callback(arr[i], String(i));
				if (!dictionary[dictKey]) {
					dictionary[dictKey] = [];
				}
				dictionary[dictKey].push(dictValue);
			}
		} else {
			for (const [key, value] of Object.entries(this.getItems())) {
				const [dictKey, dictValue] = callback(value, key);
				if (!dictionary[dictKey]) {
					dictionary[dictKey] = [];
				}
				dictionary[dictKey].push(dictValue);
			}
		}

		const groups: Record<string, CoreCollection<V, 'array'>> = {};
		for (const [key, values] of Object.entries(dictionary)) {
			groups[key] = this.newInstance(values) as unknown as CoreCollection<V, 'array'>;
		}

		return this.newInstance(groups, true) as unknown as CoreCollection<CoreCollection<V, 'array'>, 'assoc'>;
	},
};

/**
 * The `mapWithKey` method iterates through the collection with access to a related
 * collection, allowing transformation based on related data.
 *
 * @param fn - Function receiving (item, key, relatedCollection) and returning new value
 * @returns Transformed collection
 *
 * @see {@link map} - Simple transformation
 * @see {@link mapWithKeys} - Transform and change keys
 *
 * @category Transforming
 */
export const mapWithKeyMethod: MethodDefinition<'mapWithKey'> = {
	name: 'mapWithKey',
	chainable: true,
	fn<T, R, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		fn: (item: T, key: CollectionKey<CK>, related: CoreCollection<U, CollectionKind>) => R,
	): CoreCollection<R, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result = items.map((item, i) => {
			const key = arr ? i : Object.keys(this.getItems())[i];
			return fn(item, key as CollectionKey<CK>, this as unknown as CoreCollection<U, CollectionKind>);
		});

		return this.newInstance(result) as unknown as CoreCollection<R, CK>;
	},
};

export default mapToDictionaryMethod;
