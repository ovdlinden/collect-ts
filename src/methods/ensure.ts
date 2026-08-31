/**
 * ensure method - type checking.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { UnexpectedValueException } from '../exceptions/index.js';

/**
 * The `ensure` method may be used to verify that all elements of a collection
 * are of a given type or list of types. Otherwise, an exception will be thrown.
 *
 * @param types - Type or array of types to check against
 * @returns The collection (for chaining)
 * @throws UnexpectedValueException if any item doesn't match
 *
 * @example With primitive type:
 * collect([1, 2, 3])
 *     .ensure('number')
 *     .all()
 * // → [1, 2, 3]
 *
 * @example With class:
 * class User {}
 * collect([new User(), new User()])
 *     .ensure(User)
 *     .all()
 * // → [User, User]
 *
 * @example Multiple types:
 * collect([1, 'hello', 2])
 *     .ensure(['number', 'string'])
 *     .all()
 * // → [1, 'hello', 2]
 *
 * @example Throws on mismatch:
 * collect([1, 'hello'])
 *     .ensure('number')
 * // throws UnexpectedValueException
 *
 * @category Checking
 */
export const ensureMethod: MethodDefinition<'ensure'> = {
	name: 'ensure',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		// biome-ignore lint/complexity/noBannedTypes: Laravel API compatibility requires Function type
		types: string | Function | (string | Function)[],
	): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());
		const typeArray = Array.isArray(types) ? types : [types];

		for (const item of items) {
			let matches = false;

			for (const type of typeArray) {
				if (typeof type === 'string') {
					if (typeof item === type) {
						matches = true;
						break;
					}
				} else if (typeof type === 'function') {
					if (item instanceof type) {
						matches = true;
						break;
					}
				}
			}

			if (!matches) {
				const expected = typeArray.map((t) => (typeof t === 'string' ? t : t.name)).join(' or ');
				const actual = typeof item;
				throw new UnexpectedValueException(`Collection item is of type ${actual}, expected ${expected}.`);
			}
		}

		return this;
	},
};

export default ensureMethod;
