/**
 * first method - Category A (standalone + method)
 *
 * @example Standalone usage
 * import { first } from 'collect-ts/fn';
 * const admin = first(users, u => u.role === 'admin');
 *
 * @example Method usage
 * collect(users).first(u => u.role === 'admin');
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Standalone first function.
 * Returns the first item matching a predicate.
 *
 * @param items - Array to search
 * @param callback - Optional predicate function
 * @returns First matching item or undefined
 *
 * @example Without predicate
 * first([1, 2, 3])
 * // → 1
 *
 * @example With predicate
 * first(users, u => u.active)
 * // → first active user
 */
export function first<T>(items: readonly T[], callback?: (value: T, index: number) => boolean): T | undefined {
	if (!callback) {
		return items[0];
	}
	for (let i = 0; i < items.length; i++) {
		if (callback(items[i], i)) return items[i];
	}
	return undefined;
}

/**
 * Method definition for Collection attachment.
 */
export const firstMethod: MethodDefinition<'first'> = {
	name: 'first',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: ((value: T, key: number | string) => boolean) | null,
		defaultValue?: T | (() => T),
	): T | undefined {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (!callback) {
			const result = items[0];
			if (result !== undefined) return result;
			return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
		}

		for (let i = 0; i < items.length; i++) {
			const key = arr ? i : Object.keys(this.getItems())[i];
			if (callback(items[i], key)) return items[i];
		}

		return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
	},
};

export default firstMethod;
