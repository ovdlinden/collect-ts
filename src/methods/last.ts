/**
 * last method - Category A (standalone + method)
 * Returns the last item matching a predicate.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone last function.
 * Returns the last item matching a predicate.
 */
export function last<T>(items: readonly T[], callback?: (value: T, index: number) => boolean): T | undefined {
	if (!callback) {
		return items[items.length - 1];
	}
	for (let i = items.length - 1; i >= 0; i--) {
		if (callback(items[i], i)) return items[i];
	}
	return undefined;
}

export const lastMethod: MethodDefinition<'last'> = {
	name: 'last',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback?: ((value: T, key: number | string) => boolean) | null,
		defaultValue?: T | (() => T),
	): T | undefined {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (!callback) {
			const result = items[items.length - 1];
			if (result !== undefined) return result;
			return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
		}

		for (let i = items.length - 1; i >= 0; i--) {
			const key = arr ? i : Object.keys(this.getItems())[i];
			if (callback(items[i], key)) return items[i];
		}

		return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
	},
};

export default lastMethod;
