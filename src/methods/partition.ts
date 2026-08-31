/**
 * partition method - Category A (standalone + method)
 * Partition into two arrays based on predicate.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone partition function.
 */
export function partition<T>(items: readonly T[], callback: (item: T, index: number) => boolean): [T[], T[]] {
	const pass: T[] = [];
	const fail: T[] = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (callback(item, i)) {
			pass.push(item);
		} else {
			fail.push(item);
		}
	}
	return [pass, fail];
}

export const partitionMethod: MethodDefinition<'partition'> = {
	name: 'partition',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (item: T, key: number | string) => boolean,
	): [CoreCollection<T, CK>, CoreCollection<T, CK>] {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const pass: T[] = [];
		const fail: T[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const key = arr ? i : Object.keys(this.getItems())[i];
			if (callback(item, key)) {
				pass.push(item);
			} else {
				fail.push(item);
			}
		}
		return [this.newInstance(pass) as CoreCollection<T, CK>, this.newInstance(fail) as CoreCollection<T, CK>];
	},
};

export default partitionMethod;
