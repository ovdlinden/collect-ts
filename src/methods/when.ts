/**
 * when/unless conditional methods - execute callbacks based on conditions.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `when` method executes the given callback when the first argument evaluates to true.
 * The collection instance and the resolved value are passed to the closure.
 * An optional second callback is executed when the condition is falsy.
 *
 * @param condition - Value or callback returning a value to test
 * @param callback - Callback to execute when condition is truthy
 * @param defaultCallback - Optional callback to execute when condition is falsy
 * @returns Result of executed callback, or the collection unchanged
 *
 * @example
 * collect([1, 2, 3])
 *     .when(true, c => c.map(n => n * 2))
 *     .all()
 * // → [2, 4, 6]
 *
 * @example You may pass a callback as the condition:
 * collect([1, 2, 3])
 *     .when(c => c.count() > 2, c => c.take(2))
 *     .all()
 * // → [1, 2]
 *
 * @example You may pass a default callback:
 * const filterActive = true
 * collect([
 *   { name: 'Desk', active: true },
 *   { name: 'Chair', active: false },
 * ])
 *   .when(
 *     filterActive,
 *     c => c.where('active', true),
 *     c => c
 *   )
 *   .all()
 * // → [{ name: 'Desk', active: true }]
 *
 * @see {@link unless} - Execute when condition is falsy
 * @see {@link whenEmpty} - Execute when collection is empty
 * @see {@link whenNotEmpty} - Execute when collection has items
 *
 * @category Transforming
 */
export const whenMethod: MethodDefinition<'when'> = {
	name: 'when',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		condition: boolean | ((collection: CoreCollection<T, CK>) => boolean),
		callback: (collection: CoreCollection<T, CK>, value: boolean) => U,
		defaultCallback?: (collection: CoreCollection<T, CK>, value: boolean) => U,
	): CoreCollection<T, CK> | U {
		const value = typeof condition === 'function' ? condition(this) : condition;

		if (value) {
			return callback(this, value);
		}

		if (defaultCallback) {
			return defaultCallback(this, value);
		}

		return this;
	},
};

/**
 * The `unless` method executes the given callback when the first argument evaluates to false.
 * This is the inverse of the `when` method. An optional second callback is executed when
 * the condition is truthy.
 *
 * @param condition - Value or callback returning a value to test
 * @param callback - Callback to execute when condition is falsy
 * @param defaultCallback - Optional callback to execute when condition is truthy
 * @returns Result of executed callback, or the collection unchanged
 *
 * @example To skip filtering for admins:
 * const isAdmin = false
 * collect([
 *   { title: 'Public Post', public: true },
 *   { title: 'Draft', public: false },
 * ])
 *   .unless(isAdmin, c => c.where('public', true))
 *   .all()
 * // → [{ title: 'Public Post', public: true }]
 *
 * @example You may pass a default callback:
 * const showAll = true
 * collect([
 *   { title: 'Published', published: true },
 *   { title: 'Draft', published: false },
 * ])
 *   .unless(
 *     showAll,
 *     c => c.where('published', true),
 *     c => c
 *   )
 *   .all()
 * // → both posts (showAll is true, so default runs)
 *
 * @see {@link when} - Execute when condition is truthy
 * @see {@link unlessEmpty} - Execute when collection is not empty
 * @see {@link unlessNotEmpty} - Execute when collection is empty
 *
 * @category Transforming
 */
export const unlessMethod: MethodDefinition<'unless'> = {
	name: 'unless',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		condition: boolean | ((collection: CoreCollection<T, CK>) => boolean),
		callback: (collection: CoreCollection<T, CK>, value: boolean) => U,
		defaultCallback?: (collection: CoreCollection<T, CK>, value: boolean) => U,
	): CoreCollection<T, CK> | U {
		const value = typeof condition === 'function' ? condition(this) : condition;

		if (!value) {
			return callback(this, value);
		}

		if (defaultCallback) {
			return defaultCallback(this, value);
		}

		return this;
	},
};

/**
 * The `whenEmpty` method executes the given callback when the collection is empty.
 * An optional second callback is executed when the collection is not empty.
 *
 * @param callback - Callback to execute when collection is empty
 * @param defaultCallback - Optional callback to execute when collection is not empty
 * @returns Result of executed callback, or the collection unchanged
 *
 * @example To provide defaults for an empty collection:
 * collect([])
 *     .whenEmpty(c => c.push('default'))
 *     .all()
 * // → ['default']
 *
 * @example To log empty state:
 * collect([])
 *   .whenEmpty(() => console.log('No results found'))
 * // logs: 'No results found'
 *
 * @see {@link whenNotEmpty} - Execute when collection has items
 * @see {@link when} - Execute on arbitrary condition
 * @see {@link isEmpty} - Check if collection is empty
 *
 * @category Transforming
 */
