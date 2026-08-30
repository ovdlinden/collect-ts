/**
 * groupBy method - Category A (standalone + method)
 *
 * @example Standalone usage
 * import { groupBy } from 'collect-ts/fn';
 * const byRole = groupBy(users, 'role');
 *
 * @example Method usage
 * collect(users).groupBy('role');
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
import { toGroupKey, valueRetriever } from '../core/utils.js';

/**
 * Standalone groupBy function.
 * Groups items by a key or callback.
 *
 * @param items - Array to group
 * @param key - Property key or callback
 * @returns Object with groups as keys and arrays as values
 *
 * @example By key
 * groupBy(users, 'role')
 * // → { admin: [...], user: [...] }
 *
 * @example By callback
 * groupBy(users, u => u.age >= 18 ? 'adult' : 'minor')
 * // → { adult: [...], minor: [...] }
 */
export function groupBy<T, K extends keyof T>(items: readonly T[], key: K): Record<string, T[]>;
export function groupBy<T>(items: readonly T[], callback: (item: T, index: number) => string): Record<string, T[]>;
export function groupBy<T>(
	items: readonly T[],
	keyOrCallback: string | ((item: T, index: number) => string),
): Record<string, T[]> {
	const groups: Record<string, T[]> = Object.create(null);
	const getKey =
		typeof keyOrCallback === 'function'
			? (item: T, i: number) => keyOrCallback(item, i)
			: valueRetriever<T, string>(keyOrCallback);

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const gk = toGroupKey(getKey(item, i));
		if (!groups[gk]) groups[gk] = [];
		groups[gk].push(item);
	}

	return groups;
}

/**
 * Method definition for Collection attachment.
 * Optimized for single-pass grouping with lazy Collection wrapping.
 */
export const groupByMethod: MethodDefinition<'groupBy'> = {
	name: 'groupBy',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		groupByKey: ValueRetriever<T, string | string[]>,
		preserveKeys = false,
	): CoreCollection<CoreCollection<T, CK>, CK> {
		const arr = this.getArrayItems();

		// Fast path: simple key-based grouping on arrays
		if (arr && !preserveKeys && typeof groupByKey === 'string' && !groupByKey.includes('.')) {
			const rawGroups: Record<string, T[]> = Object.create(null);

			for (let i = 0; i < arr.length; i++) {
				const item = arr[i];
				const gk = toGroupKey((item as Record<string, unknown>)[groupByKey]);
				if (!rawGroups[gk]) rawGroups[gk] = [];
				rawGroups[gk].push(item);
			}

			// Wrap each group in a Collection
			const wrapped: Record<string, CoreCollection<T, CK>> = Object.create(null);
			for (const key of Object.keys(rawGroups)) {
				wrapped[key] = this.newInstance(rawGroups[key]) as CoreCollection<T, CK>;
			}

			return this.newInstance(wrapped, true) as CoreCollection<CoreCollection<T, CK>, CK>;
		}

		// General path: callback or preserveKeys
		const getKey = valueRetriever<T, string | string[]>(groupByKey);
		const items = arr ?? Object.values(this.getItems());
		const groups: Record<string, T[]> = Object.create(null);

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const keys = getKey(item, i);
			const keyArray = Array.isArray(keys) ? keys : [keys];

			for (const k of keyArray) {
				const gk = toGroupKey(k);
				if (!groups[gk]) groups[gk] = [];
				groups[gk].push(item);
			}
		}

		const wrapped: Record<string, CoreCollection<T, CK>> = Object.create(null);
		for (const key of Object.keys(groups)) {
			wrapped[key] = this.newInstance(groups[key]) as CoreCollection<T, CK>;
		}

		return this.newInstance(wrapped, true) as CoreCollection<CoreCollection<T, CK>, CK>;
	},
};

export default groupByMethod;
