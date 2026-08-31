/**
 * every method - Category A (standalone + method)
 * Check if all items match a predicate.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * Standalone every function.
 */
export function every<T>(items: readonly T[], callback: (item: T, index: number) => boolean): boolean {
	for (let i = 0; i < items.length; i++) {
		if (!callback(items[i], i)) return false;
	}
	return true;
}

export const everyMethod: MethodDefinition<'every'> = {
	name: 'every',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrCallback: string | ((item: T, key: number | string) => boolean),
		value?: unknown,
	): boolean {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		// Callback form
		if (typeof keyOrCallback === 'function') {
			for (let i = 0; i < items.length; i++) {
				if (!keyOrCallback(items[i], arr ? i : Object.keys(this.getItems())[i])) return false;
			}
			return true;
		}

		// Key-value form
		const key = keyOrCallback;
		for (let i = 0; i < items.length; i++) {
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			if (dataGet(items[i], key) != value) return false;
		}
		return true;
	},
};

export default everyMethod;