export const whenEmptyMethod: MethodDefinition<'whenEmpty'> = {
	name: 'whenEmpty',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (collection: CoreCollection<T, CK>) => U,
		defaultCallback?: (collection: CoreCollection<T, CK>) => U,
	): CoreCollection<T, CK> | U {
		// Delegate to when with isEmpty() check
		const isEmpty = this.count() === 0;

		if (isEmpty) {
			return callback(this);
		}

		if (defaultCallback) {
			return defaultCallback(this);
		}

		return this;
	},
};

/**
 * The `whenNotEmpty` method executes the given callback when the collection is not empty.
 * An optional second callback is executed when the collection is empty.
 *
 * @param callback - Callback to execute when collection has items
 * @param defaultCallback - Optional callback to execute when collection is empty
 * @returns Result of executed callback, or the collection unchanged
 *
 * @example To process only if items exist:
 * collect([
 *   { id: 1, total: 100 },
 *   { id: 2, total: 200 },
 * ])
 *   .whenNotEmpty(c => c.pluck('total'))
 *   .all()
 * // → [100, 200]
 *
 * @example You may pass an empty fallback:
 * collect([{ name: 'Taylor' }])
 *   .whenNotEmpty(
 *     c => c.first(),
 *     () => 'No results'
 *   )
 * // → { name: 'Taylor' }
 *
 * @see {@link whenEmpty} - Execute when collection is empty
 * @see {@link unlessEmpty} - Alias for whenNotEmpty
 * @see {@link isNotEmpty} - Check if collection has items
 *
 * @category Transforming
 */
export const whenNotEmptyMethod: MethodDefinition<'whenNotEmpty'> = {
	name: 'whenNotEmpty',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (collection: CoreCollection<T, CK>) => U,
		defaultCallback?: (collection: CoreCollection<T, CK>) => U,
	): CoreCollection<T, CK> | U {
		const isNotEmpty = this.count() > 0;

		if (isNotEmpty) {
			return callback(this);
		}

		if (defaultCallback) {
			return defaultCallback(this);
		}

		return this;
	},
};

/**
 * The `unlessEmpty` method executes the given callback when the collection is not empty.
 * This is an alias for {@link whenNotEmpty}.
 *
 * @param callback - Callback to execute when collection has items
 * @param defaultCallback - Optional callback to execute when collection is empty
 * @returns Result of executed callback, or the collection unchanged
 *
 * @example
 * collect([1, 2, 3])
 *     .unlessEmpty(c => c.map(n => n * 2))
 *     .all()
 * // → [2, 4, 6]
 *
 * @example With empty collection (callback not executed):
 * collect([])
 *     .unlessEmpty(c => c.push('item'))
 *     .all()
 * // → []
 *
 * @see {@link whenNotEmpty} - Canonical method
 * @see {@link unlessNotEmpty} - Execute when collection IS empty
 *
 * @category Transforming
 */
export const unlessEmptyMethod: MethodDefinition<'unlessEmpty'> = {
	name: 'unlessEmpty',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (collection: CoreCollection<T, CK>) => U,
		defaultCallback?: (collection: CoreCollection<T, CK>) => U,
	): CoreCollection<T, CK> | U {
		return whenNotEmptyMethod.fn.call(this, callback, defaultCallback);
	},
};

/**
 * The `unlessNotEmpty` method executes the given callback when the collection is empty.
 * This is an alias for {@link whenEmpty}.
 *
 * @param callback - Callback to execute when collection is empty
 * @param defaultCallback - Optional callback to execute when collection has items
 * @returns Result of executed callback, or the collection unchanged
 *
 * @example To provide a default value for empty results:
 * collect([])
 *     .unlessNotEmpty(() => collect(['No data']))
 *     .all()
 * // → ['No data']
 *
 * @example With non-empty collection (callback not executed):
 * collect([1, 2, 3])
 *     .unlessNotEmpty(() => collect(['default']))
 *     .all()
 * // → [1, 2, 3]
 *
 * @see {@link whenEmpty} - Canonical method
 * @see {@link unlessEmpty} - Execute when collection is NOT empty
 *
 * @category Transforming
 */
export const unlessNotEmptyMethod: MethodDefinition<'unlessNotEmpty'> = {
	name: 'unlessNotEmpty',
	chainable: true,
	fn<T, U, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (collection: CoreCollection<T, CK>) => U,
		defaultCallback?: (collection: CoreCollection<T, CK>) => U,
	): CoreCollection<T, CK> | U {
		return whenEmptyMethod.fn.call(this, callback, defaultCallback);
	},
};

export default whenMethod;
