/**
 * mapInto/mapSpread/mapWithKeys/mapToDictionary/mapToGroups methods.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `mapInto` method iterates over the collection and creates a new instance
 * of the given class for each item, passing the item value and key to the constructor.
 *
 * @param classConstructor - Class to instantiate for each item
 * @returns New collection of class instances
 *
 * @example
 * class Currency {
 *     constructor(public amount: number) {}
 *     format() { return `$${this.amount.toFixed(2)}`; }
 * }
 * collect([100, 250, 50])
 *     .mapInto(Currency)
 *     .map(c => c.format())
 *     .all()
 * // → ['$100.00', '$250.00', '$50.00']
 *
 * @see {@link map} - Transform with arbitrary callback
 * @see {@link pipeInto} - Pass entire collection to constructor
 *
 * @category Transforming
 */
export const mapIntoMethod: MethodDefinition<'mapInto'> = {
	name: 'mapInto',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		classConstructor: new (value: T, key: number | string) => U,
	): CoreCollection<U, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			const result: U[] = [];
			for (let i = 0; i < arr.length; i++) {
				result.push(new classConstructor(arr[i], i));
			}
			return this.newInstance(result) as unknown as CoreCollection<U, CK>;
		}

		const items = this.getItems();
		const result: Record<string, U> = {};
		for (const [key, value] of Object.entries(items)) {
			result[key] = new classConstructor(value, key);
		}
		return this.newInstance(result, true) as unknown as CoreCollection<U, CK>;
	},
};

/**
 * The `mapSpread` method iterates over the collection's items, passing each nested
 * item value into the given callback as separate arguments.
 *
 * @param callback - Function that receives spread arguments
 * @returns New collection with callback results
 *
 * @example
 * collect([[1, 2], [3, 4], [5, 6]])
 *     .mapSpread((a, b) => a + b)
 *     .all()
 * // → [3, 7, 11]
 *
 * @example You may also access the key:
 * collect([['Taylor', 'Laravel'], ['Caleb', 'Livewire']])
 *     .mapSpread((name, project, key) => `${key}: ${name} - ${project}`)
 *     .all()
 * // → ['0: Taylor - Laravel', '1: Caleb - Livewire']
 *
 * @see {@link eachSpread} - Iterate without transforming
 * @see {@link flatMap} - Map and flatten results
 *
 * @category Transforming
 */
export const mapSpreadMethod: MethodDefinition<'mapSpread'> = {
	name: 'mapSpread',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (...args: unknown[]) => U,
	): CoreCollection<U, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			const result: U[] = [];
			for (let i = 0; i < arr.length; i++) {
				const item = arr[i];
				if (Array.isArray(item)) {
					result.push(callback(...item, i));
				} else {
					result.push(callback(item, i));
				}
			}
			return this.newInstance(result) as unknown as CoreCollection<U, CK>;
		}

		const items = this.getItems();
		const result: Record<string, U> = {};
		for (const [key, value] of Object.entries(items)) {
			if (Array.isArray(value)) {
				result[key] = callback(...value, key);
			} else {
				result[key] = callback(value, key);
			}
		}
		return this.newInstance(result, true) as unknown as CoreCollection<U, CK>;
	},
};

/**
 * The `mapWithKeys` method iterates through the collection and passes each value
 * to the given callback. The callback should return an associative array containing
 * a single key/value pair.
 *
 * @param callback - Function returning [key, value] tuple
 * @returns New associative collection
 *
 * @example
 * collect([
 *     { name: 'John', department: 'Sales' },
 *     { name: 'Jane', department: 'Marketing' }
 * ]).mapWithKeys(emp => [emp.name, emp.department])
 *   .all()
 * // → { John: 'Sales', Jane: 'Marketing' }
 *
 * @see {@link map} - Transform values keeping original keys
 * @see {@link keyBy} - Key by a property without transforming values
 *
 * @category Transforming
 */
export const mapWithKeysMethod: MethodDefinition<'mapWithKeys'> = {
	name: 'mapWithKeys',
	chainable: true,
	fn<T, K extends string | number, V, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: number | string) => [K, V],
	): CoreCollection<V, 'assoc'> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const keys = arr ? items.map((_, i) => i) : Object.keys(this.getItems());

		const result: Record<string, V> = {};
		for (let i = 0; i < items.length; i++) {
			const [newKey, newValue] = callback(items[i] as T, keys[i]);
			result[String(newKey)] = newValue;
		}

		return this.newInstance(result, true) as unknown as CoreCollection<V, 'assoc'>;
	},
};

export default mapIntoMethod;
