/**
 * tap method - Category B (method only)
 *
 * tap is only useful in fluent chains, so no standalone export.
 *
 * @example
 * collect(users)
 *   .filter(u => u.active)
 *   .tap(c => console.log('Active users:', c.count()))
 *   .map(u => u.name);
 */

import type { CoreCollection, CollectionKind, MethodDefinition } from '../core/index.js';

/**
 * Method definition for Collection attachment.
 * Pass the collection to a callback without modifying it.
 */
export const tapMethod: MethodDefinition<'tap'> = {
	name: 'tap',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (collection: CoreCollection<T, CK>) => void,
	): CoreCollection<T, CK> {
		callback(this);
		return this;
	},
};

export default tapMethod;
