/**
 * contains method - Category A (standalone + method)
 * Check if collection contains a value or matches a predicate.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * Standalone contains function.
 */
export function contains<T>(items: readonly T[], value: T | ((item: T, index: number) => boolean)): boolean {
	if (typeof value === 'function') {
		const cb = value as (item: T, index: number) => boolean;
		for (let i = 0; i < items.length; i++) {
			if (cb(items[i], i)) return true;
		}
		return false;
	}

	for (let i = 0; i < items.length; i++) {
		// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
		if (items[i] == value) return true;
	}
	return false;
}

export const containsMethod: MethodDefinition<'contains'> = {
	name: 'contains',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrValue: string | T | ((item: T, key: number | string) => boolean),
		value?: unknown,
	): boolean {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		// Callback form
		if (typeof keyOrValue === 'function') {
			const cb = keyOrValue as (item: T, key: number | string) => boolean;
			for (let i = 0; i < items.length; i++) {
				if (cb(items[i], arr ? i : Object.keys(this.getItems())[i])) return true;
			}
			return false;
		}

		// Key-value form
		if (value !== undefined) {
			const key = keyOrValue as string;
			for (let i = 0; i < items.length; i++) {
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				if (dataGet(items[i], key) == value) return true;
			}
			return false;
		}

		// Direct value form
		for (let i = 0; i < items.length; i++) {
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			if (items[i] == keyOrValue) return true;
		}
		return false;
	},
};

export default containsMethod;
