/**
 * pipe/pipeInto/pipeThrough methods - pass collection through functions.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `pipe` method passes the collection to the given closure and returns the result
 * of the executed closure. This is useful for wrapping the collection in custom logic
 * or breaking out of the method chain when needed.
 *
 * @param callback - Function that receives the collection
 * @returns Result of the callback
 *
 * @example
 * collect([1, 2, 3])
 *     .pipe(c => c.sum() * 2)
 * // → 12
 *
 * @example For conditional logic:
 * collect([
 *   { name: 'Taylor' },
 *   { name: 'Abigail' },
 *   { name: 'James' },
 * ])
 *   .pipe(c => c.isEmpty() ? 'No users' : `${c.count()} users`)
 * // → '3 users'
 *
 * @example Chain with external function:
 * const formatUsers = (c) => c.pluck('name').join(', ')
 * collect([{ name: 'Taylor' }, { name: 'Abigail' }])
 *     .pipe(formatUsers)
 * // → 'Taylor, Abigail'
 *
 * @see {@link tap} - Execute callback but return collection unchanged
 * @see {@link pipeInto} - Pass collection to a class constructor
 * @see {@link pipeThrough} - Pass through multiple callbacks
 *
 * @category Transforming
 */
export const pipeMethod: MethodDefinition<'pipe'> = {
	name: 'pipe',
	chainable: false,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (collection: CoreCollection<T, CK>) => U,
	): U {
		return callback(this);
	},
};

/**
 * The `pipeInto` method creates a new instance of the given class and passes the
 * collection into the constructor. This is useful for wrapping the collection in
 * domain-specific objects or adapters.
 *
 * @param classConstructor - Class to instantiate with the collection
 * @returns New instance of the class
 *
 * @example
 * class Report {
 *     constructor(private data: Collection<number>) {}
 *     summary() { return { total: this.data.sum(), avg: this.data.avg() }; }
 * }
 * collect([10, 20, 30])
 *     .pipeInto(Report)
 *     .summary()
 * // → { total: 60, avg: 20 }
 *
 * @see {@link pipe} - Pass collection to a callback
 * @see {@link mapInto} - Create instances from each item
 *
 * @category Transforming
 */
export const pipeIntoMethod: MethodDefinition<'pipeInto'> = {
	name: 'pipeInto',
	chainable: false,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		classConstructor: new (collection: CoreCollection<T, CK>) => U,
	): U {
		return new classConstructor(this);
	},
};

/**
 * The `pipeThrough` method passes the collection through a series of callbacks and
 * returns the final result. Each callback receives the result of the previous callback,
 * creating a pipeline of transformations.
 *
 * @param callbacks - Array of functions to pipe through
 * @returns Final result after all callbacks
 *
 * @example
 * collect([1, 2, 3])
 *     .pipeThrough([
 *         c => c.sum(),      // 6
 *         n => n * 2,        // 12
 *         n => `Total: ${n}` // 'Total: 12'
 *     ])
 * // → 'Total: 12'
 *
 * @example For composable transformations:
 * const addTax = (c) => c.map(p => p * 1.1)
 * const round = (c) => c.map(p => Math.round(p))
 * collect([100, 200])
 *     .pipeThrough([addTax, round])
 *     .all()
 * // → [110, 220]
 *
 * @see {@link pipe} - Pass through a single callback
 *
 * @category Transforming
 */
export const pipeThroughMethod: MethodDefinition<'pipeThrough'> = {
	name: 'pipeThrough',
	chainable: false,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callbacks: Array<(value: unknown) => unknown>,
	): unknown {
		let result: unknown = this;
		for (const callback of callbacks) {
			result = callback(result);
		}
		return result;
	},
};

export default pipeMethod;
