/**
 * containsOneItem/containsStrict/doesntContain methods.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `containsOneItem` method returns `true` if the collection contains exactly one item.
 *
 * @returns True if collection has exactly one item
 *
 * @example
 * collect([1])
 *     .containsOneItem()
 * // → true
 *
 * @example Multiple items:
 * collect([1, 2])
 *     .containsOneItem()
 * // → false
 *
 * @example Empty:
 * collect([])
 *     .containsOneItem()
 * // → false
 *
 * @see {@link count} - Get number of items
 * @see {@link isEmpty} - Check if empty
 *
 * @category Checking
 */
export const containsOneItemMethod: MethodDefinition<'containsOneItem'> = {
	name: 'containsOneItem',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): boolean {
		return this.count() === 1;
	},
};

/**
 * The `containsStrict` method determines if the collection contains a given item
 * using strict comparison (`===`).
 *
 * @param key - Key to check, or value if only one argument
 * @param value - Value to check for
 * @returns True if the item exists with strict equality
 *
 * @example
 * collect([1, 2, 3])
 *     .containsStrict(2)
 * // → true
 *
 * @example Strict comparison:
 * collect([1, 2, 3])
 *     .containsStrict('2')
 * // → false (strict: 2 !== '2')
 *
 * @example With key/value:
 * collect([{ id: 1 }, { id: 2 }])
 *     .containsStrict('id', 1)
 * // → true
 *
 * @see {@link contains} - Loose equality
 * @see {@link doesntContain} - Negation
 *
 * @category Checking
 */
export const containsStrictMethod: MethodDefinition<'containsStrict'> = {
	name: 'containsStrict',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key: string | T, value?: unknown): boolean {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (value !== undefined) {
			// Key/value pair check
			for (const item of items) {
				if (dataGet(item, key as string) === value) {
					return true;
				}
			}
			return false;
		}

		// Direct value check
		for (const item of items) {
			if (item === key) {
				return true;
			}
		}

		return false;
	},
};

/**
 * The `doesntContain` method determines if the collection does not contain a given item.
 * This is the inverse of {@link contains}.
 *
 * @param key - Key to check, or value/callback
 * @param value - Value to check for
 * @returns True if the item does NOT exist
 *
 * @example
 * collect([1, 2, 3])
 *     .doesntContain(4)
 * // → true
 *
 * @example Item exists:
 * collect([1, 2, 3])
 *     .doesntContain(2)
 * // → false
 *
 * @example With key/value:
 * collect([{ id: 1 }, { id: 2 }])
 *     .doesntContain('id', 3)
 * // → true
 *
 * @see {@link contains} - Check if item exists
 * @see {@link containsStrict} - Strict equality check
 *
 * @category Checking
 */
export const doesntContainMethod: MethodDefinition<'doesntContain'> = {
	name: 'doesntContain',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: string | T | ((item: T, key: number | string) => boolean),
		value?: unknown,
	): boolean {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const keys = arr ? items.map((_, i) => i) : Object.keys(this.getItems());

		if (typeof key === 'function') {
			// Callback check
			for (let i = 0; i < items.length; i++) {
				if ((key as (item: T, key: number | string) => boolean)(items[i] as T, keys[i])) {
					return false;
				}
			}
			return true;
		}

		if (value !== undefined) {
			// Key/value pair check
			for (const item of items) {
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel loose comparison
				if (dataGet(item, key as string) == value) {
					return false;
				}
			}
			return true;
		}

		// Direct value check
		for (const item of items) {
			// biome-ignore lint/suspicious/noDoubleEquals: Laravel loose comparison
			if (item == key) {
				return false;
			}
		}

		return true;
	},
};

export default containsOneItemMethod;
