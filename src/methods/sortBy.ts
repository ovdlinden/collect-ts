/**
 * sortBy method - Category A (standalone + method)
 * Sort by key or callback.
 */

import type { CollectionKind, CoreCollection, MethodDefinition, ValueRetriever } from '../core/index.js';
import { valueRetriever } from '../core/utils.js';

/**
 * Standalone sortBy function.
 */
export function sortBy<T>(items: readonly T[], key: keyof T | ((item: T) => unknown)): T[] {
	const getValue = typeof key === 'function' ? key : (item: T) => (item as Record<string, unknown>)[key as string];
	return [...items].sort((a, b) => {
		const va = getValue(a) as number | string;
		const vb = getValue(b) as number | string;
		if (va < vb) return -1;
		if (va > vb) return 1;
		return 0;
	});
}

export const sortByMethod: MethodDefinition<'sortBy'> = {
	name: 'sortBy',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: ValueRetriever<T, unknown>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const getValue = valueRetriever<T, unknown>(key);

		const sorted = [...items].sort((a, b) => {
			const va = getValue(a, 0) as number | string;
			const vb = getValue(b, 0) as number | string;
			if (va < vb) return -1;
			if (va > vb) return 1;
			return 0;
		});
		return this.newInstance(sorted) as CoreCollection<T, CK>;
	},
};

export const sortByDescMethod: MethodDefinition<'sortByDesc'> = {
	name: 'sortByDesc',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		key: ValueRetriever<T, unknown>,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const getValue = valueRetriever<T, unknown>(key);

		const sorted = [...items].sort((a, b) => {
			const va = getValue(a, 0) as number | string;
			const vb = getValue(b, 0) as number | string;
			if (va > vb) return -1;
			if (va < vb) return 1;
			return 0;
		});
		return this.newInstance(sorted) as CoreCollection<T, CK>;
	},
};

export default sortByMethod;
