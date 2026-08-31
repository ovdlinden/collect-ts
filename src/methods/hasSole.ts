/**
 * hasMany/hasSole methods - count-based checks.
 */

import type { CollectionKey, CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { operatorForWhere } from '../core/utils.js';

function useAsCallable<T>(value: unknown): value is (value: T, key: string | number) => boolean {
	return typeof value === 'function';
}

/**
 * The `hasMany` method determines if multiple items exist in the collection
 * that match the given criteria.
 *
 * @param keyOrCallback - Property key or callback to filter items
 * @param operator - Comparison operator when using key/operator/value syntax
 * @param value - Value to compare against
 * @returns True if more than one item matches
 *
 * @example
 * collect([1, 2, 3, 4, 5])
 *     .hasMany()
 * // → true
 *
 * @example With callback:
 * collect([1, 2, 3, 4, 5])
 *     .hasMany(n => n > 3)
 * // → true (4 and 5)
 *
 * @example With key/value:
 * collect([
 *   { role: 'admin' },
 *   { role: 'user' },
 *   { role: 'user' },
 * ])
 *   .hasMany('role', 'user')
 * // → true
 *
 * @see {@link hasSole} - Check for exactly one
 * @see {@link count} - Get exact count
 *
 * @category Checking
 */
export const hasManyMethod: MethodDefinition<'hasMany'> = {
	name: 'hasMany',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrCallback?: string | ((value: T, key: CollectionKey<CK>) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		if (operator !== undefined || value !== undefined) {
			const filter = operatorForWhere<T>(keyOrCallback as string, operator, value);
			let count = 0;
			const arr = this.getArrayItems();
			const items = arr ?? Object.values(this.getItems());
			for (let i = 0; i < items.length; i++) {
				const k = arr ? i : Object.keys(this.getItems())[i];
				if (filter(items[i], k)) {
					count++;
					if (count > 1) return true;
				}
			}
			return false;
		}

		if (keyOrCallback) {
			const filter = useAsCallable<T>(keyOrCallback)
				? keyOrCallback
				: operatorForWhere<T>(keyOrCallback as string, '=', true);
			let count = 0;
			const arr = this.getArrayItems();
			const items = arr ?? Object.values(this.getItems());
			for (let i = 0; i < items.length; i++) {
				const k = arr ? i : Object.keys(this.getItems())[i];
				if (filter(items[i], k)) {
					count++;
					if (count > 1) return true;
				}
			}
			return false;
		}

		return this.count() > 1;
	},
};

/**
 * The `hasSole` method determines if exactly one item exists in the collection
 * that matches the given criteria.
 *
 * @param keyOrCallback - Property key or callback to filter items
 * @param operator - Comparison operator when using key/operator/value syntax
 * @param value - Value to compare against
 * @returns True if exactly one item matches
 *
 * @example
 * collect([1])
 *     .hasSole()
 * // → true
 *
 * @example With callback:
 * collect([1, 2, 3, 4, 5])
 *     .hasSole(n => n > 4)
 * // → true (only 5)
 *
 * @example With key/value:
 * collect([
 *   { role: 'admin' },
 *   { role: 'user' },
 *   { role: 'user' },
 * ])
 *   .hasSole('role', 'admin')
 * // → true
 *
 * @see {@link sole} - Get the sole item (throws if not exactly one)
 * @see {@link hasMany} - Check for more than one
 *
 * @category Checking
 */
export const hasSoleMethod: MethodDefinition<'hasSole'> = {
	name: 'hasSole',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrCallback?: string | ((value: T, key: CollectionKey<CK>) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		if (operator !== undefined || value !== undefined) {
			const filter = operatorForWhere<T>(keyOrCallback as string, operator, value);
			let count = 0;
			const arr = this.getArrayItems();
			const items = arr ?? Object.values(this.getItems());
			for (let i = 0; i < items.length; i++) {
				const k = arr ? i : Object.keys(this.getItems())[i];
				if (filter(items[i], k)) {
					count++;
					if (count > 1) return false;
				}
			}
			return count === 1;
		}

		if (keyOrCallback) {
			const filter = useAsCallable<T>(keyOrCallback)
				? keyOrCallback
				: operatorForWhere<T>(keyOrCallback as string, '=', true);
			let count = 0;
			const arr = this.getArrayItems();
			const items = arr ?? Object.values(this.getItems());
			for (let i = 0; i < items.length; i++) {
				const k = arr ? i : Object.keys(this.getItems())[i];
				if (filter(items[i], k)) {
					count++;
					if (count > 1) return false;
				}
			}
			return count === 1;
		}

		return this.count() === 1;
	},
};

export default hasSoleMethod;
