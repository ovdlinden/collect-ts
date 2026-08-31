/**
 * after/before methods - find neighboring items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `after` method returns the item after the given item.
 * Returns null if the item is not found or is the last item.
 *
 * @param value - Value to find or callback to match
 * @param strict - Use strict comparison
 * @returns The next item, or null
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .after(3)
 * // → 4
 *
 * @example With callback:
 * collect([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 3, name: 'Carol' },
 * ])
 *   .after(item => item.name === 'Bob')
 * // → { id: 3, name: 'Carol' }
 *
 * @example Last item returns null:
 * collect([1, 2, 3])
 *     .after(3)
 * // → null
 *
 * @see {@link before} - Get the item before
 * @see {@link search} - Find item's key
 *
 * @category Finding
 */
export const afterMethod: MethodDefinition<'after'> = {
	name: 'after',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((value: T, key: string) => boolean),
		strict = false,
	): T | null {
		const searchResult = (this as unknown as { search: (v: unknown, s: boolean) => string | false }).search(
			value,
			strict,
		);
		if (searchResult === false) return null;

		const keysCollection = (this as unknown as { keys: () => CoreCollection<string, 'array'> }).keys();
		const keysArray = keysCollection.toArray() as string[];
		const position = keysArray.indexOf(searchResult);
		if (position === keysArray.length - 1) return null;

		const getResult = (this as unknown as { get: (k: string) => T | null }).get(keysArray[position + 1]);
		return getResult ?? null;
	},
};

/**
 * The `before` method returns the item before the given item.
 * Returns null if the item is not found or is the first item.
 *
 * @param value - Value to find or callback to match
 * @param strict - Use strict comparison
 * @returns The previous item, or null
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .before(3)
 * // → 2
 *
 * @example With callback:
 * collect([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 3, name: 'Carol' },
 * ])
 *   .before(item => item.name === 'Bob')
 * // → { id: 1, name: 'Alice' }
 *
 * @example First item returns null:
 * collect([1, 2, 3])
 *     .before(1)
 * // → null
 *
 * @see {@link after} - Get the item after
 * @see {@link search} - Find item's key
 *
 * @category Finding
 */
export const beforeMethod: MethodDefinition<'before'> = {
	name: 'before',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((value: T, key: string) => boolean),
		strict = false,
	): T | null {
		const searchResult = (this as unknown as { search: (v: unknown, s: boolean) => string | false }).search(
			value,
			strict,
		);
		if (searchResult === false) return null;

		const keysCollection = (this as unknown as { keys: () => CoreCollection<string, 'array'> }).keys();
		const keysArray = keysCollection.toArray() as string[];
		const position = keysArray.indexOf(searchResult);
		if (position === 0) return null;

		const getResult = (this as unknown as { get: (k: string) => T | null }).get(keysArray[position - 1]);
		return getResult ?? null;
	},
};

export default afterMethod;
