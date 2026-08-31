/**
 * shuffle method - Category A (standalone + method)
 * Randomly shuffle items.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Standalone shuffle function (Fisher-Yates).
 */
export function shuffle<T>(items: readonly T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export const shuffleMethod: MethodDefinition<'shuffle'> = {
	name: 'shuffle',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		const result = [...items];
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		return this.newInstance(result) as CoreCollection<T, CK>;
	},
};

export default shuffleMethod;
