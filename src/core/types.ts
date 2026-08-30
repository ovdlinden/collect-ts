/**
 * Core type definitions for Collection.
 * These types are used throughout the library and exported for user consumption.
 */

/** Brand symbol for identifying collection-like objects */
export const COLLECTION_BRAND = Symbol.for('collect-ts.collection');

/** Collection kind - tracks whether collection is array-based or associative at the type level */
export type CollectionKind = 'array' | 'assoc';

/** Key type based on collection kind - arrays use numeric indices, associative uses string keys */
export type CollectionKey<CK extends CollectionKind> = CK extends 'array' ? number : string;

/** Operator types for where clauses (Laravel uses loose comparison; use whereStrict() for strict) */
export type WhereOperator = '=' | '==' | '!=' | '<>' | '<' | '>' | '<=' | '>=';

/** Value retriever - can be a key string or callback function */
export type ValueRetriever<T, R> = string | ((value: T, key: string | number) => R);

/**
 * Minimal interface for collection-like objects that support HOM proxy.
 * Uses structural branding for identification.
 */
export interface CollectionLike<T> {
	readonly [COLLECTION_BRAND]: true;
	all(): T[] | Record<string, T>;
	toArray(): T[] | Record<string, T>;
}

/**
 * Minimal interface for collection parameters.
 * Only includes methods actually called on input collections.
 * Enables duck typing for interoperability with custom implementations.
 */
export interface CollectionParam<T = unknown> {
	all(): T[] | Record<string, T>;
	toArray(): T[];
}

/**
 * Any array-like input: arrays, iterables, collections, or duck-typed collection objects.
 * Mirrors Laravel's Arrayable contract for flexible input handling.
 */
export type Arrayable<T> = T[] | readonly T[] | Iterable<T> | CollectionParam<T>;

/**
 * Any collection-compatible input including associative objects.
 * Use for methods that accept both arrays and key-value objects.
 */
export type Collectable<T> = Arrayable<T> | Record<string, T>;

/** Input types for creating a collection */
export type CollectInput<T> = T[] | Record<string, T> | Iterable<T> | (() => Generator<T>);

/**
 * Depth decrement helper for recursive path types.
 * Supports up to 6 levels of nesting (e.g., 'a.b.c.d.e.f').
 * Beyond 6 levels, use callback notation instead of dot-path.
 */
type PathDepth = [never, 0, 1, 2, 3, 4, 5, 6];

/**
 * All valid dot-notation paths through an object type.
 * Enables type-safe property access with full autocomplete.
 *
 * @example
 * type User = { name: string; address: { city: string } };
 * type UserPaths = Path<User>; // 'name' | 'address' | 'address.city'
 */
export type Path<T, MaxDepth extends number = 6> = [MaxDepth] extends [0]
	? never
	: T extends object
		? {
				[K in keyof T & string]: T[K] extends object ? K | `${K}.${Path<T[K], PathDepth[MaxDepth]>}` : K;
			}[keyof T & string]
		: never;

/**
 * Get the type at a given dot-notation path.
 *
 * @example
 * type User = { name: string; address: { city: string } };
 * type City = PathValue<User, 'address.city'>; // string
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
	? K extends keyof T
		? PathValue<T[K], Rest>
		: never
	: P extends keyof T
		? T[P]
		: never;

/** Unwrap one level of array or Collection nesting. Returns T unchanged if not nested. */
export type Collapse<T> = T extends readonly (infer U)[] ? U : T;

/** Recursive flatten to depth D. Same pattern as lib.es2019.array.d.ts FlatArray. */
export type FlattenDepth<T, D extends number> = {
	done: T;
	recur: T extends readonly (infer U)[]
		? FlattenDepth<U, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][D]>
		: T;
}[D extends -1 ? 'done' : 'recur'];

/** Type guard for collection-like objects */
export function isCollection(value: unknown): value is CollectionLike<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		COLLECTION_BRAND in value &&
		(value as Record<symbol, unknown>)[COLLECTION_BRAND] === true
	);
}

/** Check if value is a plain object (not an array, null, etc.) */
export function isPlainObject<T>(value: unknown): value is Record<string, T> {
	if (value === null || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === null || proto === Object.prototype;
}
