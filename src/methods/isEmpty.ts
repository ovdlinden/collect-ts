/**
 * isEmpty/isNotEmpty methods - check collection emptiness.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `isEmpty` method returns `true` if the collection is empty; otherwise, `false` is returned.
 *
 * @returns True if collection has no items
 *
 * @example
 * collect([])
 *     .isEmpty()
 * // → true
 *
 * @example Non-empty:
 * collect([1, 2, 3])
 *     .isEmpty()
 * // → false
 *
 * @example With objects:
 * collect({})
 *     .isEmpty()
 * // → true
 *
 * @see {@link isNotEmpty} - Inverse check
 * @see {@link count} - Get number of items
 * @see {@link whenEmpty} - Execute callback when empty
 *
 * @category Checking
 */
export const isEmptyMethod: MethodDefinition<'isEmpty'> = {
	name: 'isEmpty',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): boolean {
		return this.count() === 0;
	},
};

/**
 * The `isNotEmpty` method returns `true` if the collection is not empty; otherwise, `false` is returned.
 *
 * @returns True if collection has items
 *
 * @example
 * collect([1, 2, 3])
 *     .isNotEmpty()
 * // → true
 *
 * @example Empty:
 * collect([])
 *     .isNotEmpty()
 * // → false
 *
 * @see {@link isEmpty} - Inverse check
 * @see {@link count} - Get number of items
 * @see {@link whenNotEmpty} - Execute callback when not empty
 *
 * @category Checking
 */
export const isNotEmptyMethod: MethodDefinition<'isNotEmpty'> = {
	name: 'isNotEmpty',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): boolean {
		return this.count() > 0;
	},
};

export default isEmptyMethod;
