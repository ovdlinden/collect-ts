/**
 * each method - Category B (method only)
 *
 * each is primarily for side effects in fluent chains.
 *
 * @example
 * collect(users)
 *   .each(u => sendEmail(u.email))
 *   .map(u => u.name);
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * Method definition for Collection attachment.
 * Iterate over items with side effects, optionally break early.
 */
export const eachMethod: MethodDefinition<'each'> = {
	name: 'each',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: number | string) => undefined | false,
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr) {
			for (let i = 0; i < arr.length; i++) {
				if (callback(arr[i], i) === false) break;
			}
			return this;
		}

		// Object path
		const items = this.getItems();
		for (const [key, value] of Object.entries(items)) {
			if (callback(value, key) === false) break;
		}
		return this;
	},
};

export default eachMethod;
