/**
 * duplicates method - find duplicate items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * The `duplicates` method retrieves and returns duplicate values from the collection.
 *
 * @param callback - Property key or callback to determine uniqueness
 * @param strict - Use strict comparison (default: false)
 * @returns Collection of duplicate items
 *
 * @example
 * collect(['a', 'b', 'a', 'c', 'b'])
 *     .duplicates()
 *     .all()
 * // → { '2': 'a', '4': 'b' }
 *
 * @example With key:
 * collect([
 *   { email: 'alice@example.com', name: 'Alice' },
 *   { email: 'bob@example.com', name: 'Bob' },
 *   { email: 'alice@example.com', name: 'Alice 2' },
 * ])
 *   .duplicates('email')
 *   .all()
 * // → { '2': { email: 'alice@example.com', name: 'Alice 2' } }
 *
 * @see {@link duplicatesStrict} - Strict comparison
 * @see {@link unique} - Get unique items
 *
 * @category Filtering
 */
export const duplicatesMethod: MethodDefinition<'duplicates'> = {
	name: 'duplicates',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: ValueRetriever<T, unknown>,
		strict = false,
	): CoreCollection<T, CK> {
		const items = this.getItems();
		const retriever = valueRetriever(callback);
		const result: Record<string, T> = {};

		if (strict) {
			const seen = new Map<unknown, boolean>();
			for (const [key, value] of Object.entries(items)) {
				const id = retriever(value, key);
				if (seen.has(id)) {
					result[key] = value;
				} else {
					seen.set(id, true);
				}
			}
		} else {
			const seenValues: unknown[] = [];
			const seenKeys: string[] = [];

			const looseFind = (arr: unknown[], val: unknown): number => {
				for (let i = 0; i < arr.length; i++) {
					// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
					if (arr[i] == val) return i;
				}
				return -1;
			};

			for (const [key, value] of Object.entries(items)) {
				const id = retriever(value, key);
				const foundIdx = looseFind(seenValues, id);

				if (foundIdx !== -1) {
					result[key] = value;
				} else {
					seenValues.push(id);
					seenKeys.push(key);
				}
			}
		}

		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `doesntContainStrict` method determines if the collection does not contain
 * a given item using strict comparison.
 *
 * @param keyOrValue - Value to find or property key
 * @param value - Value to compare when using key
 * @returns True if item is not found
 *
 * @example
 * collect([1, 2, 3])
 *     .doesntContainStrict('1')
 * // → true (strict comparison: '1' !== 1)
 *
 * @see {@link doesntContain} - Loose comparison
 * @see {@link containsStrict} - Inverse check
 *
 * @category Checking
 */
export const doesntContainStrictMethod: MethodDefinition<'doesntContainStrict'> = {
	name: 'doesntContainStrict',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrValue: T | string | ((value: T, key: string) => boolean),
		value?: T,
	): boolean {
		const containsStrict = (this as unknown as { containsStrict: (k: unknown, v?: T) => boolean }).containsStrict;
		return !containsStrict.call(this, keyOrValue, value);
	},
};

export default duplicatesMethod;
