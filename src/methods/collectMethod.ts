/**
 * collect/toBase methods - create collection copies.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `collect` method returns a new Collection instance with the current items.
 * This is useful when you want to break the chain and get a fresh collection,
 * or convert a subclass back to a base Collection.
 *
 * @returns New Collection instance with the same items
 *
 * @example Create an independent copy:
 * const original = collect([1, 2, 3])
 * const copy = original.collect()
 * // original and copy are separate instances
 *
 * @example Break the chain:
 * collect([1, 2, 3])
 *     .map(n => n * 2)
 *     .collect()
 *     .filter(n => n > 2)
 *     .all()
 * // → [4, 6]
 *
 * @see {@link toBase} - Convert subclass to base Collection
 *
 * @category Transforming
 */
export const collectMethod: MethodDefinition<'collect'> = {
	name: 'collect',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return this.newInstance([...arr]) as CoreCollection<T, CK>;
		}
		return this.newInstance({ ...this.getItems() }, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `toBase` method returns a base Collection instance from the current collection.
 * This is useful when working with collection subclasses and you need to ensure
 * you have a standard Collection instance.
 *
 * @returns Base Collection instance
 *
 * @example Convert subclass to base:
 * class CustomCollection extends Collection {}
 * const custom = new CustomCollection([1, 2, 3])
 * const base = custom.toBase()
 * // base instanceof Collection === true
 *
 * @see {@link collect} - Create a new collection copy
 *
 * @category Transforming
 */
export const toBaseMethod: MethodDefinition<'toBase'> = {
	name: 'toBase',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return this.newInstance([...arr]) as CoreCollection<T, CK>;
		}
		return this.newInstance({ ...this.getItems() }, true) as CoreCollection<T, CK>;
	},
};

export default collectMethod;
