/**
 * Laravel Collection for TypeScript
 *
 * A fully-typed TypeScript port of Laravel's Collection class,
 * auto-synced with the official Laravel framework.
 *
 * @example
 * ```ts
 * import { collect } from 'collect-ts';
 *
 * const result = collect([1, 2, 3, 4, 5])
 *   .filter(n => n > 2)
 *   .map(n => n * 2)
 *   .sum();
 * // => 24
 * ```
 *
 * @see https://laravel.com/docs/collections
 */

/** Package version (semver) */
export const VERSION = '0.4.0' as const;

/** Laravel Collection version this package implements */
export const LARAVEL_COLLECTION_VERSION = '0.4.0' as const;

export type {
	Arrayable,
	Collapse,
	Collectable,
	CollectedState,
	CollectionKey,
	CollectionKind,
	CollectionMacros,
	CollectionParam,
	FlattenDepth,
	Path,
	PathValue,
	ProxiedCollection,
	ValueRetriever,
	WhereOperator,
} from './Collection.js';
// Core Collection class
export { Collection, collect, collectState, toArray, WithCollection } from './Collection.js';

// Exceptions
export {
	InvalidArgumentException,
	ItemNotFoundException,
	MultipleItemsFoundException,
	UnexpectedValueException,
} from './exceptions/index.js';
export type { ProxiedLazyCollection } from './LazyCollection.js';

// Lazy Collections
export { LazyCollection, lazy } from './LazyCollection.js';
// Traits (for extension)
export { Conditionable, Pipeable, Tappable } from './traits/index.js';
