/**
 * join/implode method - Category A (standalone + method)
 * Join items into a string.
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * Standalone join function.
 */
export function join<T>(items: readonly T[], glue = '', finalGlue?: string): string {
	const arr = items.map(String);
	if (finalGlue === undefined || arr.length <= 1) {
		return arr.join(glue);
	}
	const last = arr.pop()!;
	return arr.join(glue) + finalGlue + last;
}

export const joinMethod: MethodDefinition<'join'> = {
	name: 'join',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		glue = '',
		finalGlue?: string,
	): string {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const strings = items.map(String);

		if (finalGlue === undefined || strings.length <= 1) {
			return strings.join(glue);
		}
		const last = strings.pop()!;
		return strings.join(glue) + finalGlue + last;
	},
};

export const implodeMethod: MethodDefinition<'implode'> = {
	name: 'implode',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		keyOrGlue: string,
		glue?: string,
	): string {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (glue === undefined) {
			return items.map(String).join(keyOrGlue);
		}

		return items.map((item) => String(dataGet(item, keyOrGlue))).join(glue);
	},
};

export default joinMethod;
