/**
 * Laravel Collection for TypeScript
 *
 * A fully-typed TypeScript port of Laravel's Collection class,
 * auto-synced with the official Laravel framework.
 *
 * @example
 * ```ts
 * import { collect } from 'laravel-collection-ts';
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
export const VERSION = '1.0.0' as const;

/** Laravel Collection version this package implements */
export const LARAVEL_COLLECTION_VERSION = '12.43' as const;

// Core Collection class
export { collect, Collection, collectState, toArray, WithCollection } from './Collection.js';
export type {
	CollectedState,
	CollectionKind,
	CollectionParam,
	ProxiedCollection,
	ValueRetriever,
	WhereOperator,
} from './Collection.js';

// Exceptions
export {
	InvalidArgumentException,
	ItemNotFoundException,
	MultipleItemsFoundException,
	UnexpectedValueException,
} from './exceptions/index.js';

// Traits (for extension)
export { Conditionable, Pipeable, Tappable } from './traits/index.js';

// Lazy Collections
export { lazy, LazyCollection } from './LazyCollection.js';
export type { ProxiedLazyCollection } from './LazyCollection.js';
