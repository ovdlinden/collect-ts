/**
 * Collection - Laravel-style collection class
 *
 * A fluent wrapper for arrays and objects with chainable methods.
 * Based on Laravel 12's Illuminate\Support\Collection.
 *
 * This class implements ~105 methods that mirror Laravel's Collection class:
 * - Core: all, get, first, last, keys, values
 * - Transformation: map, filter, collapse, flatten, flip, chunk, chunkWhile, split, splitIn, slice, reverse, shuffle, pad, zip
 * - Comparison: contains, containsStrict, doesntContain, diff, diffKeys, diffAssoc, intersect, intersectByKeys, duplicates, duplicatesStrict
 * - Aggregation: median, mode, count, countBy, sum, avg, min, max
 * - Array building: merge, union, combine, crossJoin, concat
 * - Item modification: put, pull, push, prepend, pop, shift, add, forget
 * - Selection: except, only, has, hasAny
 * - Grouping: groupBy, keyBy
 * - Searching: search, before, after
 * - Sorting: sort, sortDesc, sortBy, sortByDesc, sortKeys, sortKeysDesc, sortKeysUsing
 * - Slicing: skip, skipUntil, skipWhile, take, takeUntil, takeWhile
 * - String: implode, join, toString
 * - Validation: isEmpty, containsOneItem, sole, firstOrFail
 * - Advanced: pluck, mapWithKeys, transform, nth, random, sliding
 *
 * @example
 * ```ts
 * // Count votes for an option
 * collect(state.votes).filter(v => v === 'Pizza').count()
 *
 * // Get all voter IDs for an option
 * collect(state.votes).filter(v => v === 'Pizza').keys().all()
 *
 * // Extract form fields by prefix
 * collect(values)
 *   .filter((v, k) => k.startsWith('option'))
 *   .values()
 *   .filter(v => v.trim() !== '')
 *   .all()
 * ```
 */

import {
	InvalidArgumentException,
	ItemNotFoundException,
	MultipleItemsFoundException,
	UnexpectedValueException,
} from './exceptions';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Items<T> = Record<string, T> | T[];

/** Collection kind - tracks whether collection is array-based or associative at the type level */
export type CollectionKind = 'array' | 'assoc';

/**
 * Minimal interface for collection parameters.
 * Only includes methods actually called on input collections.
 * Enables duck typing for interoperability with custom implementations.
 */
export interface CollectionParam<T = unknown> {
	all(): T[] | Record<string, T>;
	toArray(): T[];
}

/** Operator types for where clauses (Laravel uses loose comparison; use whereStrict() for strict) */
export type WhereOperator = '=' | '==' | '!=' | '<>' | '<' | '>' | '<=' | '>=';

/** Value retriever - can be a key string or callback function */
export type ValueRetriever<T, R> = string | ((value: T, key: string) => R);

// ═══════════════════════════════════════════════════════════════════════════
// HIGHER-ORDER PROXY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Extract the non-nullable part of T for property access */
type NonNullableItem<T> = T extends null | undefined ? never : T;

/** Extract non-function property keys from T, handling nullable types */
type PropertyKeys<T> = NonNullableItem<T> extends never
	? never
	: {
			// biome-ignore lint/suspicious/noExplicitAny: Required for TypeScript conditional type matching any function signature
			[K in keyof NonNullableItem<T>]: NonNullableItem<T>[K] extends (...args: any[]) => any ? never : K;
		}[keyof NonNullableItem<T>];

/** Extract function/method keys from T, handling nullable types */
type MethodKeys<T> = NonNullableItem<T> extends never
	? never
	: {
			// biome-ignore lint/suspicious/noExplicitAny: Required for TypeScript conditional type matching any function signature
			[K in keyof NonNullableItem<T>]: NonNullableItem<T>[K] extends (...args: any[]) => any ? K : never;
		}[keyof NonNullableItem<T>];

/**
 * Higher-order map proxy type.
 * Property access returns ProxiedCollection<T[K]>, method calls return (...args) => ProxiedCollection<ReturnType>
 * Preserves the collection kind CK.
 * Uses NonNullableItem<T> to handle nullable union types in collections.
 */
type HigherOrderMapProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: ProxiedCollection<NonNullableItem<T>[K], CK>;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => infer R
		? (...args: A) => ProxiedCollection<R, CK>
		: never;
};

/**
 * Higher-order filter/reject/sortBy proxy type.
 * Always returns ProxiedCollection<T> (filtered/sorted items), preserving kind CK.
 */
type HigherOrderFilterProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: ProxiedCollection<T, CK>;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => ProxiedCollection<T, CK>
		: never;
};

/**
 * Higher-order aggregate proxy type (sum, avg, min, max).
 * Returns the aggregate result type R.
 * Uses PropertyKeys to only map non-function properties.
 */
type HigherOrderAggregateProxy<T, R> = {
	readonly [K in PropertyKeys<T>]: R;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => R
		: never;
};

/**
 * Higher-order each proxy type.
 * Method calls execute on each item, returns ProxiedCollection<T> for chaining, preserving kind CK.
 */
type HigherOrderEachProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: ProxiedCollection<T, CK>;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => ProxiedCollection<T, CK>
		: never;
};

// ═══════════════════════════════════════════════════════════════════════════
// CALLABLE HIGHER-ORDER TYPES (for exact Laravel syntax)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Callable higher-order map type with explicit generic call/apply/bind.
 * Used for: map, groupBy, flatMap
 * Preserves the generic U type parameter through .call(), .apply(), .bind()
 */
type CallableHigherOrderMap<T, CK extends CollectionKind> = (<U>(
	callback: (value: T, key: string) => U,
) => ProxiedCollection<U, CK>) & {
	call<U>(thisArg: unknown, callback: (value: T, key: string) => U): ProxiedCollection<U, CK>;
	apply<U>(thisArg: unknown, args: [(value: T, key: string) => U]): ProxiedCollection<U, CK>;
	bind(thisArg: unknown): <U>(callback: (value: T, key: string) => U) => ProxiedCollection<U, CK>;
} & ([T] extends [never] ? object : HigherOrderMapProxy<T, CK>);

/**
 * Callable higher-order filter type with explicit call/apply/bind.
 * Used for: filter, reject, sortBy, sortByDesc, keyBy, unique
 * Returns ProxiedCollection<T> (filtered items of same type)
 */
type CallableHigherOrderFilter<T, CK extends CollectionKind> = ((
	callback?: ((value: T, key: string) => unknown) | keyof T,
) => ProxiedCollection<T, CK>) & {
	call(thisArg: unknown, callback?: ((value: T, key: string) => unknown) | keyof T): ProxiedCollection<T, CK>;
	apply(thisArg: unknown, args: [((value: T, key: string) => unknown) | keyof T] | []): ProxiedCollection<T, CK>;
	bind(thisArg: unknown): (callback?: ((value: T, key: string) => unknown) | keyof T) => ProxiedCollection<T, CK>;
} & ([T] extends [never] ? object : HigherOrderFilterProxy<T, CK>);

/**
 * Callable higher-order aggregate type with explicit call/apply/bind.
 * Used for: sum, avg, min, max, contains, every, some, doesntContain
 * Returns the aggregate result type R (number, boolean, etc.)
 */
type CallableHigherOrderAggregate<T, R> = ((keyOrCallback?: ((value: T, key: string) => unknown) | keyof T) => R) & {
	call(thisArg: unknown, keyOrCallback?: ((value: T, key: string) => unknown) | keyof T): R;
	apply(thisArg: unknown, args: [((value: T, key: string) => unknown) | keyof T] | []): R;
	bind(thisArg: unknown): (keyOrCallback?: ((value: T, key: string) => unknown) | keyof T) => R;
} & ([T] extends [never] ? object : HigherOrderAggregateProxy<T, R>);

/**
 * Callable higher-order each type with explicit call/apply/bind.
 * Used for: each
 * Returns ProxiedCollection<T> for chaining
 */
type CallableHigherOrderEach<T, CK extends CollectionKind> = ((
	callback: (value: T, key: string) => undefined | false,
) => ProxiedCollection<T, CK>) & {
	call(thisArg: unknown, callback: (value: T, key: string) => undefined | false): ProxiedCollection<T, CK>;
	apply(thisArg: unknown, args: [(value: T, key: string) => undefined | false]): ProxiedCollection<T, CK>;
	bind(thisArg: unknown): (callback: (value: T, key: string) => undefined | false) => ProxiedCollection<T, CK>;
} & ([T] extends [never] ? object : HigherOrderEachProxy<T, CK>);

/**
 * Higher-order proxy for first/last - returns T | undefined, not a collection.
 * Property access like `users.first.active` returns the first user where active is truthy.
 */
type HigherOrderFirstProxy<T> = {
	readonly [K in PropertyKeys<T>]: T | undefined;
};

/**
 * Callable higher-order first/last type with explicit call/apply/bind.
 * Used for: first, last
 * Returns T | undefined (single item), not a collection
 */
type CallableHigherOrderFirst<T> = ((
	callback?: ((value: T, key: string) => unknown) | keyof T,
	defaultValue?: T,
) => T | undefined) & {
	call(thisArg: unknown, callback?: ((value: T, key: string) => unknown) | keyof T, defaultValue?: T): T | undefined;
	apply(thisArg: unknown, args: [((value: T, key: string) => unknown) | keyof T, T?] | []): T | undefined;
	bind(
		thisArg: unknown,
	): (callback?: ((value: T, key: string) => unknown) | keyof T, defaultValue?: T) => T | undefined;
} & ([T] extends [never] ? object : HigherOrderFirstProxy<T>);

/**
 * Higher-order partition proxy type.
 * Returns tuple of [matching, non-matching] ProxiedCollections, preserving kind CK.
 */
type HigherOrderPartitionProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>]
		: never;
};

/**
 * Callable higher-order partition type with explicit call/apply/bind.
 * Used for: partition
 * Returns tuple of [matching, non-matching] ProxiedCollections
 */
type CallableHigherOrderPartition<T, CK extends CollectionKind> = ((
	callback: ((value: T, key: string) => unknown) | keyof T,
) => [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>]) & {
	call(
		thisArg: unknown,
		callback: ((value: T, key: string) => unknown) | keyof T,
	): [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
	apply(
		thisArg: unknown,
		args: [((value: T, key: string) => unknown) | keyof T],
	): [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
	bind(
		thisArg: unknown,
	): (callback: ((value: T, key: string) => unknown) | keyof T) => [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
} & ([T] extends [never] ? object : HigherOrderPartitionProxy<T, CK>);

/**
 * Collection type with higher-order messaging support.
 * Methods like `map`, `filter`, etc. work as BOTH callable methods AND property accessors.
 * CK tracks whether collection is array-based or associative for proper `all()` return type.
 *
 * @example
 * ```ts
 * users.map(u => u.name)    // Traditional callback usage
 * users.map.name            // Higher-order messaging
 * users.filter.active       // Higher-order filter
 * users.sum.age             // Higher-order aggregate
 * ```
 */
export type ProxiedCollection<T, CK extends CollectionKind = 'array'> = Collection<T, CK> &
	CollectionParam<T> & {
		/** Map with higher-order support: users.map(fn) OR users.map.name */
		map: CallableHigherOrderMap<T, CK>;
		/** Filter with higher-order support: users.filter(fn) OR users.filter.active */
		filter: CallableHigherOrderFilter<T, CK>;
		/** Reject with higher-order support: users.reject(fn) OR users.reject.deleted */
		reject: CallableHigherOrderFilter<T, CK>;
		/** Each with higher-order support: users.each(fn) OR users.each.save() */
		each: CallableHigherOrderEach<T, CK>;
		/** Sum with higher-order support: users.sum(fn) OR users.sum.age */
		sum: CallableHigherOrderAggregate<T, number>;
		/** Avg with higher-order support: users.avg(fn) OR users.avg.score */
		avg: CallableHigherOrderAggregate<T, number | null>;
		/** Min with higher-order support: users.min(fn) OR users.min.age */
		min: CallableHigherOrderAggregate<T, number | null>;
		/** Max with higher-order support: users.max(fn) OR users.max.age */
		max: CallableHigherOrderAggregate<T, number | null>;
		/** SortBy with higher-order support: users.sortBy(fn) OR users.sortBy.name */
		sortBy: CallableHigherOrderFilter<T, CK>;
		/** SortByDesc with higher-order support: users.sortByDesc(fn) OR users.sortByDesc.name */
		sortByDesc: CallableHigherOrderFilter<T, CK>;
		/** GroupBy with higher-order support: users.groupBy(fn) OR users.groupBy.status */
		groupBy: CallableHigherOrderMap<T, CK>;
		/** KeyBy with higher-order support: users.keyBy(fn) OR users.keyBy.id */
		keyBy: CallableHigherOrderFilter<T, CK>;
		/** Unique with higher-order support: users.unique(fn) OR users.unique.email */
		unique: CallableHigherOrderFilter<T, CK>;
		/** FlatMap with higher-order support: users.flatMap(fn) OR users.flatMap.tags */
		flatMap: CallableHigherOrderMap<T, CK>;
		/** Contains with higher-order support: users.contains(fn) OR users.contains.active */
		contains: CallableHigherOrderAggregate<T, boolean>;
		/** Every with higher-order support: users.every(fn) OR users.every.valid */
		every: CallableHigherOrderAggregate<T, boolean>;
		/** Some with higher-order support (alias for contains) */
		some: CallableHigherOrderAggregate<T, boolean>;
		/** DoesntContain with higher-order support */
		doesntContain: CallableHigherOrderAggregate<T, boolean>;
		/** Partition with higher-order support - returns [matching, nonMatching] tuple */
		partition: CallableHigherOrderPartition<T, CK>;
		/** First with higher-order support - returns T | undefined */
		first: CallableHigherOrderFirst<T>;
		/** Last with higher-order support - returns T | undefined */
		last: CallableHigherOrderFirst<T>;
		/** TakeWhile with higher-order support */
		takeWhile: CallableHigherOrderFilter<T, CK>;
		/** TakeUntil with higher-order support */
		takeUntil: CallableHigherOrderFilter<T, CK>;
		/** SkipWhile with higher-order support */
		skipWhile: CallableHigherOrderFilter<T, CK>;
		/** SkipUntil with higher-order support */
		skipUntil: CallableHigherOrderFilter<T, CK>;
		/** Average with higher-order support (alias for avg) */
		average: CallableHigherOrderAggregate<T, number | null>;
	};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Get a value from an object by dot notation key */
function dataGet(target: unknown, key: string | null): unknown {
	if (key === null) return target;
	if (typeof target !== 'object' || target === null) return undefined;
	const obj = target as Record<string, unknown>;
	if (key in obj) return obj[key];
	// Support dot notation
	const parts = key.split('.');
	let value: unknown = target;
	for (const part of parts) {
		if (typeof value !== 'object' || value === null) return undefined;
		value = (value as Record<string, unknown>)[part];
	}
	return value;
}

/** Check if a value is callable (function) but not a string */
function useAsCallable(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === 'function';
}

/** Get a value retriever function from a key or callback */
function valueRetriever<T, R>(keyOrCallback: ValueRetriever<T, R> | null | undefined): (value: T, key: string) => R {
	if (keyOrCallback === null || keyOrCallback === undefined) {
		return (value: T) => value as unknown as R;
	}
	if (useAsCallable(keyOrCallback)) {
		return keyOrCallback as (value: T, key: string) => R;
	}
	return (value: T) => dataGet(value, keyOrCallback as string) as R;
}

/** Create an operator checker for where clauses */
function operatorForWhere<T>(
	key: string | ((value: T, key: string) => boolean),
	operator?: WhereOperator | unknown,
	value?: unknown,
): (value: T, key: string) => boolean {
	if (useAsCallable(key)) {
		return key as (value: T, key: string) => boolean;
	}

	// Normalize arguments: where('key', 'value') -> where('key', '=', 'value')
	let op: WhereOperator = '=';
	let compareValue: unknown = operator;

	if (value !== undefined) {
		op = operator as WhereOperator;
		compareValue = value;
	}

	return (item: T) => {
		const retrieved = dataGet(item, key as string);

		switch (op) {
			case '=':
			case '==':
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel where() uses loose comparison by design. Use whereStrict() for strict comparison.
				return retrieved == compareValue;
			case '!=':
			case '<>':
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel where() uses loose comparison by design. Use whereStrict() for strict comparison.
				return retrieved != compareValue;
			case '<':
				return (retrieved as number) < (compareValue as number);
			case '>':
				return (retrieved as number) > (compareValue as number);
			case '<=':
				return (retrieved as number) <= (compareValue as number);
			case '>=':
				return (retrieved as number) >= (compareValue as number);
			default:
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel where() uses loose comparison by design. Use whereStrict() for strict comparison.
				return retrieved == compareValue;
		}
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGHER-ORDER COLLECTION PROXY
// ═══════════════════════════════════════════════════════════════════════════

/** Handler type for higher-order proxy dispatch table */
type HigherOrderHandler<T> = (collection: Collection<T, CollectionKind>, callback: (item: T) => unknown) => unknown;

/**
 * Methods that support higher-order messaging (Laravel's $proxies list)
 */
type ProxyableMethod =
	| 'average'
	| 'avg'
	| 'contains'
	| 'doesntContain'
	| 'each'
	| 'every'
	| 'filter'
	| 'first'
	| 'flatMap'
	| 'groupBy'
	| 'keyBy'
	| 'last'
	| 'map'
	| 'max'
	| 'min'
	| 'partition'
	| 'reject'
	| 'skipUntil'
	| 'skipWhile'
	| 'some'
	| 'sortBy'
	| 'sortByDesc'
	| 'sum'
	| 'takeUntil'
	| 'takeWhile'
	| 'unique';

const PROXYABLE_METHODS = new Set<ProxyableMethod>([
	'average',
	'avg',
	'contains',
	'doesntContain',
	'each',
	'every',
	'filter',
	'first',
	'flatMap',
	'groupBy',
	'keyBy',
	'last',
	'map',
	'max',
	'min',
	'partition',
	'reject',
	'skipUntil',
	'skipWhile',
	'some',
	'sortBy',
	'sortByDesc',
	'sum',
	'takeUntil',
	'takeWhile',
	'unique',
]);

/**
 * Properties to bypass in the proxy (to avoid breaking Promise detection, etc.)
 */
const BYPASS_PROPERTIES = new Set<string | symbol>([
	// Promise detection (critical for async/await)
	'then',
	'catch',
	'finally',
	// Object prototype
	'constructor',
	'prototype',
	'toJSON',
	// Node.js inspection
	'inspect',
	'nodeType',
	// Common internal properties
	'asymmetricMatch',
	'$$typeof',
]);

/**
 * Higher-order collection proxy - Full Laravel compatibility.
 *
 * Supports BOTH patterns:
 * - Property access: users.map.name     → extracts 'name' property from each item
 * - Method calls:    users.each.save()  → calls save() on each item
 *
 * @example
 * ```ts
 * // Property access
 * users.map.name           // Collection<string>
 * users.filter.active      // Collection<User>
 * users.sum.age            // number
 *
 * // Method calls
 * users.each.save()        // Calls save() on each user
 * users.each.notify('Hi')  // Calls notify('Hi') on each user
 * ```
 */
// biome-ignore lint/complexity/noStaticOnlyClass: This class uses static methods to create typed proxies; converting to standalone functions would lose the clear namespace organization
class HigherOrderCollectionProxy {
	/**
	 * Method dispatch table - maps method names to their handlers.
	 * Organized by category for clarity.
	 */
	private static createHandlers<T>(): Record<string, HigherOrderHandler<T>> {
		return {
			// Transformation methods
			map: (c, cb) => c.map(cb),
			flatMap: (c, cb) => c.flatMap(cb as (item: T) => unknown[]),

			// Filter methods
			filter: (c, cb) => c.filter((item) => Boolean(cb(item))),
			reject: (c, cb) => c.reject((item) => Boolean(cb(item))),

			// Sorting methods
			sortBy: (c, cb) => c.sortBy(cb as ValueRetriever<T, unknown>),
			sortByDesc: (c, cb) => c.sortByDesc(cb as ValueRetriever<T, unknown>),

			// Grouping methods
			groupBy: (c, cb) => c.groupBy(cb as ValueRetriever<T, string | string[]>),
			keyBy: (c, cb) => c.keyBy(cb as ValueRetriever<T, string>),
			unique: (c, cb) => c.unique(cb as ValueRetriever<T, unknown>),

			// Aggregation methods
			sum: (c, cb) => c.sum(cb as ValueRetriever<T, number>),
			avg: (c, cb) => c.avg(cb as ValueRetriever<T, number>),
			average: (c, cb) => c.avg(cb as ValueRetriever<T, number>),
			min: (c, cb) => c.min(cb as ValueRetriever<T, number>),
			max: (c, cb) => c.max(cb as ValueRetriever<T, number>),

			// Boolean methods
			contains: (c, cb) => c.contains((item) => Boolean(cb(item))),
			some: (c, cb) => c.contains((item) => Boolean(cb(item))),
			every: (c, cb) => c.every((item) => Boolean(cb(item))),
			doesntContain: (c, cb) => !c.contains((item) => Boolean(cb(item))),

			// Side-effect methods
			each: (c, cb) => {
				c.each(cb);
				return c;
			},

			// Selection methods
			first: (c, cb) => c.first((item) => Boolean(cb(item))),
			last: (c, cb) => c.last((item) => Boolean(cb(item))),

			// Partition
			partition: (c, cb) => c.partition((item) => Boolean(cb(item))),

			// Slicing methods
			skipUntil: (c, cb) => c.skipUntil((item) => Boolean(cb(item))),
			skipWhile: (c, cb) => c.skipWhile((item) => Boolean(cb(item))),
			takeUntil: (c, cb) => c.takeUntil((item) => Boolean(cb(item))),
			takeWhile: (c, cb) => c.takeWhile((item) => Boolean(cb(item))),
		};
	}

	/**
	 * Create a typed proxy for higher-order messaging.
	 *
	 * The returned proxy supports BOTH:
	 * 1. Property access: users.map.name → Collection<string>
	 * 2. Method calls: users.each.save() → calls save() on each item
	 *
	 * @param wrapResult - Function to wrap Collection results for further chaining
	 */
	static create<T, TReturn>(
		collection: Collection<T, CollectionKind>,
		method: ProxyableMethod,
		wrapResult?: (c: Collection<unknown, CollectionKind>) => unknown,
	): TReturn {
		const handlers = HigherOrderCollectionProxy.createHandlers<T>();
		const handler = handlers[method];

		// Use an object as the proxy target (the Proxy traps handle all operations)
		const proxyTarget = {} as object;

		return new Proxy(proxyTarget, {
			get: (_, property: string | symbol) => {
				// Note: Symbol access is filtered by wrapCollectionWithProxy before reaching here
				// (see line 628), so we only handle string properties

				// Bypass special properties
				if (typeof property === 'symbol' || BYPASS_PROPERTIES.has(property)) {
					return undefined;
				}

				// Create callback for property extraction (handles null/undefined gracefully)
				const propertyCallback = (item: T) => {
					if (item == null) return undefined;
					return (item as Record<string, unknown>)[property];
				};

				// Execute immediately for property access (Laravel behavior)
				const propertyResult = handler(collection, propertyCallback);

				// For primitive results (number, boolean, string, null, undefined),
				// return the value directly - no proxy needed
				// This matches Laravel's behavior where $collection->sum->age returns a number
				if (
					propertyResult === null ||
					propertyResult === undefined ||
					typeof propertyResult === 'number' ||
					typeof propertyResult === 'boolean' ||
					typeof propertyResult === 'string'
				) {
					return propertyResult;
				}

				// For Collection results, wrap for chaining if wrapper provided
				const wrappedResult =
					propertyResult instanceof Collection && wrapResult ? wrapResult(propertyResult) : propertyResult;

				// Create a callable function for method invocation support
				const methodInvoker = (...args: unknown[]) => {
					const methodResult = handler(collection, (item: T) => {
						if (item == null) return undefined;
						const member = (item as Record<string, unknown>)[property];
						if (typeof member === 'function') {
							return (member as (...a: unknown[]) => unknown).apply(item, args);
						}
						return member;
					});
					// Wrap Collection results for chaining
					if (methodResult instanceof Collection && wrapResult) {
						return wrapResult(methodResult);
					}
					return methodResult;
				};

				// Return a Proxy that acts as BOTH the result AND a callable
				return new Proxy(methodInvoker, {
					// Forward property/method access to the wrapped result
					get: (_, resultProp: string | symbol) => {
						// Handle special coercion methods
						if (resultProp === Symbol.toPrimitive) {
							return () => wrappedResult;
						}
						if (resultProp === 'valueOf') {
							return () => wrappedResult;
						}
						if (resultProp === 'toString') {
							return () => String(wrappedResult);
						}
						// Bypass symbols
						if (typeof resultProp === 'symbol') {
							return (wrappedResult as Record<symbol, unknown>)?.[resultProp];
						}
						// Forward to the wrapped result (e.g., .all(), .count(), .first(), .map.name)
						// Don't use bind() as it would break Proxy interception for chained higher-order calls
						return (wrappedResult as Record<string, unknown>)?.[resultProp];
					},

					// Handle method calls: users.each.save()
					apply: (target, _, args) => {
						return target(...args);
					},

					// Make instanceof checks work with the result type
					// Note: wrappedResult is guaranteed non-null (primitives return early at lines 501-509)
					getPrototypeOf: () => {
						return Object.getPrototypeOf(wrappedResult);
					},

					// Support 'in' operator
					has: (_, prop) => {
						return prop in (wrappedResult as object);
					},
				});
			},
		}) as TReturn;
	}
}

/**
 * Wraps a Collection in a Proxy to enable exact Laravel syntax for higher-order messaging.
 *
 * This allows accessing proxyable methods (map, filter, etc.) as BOTH:
 * - Callable methods: users.map(callback)
 * - Property accessors: users.map.name
 *
 * @internal
 */
function wrapCollectionWithProxy<T, CK extends CollectionKind>(
	collection: Collection<T, CK>,
): ProxiedCollection<T, CK> {
	return new Proxy(collection, {
		get(target, prop: string | symbol, receiver) {
			// Bypass symbols and special properties
			if (typeof prop === 'symbol' || BYPASS_PROPERTIES.has(prop)) {
				return Reflect.get(target, prop, receiver);
			}

			// Get the actual property/method from the collection
			const value = Reflect.get(target, prop, receiver);

			// If it's not a proxyable method, return the value directly
			if (!PROXYABLE_METHODS.has(prop as ProxyableMethod)) {
				return value;
			}

			// It's a proxyable method - create a callable that also supports property access
			// Note: All proxyable methods are functions (guaranteed by PROXYABLE_METHODS being method names)

			// Create the higher-order proxy for property access
			// Pass the wrapper function so Collection results are wrapped for chaining
			const higherOrderProxy = HigherOrderCollectionProxy.create<T, Record<string, unknown>>(
				target,
				prop as ProxyableMethod,
				(c) => wrapCollectionWithProxy(c as Collection<unknown, CollectionKind>),
			);

			// Create a wrapper function that can be called normally
			// Note: .call() and .apply() bypass the Proxy's apply trap and execute this directly
			const callableProxy = function (this: Collection<T, CK>, ...args: unknown[]) {
				const result = (value as (...a: unknown[]) => unknown).apply(target, args);
				if (result instanceof Collection) {
					return wrapCollectionWithProxy(result as Collection<unknown, CollectionKind>);
				}
				return result;
			};

			// Make the callable function also act as a property accessor
			return new Proxy(callableProxy, {
				get(_, accessProp: string | symbol) {
					// Bypass symbols
					if (typeof accessProp === 'symbol') {
						return undefined;
					}

					// Handle function-specific properties (only the ones that won't conflict with item properties)
					if (accessProp === 'length') return (value as (...a: unknown[]) => unknown).length;
					if (accessProp === 'call') {
						// Bind .call to callableProxy so it bypasses the proxy's apply trap
						return Function.prototype.call.bind(callableProxy);
					}
					if (accessProp === 'apply') {
						// Bind .apply to callableProxy so it bypasses the proxy's apply trap
						return Function.prototype.apply.bind(callableProxy);
					}
					if (accessProp === 'bind') {
						return Function.prototype.bind.bind(callableProxy);
					}

					// Delegate to higher-order proxy for property access (e.g., .name, .age)
					// The result is a proxy that forwards to the actual Collection result
					return (higherOrderProxy as Record<string, unknown>)[accessProp];
				},

				apply(_target, _thisArg, args) {
					const result = (value as (...a: unknown[]) => unknown).apply(target, args);
					// If the result is a Collection, wrap it too
					if (result instanceof Collection) {
						return wrapCollectionWithProxy(result as Collection<unknown, CollectionKind>);
					}
					return result;
				},
			});
		},
	}) as unknown as ProxiedCollection<T, CK>;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTION CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Collection - Laravel-style collection class.
 *
 * A fluent wrapper for arrays and objects with ~105 chainable methods.
 */
export class Collection<T, CK extends CollectionKind = 'array'> {
	protected items: Record<string, T>;
	protected isAssociative: boolean;

	constructor(items: Items<T> | Collection<T, CollectionKind> = [], isAssociative?: boolean) {
		// Normalize items to record format
		if (items instanceof Collection) {
			this.items = { ...items.items };
		} else if (Array.isArray(items)) {
			this.items = Object.fromEntries(items.map((v, i) => [String(i), v]));
		} else {
			this.items = { ...items };
		}

		// Determine isAssociative: explicit param > inherit from Collection > infer from type
		if (isAssociative !== undefined) {
			this.isAssociative = isAssociative;
		} else if (items instanceof Collection) {
			this.isAssociative = items.isAssociative;
		} else if (Array.isArray(items)) {
			this.isAssociative = false;
		} else {
			this.isAssociative = true;
		}
	}

	/**
	 * Get the underlying items from the given collection or array (Laravel pattern).
	 * Used to normalize Collection|Array parameters in methods.
	 */
	protected getArrayableItems<U>(items: U[] | Record<string, U> | CollectionParam<U>): Record<string, U> | U[] {
		if (Array.isArray(items)) {
			return items;
		}
		// Duck-type check for CollectionParam (includes Collection instances)
		if ('all' in items && typeof (items as CollectionParam<U>).all === 'function') {
			return (items as CollectionParam<U>).all() as Record<string, U>;
		}
		return items as Record<string, U>;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// STATIC FACTORY METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Create a new collection instance if the value isn't one already.
	 */
	static make<U>(items: Items<U> | CollectionParam<U> = []): Collection<U> {
		return new Collection(items as Items<U> | Collection<U>);
	}

	/**
	 * Wrap the given value in a collection if applicable.
	 */
	static wrap<U>(value: Iterable<U> | U): Collection<U> {
		if (value instanceof Collection) {
			return new Collection(value);
		}
		if (Array.isArray(value)) {
			return new Collection(value);
		}
		if (typeof value === 'object' && value !== null && Symbol.iterator in value) {
			return new Collection([...(value as Iterable<U>)]);
		}
		return new Collection([value as U]);
	}

	/**
	 * Get the underlying items from the given collection if applicable.
	 */
	static unwrap<U>(value: U[] | CollectionParam<U>): U[] {
		if (value instanceof Collection) {
			return value.toArray() as U[];
		}
		if (Array.isArray(value)) {
			return value;
		}
		// Handle other cases (like @ts-expect-error tests with strings)
		return value as unknown as U[];
	}

	/**
	 * Create a new instance with no items.
	 */
	static empty<U>(): Collection<U> {
		return new Collection<U>([]);
	}

	/**
	 * Create a collection with the given range.
	 */
	static range(from: number, to: number): Collection<number> {
		const items: number[] = [];
		if (from <= to) {
			for (let i = from; i <= to; i++) {
				items.push(i);
			}
		} else {
			for (let i = from; i >= to; i--) {
				items.push(i);
			}
		}
		return new Collection(items);
	}

	/**
	 * Create a new collection by invoking the callback a given amount of times.
	 */
	static times<U>(number: number, callback?: (index: number) => U): Collection<U | number> {
		if (number < 1) {
			return new Collection<U | number>([]);
		}

		const items: (U | number)[] = [];
		for (let i = 1; i <= number; i++) {
			items.push(callback ? callback(i) : i);
		}
		return new Collection(items);
	}

	/**
	 * Create a new collection from a JSON string.
	 */
	static fromJson<U>(json: string): Collection<U> {
		return new Collection(JSON.parse(json));
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// CORE RETRIEVAL METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get all items in the collection.
	 * Returns an array for array-kind collections or an object for associative collections.
	 * The return type is determined by the CK type parameter.
	 */
	all(): CK extends 'array' ? T[] : Record<string, T> {
		return (this.isAssociative ? { ...this.items } : Object.values(this.items)) as CK extends 'array'
			? T[]
			: Record<string, T>;
	}

	/**
	 * Get an item from the collection by key.
	 */
	get(key: string | number | null, defaultValue?: T | (() => T)): T | undefined {
		const k = key === null ? '' : String(key);
		if (k in this.items) {
			return this.items[k];
		}
		return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
	}

	/**
	 * Get an item from the collection by key or add it to collection if it does not exist.
	 */
	getOrPut(key: string | number | null, value: T | (() => T) | null): T {
		const k = key === null ? '' : String(key);
		if (k in this.items) {
			return this.items[k];
		}
		const resolvedValue = (typeof value === 'function' ? (value as () => T)() : value) as T;
		this.items[k] = resolvedValue;
		return resolvedValue;
	}

	/**
	 * Get the first item from the collection passing the given truth test.
	 */
	first(callback?: ((value: T, key: string) => boolean) | null): T | undefined;
	first<D>(callback: ((value: T, key: string) => boolean) | null | undefined, defaultValue: D | (() => D)): T | D;
	first<D = undefined>(
		callback?: ((value: T, key: string) => boolean) | null,
		defaultValue?: D | (() => D),
	): T | D | undefined {
		if (!callback) {
			const keys = Object.keys(this.items);
			if (keys.length > 0) {
				return this.items[keys[0]];
			}
			return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
		}
		for (const [key, value] of Object.entries(this.items)) {
			if (callback(value, key)) return value;
		}
		return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
	}

	/**
	 * Get the last item from the collection.
	 */
	last(callback?: ((value: T, key: string) => boolean) | null): T | undefined;
	last<D>(callback: ((value: T, key: string) => boolean) | null | undefined, defaultValue: D | (() => D)): T | D;
	last<D = undefined>(
		callback?: ((value: T, key: string) => boolean) | null,
		defaultValue?: D | (() => D),
	): T | D | undefined {
		const entries = Object.entries(this.items);
		if (!callback) {
			if (entries.length > 0) {
				return entries[entries.length - 1][1];
			}
			const isCallable = typeof defaultValue === 'function';
			if (isCallable) {
				return (defaultValue as () => D)();
			}
			return defaultValue;
		}
		for (let i = entries.length - 1; i >= 0; i--) {
			const [key, value] = entries[i];
			if (callback(value, key)) return value;
		}
		const isCallableDefault = typeof defaultValue === 'function';
		if (isCallableDefault) {
			return (defaultValue as () => D)();
		}
		return defaultValue;
	}

	/**
	 * Get the keys of the collection items.
	 */
	keys(): Collection<string> {
		return new Collection(Object.keys(this.items));
	}

	/**
	 * Reset the keys on the underlying array.
	 */
	values(): Collection<T> {
		return new Collection(Object.values(this.items));
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// TRANSFORMATION METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Run a map over each of the items.
	 */
	map<U>(callback: (value: T, key: string) => U): Collection<U, CK> {
		const mapped: Record<string, U> = {};
		for (const [key, value] of Object.entries(this.items)) {
			mapped[key] = callback(value, key);
		}
		return new Collection(mapped, this.isAssociative) as Collection<U, CK>;
	}

	/**
	 * Run an associative map over each of the items.
	 * The callback should return an associative array with a single key/value pair.
	 */
	mapWithKeys<U>(callback: (value: T, key: string) => [string, U]): Collection<U> {
		const mapped: Record<string, U> = {};
		for (const [key, value] of Object.entries(this.items)) {
			const [newKey, newValue] = callback(value, key);
			mapped[newKey] = newValue;
		}
		return new Collection(mapped, true);
	}

	/**
	 * Run a dictionary map over the items.
	 * The callback should return an associative array with a single key/value pair.
	 */
	mapToDictionary<U>(callback: (value: T, key: string) => [string, U]): Collection<U[]> {
		const dictionary: Record<string, U[]> = {};
		for (const [key, value] of Object.entries(this.items)) {
			const [dictKey, dictValue] = callback(value, key);
			if (!dictionary[dictKey]) {
				dictionary[dictKey] = [];
			}
			dictionary[dictKey].push(dictValue);
		}
		return new Collection(dictionary);
	}

	/**
	 * Run a grouping map over the items.
	 */
	mapToGroups<K extends string, V>(callback: (value: T, key: string) => [K, V]): Collection<Collection<V>> {
		const groups = this.mapToDictionary(callback);
		const result: Record<string, Collection<V>> = {};
		for (const [key, values] of Object.entries(groups.items)) {
			result[key] = new Collection(values as V[]);
		}
		return new Collection(result);
	}

	/**
	 * Map the values into a new class.
	 */
	mapInto<U>(classType: new (value: T, key: string) => U): Collection<U, CK> {
		return this.map((value, key) => new classType(value, key));
	}

	/**
	 * Run a map over each nested chunk of items.
	 */
	mapSpread<U>(callback: (...args: unknown[]) => U): Collection<U, CK> {
		return this.map((value, key) => {
			const args = Array.isArray(value) ? [...value, key] : [value, key];
			return callback(...args);
		});
	}

	/**
	 * Map a collection and flatten the result by a single level.
	 */
	flatMap<U>(callback: (value: T, key: string) => U[]): Collection<U, CK> {
		return this.map(callback).collapse() as Collection<U, CK>;
	}

	/**
	 * Run a filter over each of the items.
	 */
	filter(callback?: (value: T, key: string) => boolean): Collection<T, CK> {
		const filtered: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (callback ? callback(value, key) : Boolean(value)) {
				filtered[key] = value;
			}
		}
		return new Collection(filtered, this.isAssociative) as Collection<T, CK>;
	}

	/**
	 * Create a collection of all elements that do not pass a given truth test.
	 */
	reject(callback: T | ((value: T, key: string) => boolean)): Collection<T, CK> {
		const useCallback = useAsCallable(callback);
		return this.filter((value, key) => {
			// biome-ignore lint/suspicious/noDoubleEquals: Laravel reject() uses loose comparison by design
			return useCallback ? !(callback as (value: T, key: string) => boolean)(value, key) : value != callback;
		});
	}

	/**
	 * Collapse the collection of items into a single array.
	 */
	collapse<U = unknown>(): Collection<U> {
		const result: U[] = [];
		for (const value of Object.values(this.items)) {
			const isArray = Array.isArray(value);
			if (isArray) {
				result.push(...value);
				continue;
			}
			const isCollection = value instanceof Collection;
			if (isCollection) {
				result.push(...(value.all() as unknown as U[]));
			}
		}
		return new Collection(result);
	}

	/**
	 * Collapse the collection of items into a single array while preserving keys.
	 */
	collapseWithKeys(): Collection<unknown> {
		let results: Record<string, unknown> = {};
		for (const value of Object.values(this.items)) {
			let vals: Record<string, unknown>;
			if (value instanceof Collection) {
				vals = value.items as unknown as Record<string, unknown>;
			} else if (typeof value === 'object' && value !== null) {
				vals = value as Record<string, unknown>;
			} else {
				continue;
			}
			results = { ...results, ...vals };
		}
		// collapseWithKeys always returns keyed output
		return new Collection(results, true);
	}

	/**
	 * Get a flattened array of the items in the collection.
	 */
	flatten<U = unknown>(depth = Number.POSITIVE_INFINITY): Collection<U> {
		const doFlatten = (items: unknown[], currentDepth: number): unknown[] => {
			const result: unknown[] = [];
			for (const item of items) {
				if (Array.isArray(item) && currentDepth > 0) {
					result.push(...doFlatten(item, currentDepth - 1));
				} else if (item instanceof Collection && currentDepth > 0) {
					result.push(...doFlatten(Object.values(item.items), currentDepth - 1));
				} else {
					result.push(item);
				}
			}
			return result;
		};
		return new Collection(doFlatten(Object.values(this.items), depth) as U[]);
	}

	/**
	 * Flip the items in the collection.
	 */
	flip(): Collection<string> {
		const flipped: Record<string, string> = {};
		for (const [key, value] of Object.entries(this.items)) {
			flipped[String(value)] = key;
		}
		return new Collection(flipped, true);
	}

	/**
	 * Chunk the collection into chunks of the given size.
	 */
	chunk(size: number, preserveKeys = true): Collection<Collection<T>> {
		if (size <= 0) {
			return new Collection<Collection<T>>([]);
		}

		const chunks: Collection<T>[] = [];
		const entries = Object.entries(this.items);

		for (let i = 0; i < entries.length; i += size) {
			const chunkEntries = entries.slice(i, i + size);
			if (preserveKeys) {
				// Inherit isAssociative from parent when preserving keys
				chunks.push(new Collection(Object.fromEntries(chunkEntries), this.isAssociative));
			} else {
				// Always array when not preserving keys
				chunks.push(
					new Collection(
						chunkEntries.map(([, v]) => v),
						false,
					),
				);
			}
		}

		return new Collection(chunks);
	}

	/**
	 * Chunk the collection into chunks with a callback.
	 */
	chunkWhile(callback: (value: T, key: string, chunk: Collection<T>) => boolean): Collection<Collection<T>> {
		const entries = Object.entries(this.items);
		const isEmpty = entries.length === 0;
		if (isEmpty) return new Collection<Collection<T>>([]);

		const chunks: Collection<T>[] = [];
		let currentChunk: Record<string, T> = {};

		for (const [key, value] of entries) {
			const currentCollection = new Collection(currentChunk);
			const chunkIsEmpty = Object.keys(currentChunk).length === 0;
			if (chunkIsEmpty || callback(value, key, currentCollection)) {
				currentChunk[key] = value;
			} else {
				chunks.push(new Collection(currentChunk));
				currentChunk = { [key]: value };
			}
		}

		// Final chunk always has items after a non-empty loop
		chunks.push(new Collection(currentChunk));

		return new Collection(chunks);
	}

	/**
	 * Split a collection into a certain number of groups.
	 */
	split(numberOfGroups: number): Collection<Collection<T>> {
		if (this.isEmpty()) {
			return new Collection<Collection<T>>([]);
		}

		const groups: Collection<T>[] = [];
		const values = Object.values(this.items);
		const groupSize = Math.floor(values.length / numberOfGroups);
		const remain = values.length % numberOfGroups;
		let start = 0;

		for (let i = 0; i < numberOfGroups; i++) {
			let size = groupSize;
			if (i < remain) {
				size++;
			}
			if (size > 0) {
				groups.push(new Collection(values.slice(start, start + size)));
				start += size;
			}
		}

		return new Collection(groups);
	}

	/**
	 * Split a collection into a certain number of groups, and fill the first groups completely.
	 */
	splitIn(numberOfGroups: number): Collection<Collection<T>> {
		const chunkSize = Math.ceil(this.count() / numberOfGroups);
		return this.chunk(chunkSize);
	}

	/**
	 * Slice the underlying collection array.
	 */
	slice(offset: number, length?: number): Collection<T> {
		const entries = Object.entries(this.items);
		const sliced = length !== undefined ? entries.slice(offset, offset + length) : entries.slice(offset);
		return new Collection(Object.fromEntries(sliced), this.isAssociative);
	}

	/**
	 * Reverse items order.
	 */
	reverse(): Collection<T> {
		const values = [...Object.values(this.items)].reverse();
		return new Collection(values);
	}

	/**
	 * Shuffle the items in the collection.
	 */
	shuffle(): Collection<T> {
		const values = Object.values(this.items);
		for (let i = values.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[values[i], values[j]] = [values[j], values[i]];
		}
		return new Collection(values);
	}

	/**
	 * Pad collection to the specified length with a value.
	 */
	pad(size: number, value: T): Collection<T> {
		const values = Object.values(this.items);
		const absSize = Math.abs(size);

		if (values.length >= absSize) {
			return new Collection(values);
		}

		const padding = Array(absSize - values.length).fill(value) as T[];

		if (size < 0) {
			return new Collection([...padding, ...values]);
		}
		return new Collection([...values, ...padding]);
	}

	/**
	 * Zip the collection together with one or more arrays.
	 */
	zip<U>(...arrays: U[][]): Collection<Collection<T | U>> {
		const values = Object.values(this.items);
		const maxLength = Math.max(values.length, ...arrays.map((a) => a.length));
		const result: Collection<T | U>[] = [];

		for (let i = 0; i < maxLength; i++) {
			const zipped: (T | U)[] = [values[i] as T | U];
			for (const arr of arrays) {
				zipped.push(arr[i] as T | U);
			}
			result.push(new Collection(zipped));
		}

		return new Collection(result);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// COMPARISON METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Determine if an item exists in the collection.
	 */
	contains(
		keyOrCallback: T | string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		// biome-ignore lint/style/noArguments: Required to detect if caller passed 1 vs multiple args (undefined could be explicit)
		if (arguments.length === 1) {
			if (useAsCallable(keyOrCallback)) {
				for (const [key, val] of Object.entries(this.items)) {
					if ((keyOrCallback as (value: T, key: string) => boolean)(val, key)) {
						return true;
					}
				}
				return false;
			}
			return Object.values(this.items).includes(keyOrCallback as T);
		}

		return this.contains(operatorForWhere(keyOrCallback as string, operator, value));
	}

	/**
	 * Determine if an item exists, using strict comparison.
	 */
	containsStrict(keyOrValue: T | string | ((value: T, key: string) => boolean), value?: T): boolean {
		// biome-ignore lint/style/noArguments: Required to detect if caller passed 2 args (undefined value could be explicit)
		if (arguments.length === 2) {
			return this.contains((item) => dataGet(item, keyOrValue as string) === value);
		}

		if (useAsCallable(keyOrValue)) {
			return this.first(keyOrValue as unknown as (value: T, key: string) => boolean) !== undefined;
		}

		for (const item of Object.values(this.items)) {
			if (item === keyOrValue) return true;
		}
		return false;
	}

	/**
	 * Determine if an item is not contained in the collection.
	 */
	doesntContain(
		keyOrCallback: T | string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		// Only pass the arguments that were actually provided
		if (value !== undefined) {
			return !this.contains(keyOrCallback, operator, value);
		}
		if (operator !== undefined) {
			return !this.contains(keyOrCallback, operator);
		}
		return !this.contains(keyOrCallback);
	}

	/**
	 * Determine if an item is not contained in the collection, using strict comparison.
	 */
	doesntContainStrict(keyOrValue: T | string | ((value: T, key: string) => boolean), value?: T): boolean {
		// Only pass arguments that were actually provided (to respect arguments.length in containsStrict)
		if (value !== undefined) {
			return !this.containsStrict(keyOrValue, value);
		}
		return !this.containsStrict(keyOrValue);
	}

	/**
	 * Get the items in the collection that are not present in the given items.
	 */
	diff(items: T[] | CollectionParam<T>): Collection<T, CK> {
		const otherValues = new Set(Array.isArray(items) ? items : items.toArray());
		return this.filter((value) => !otherValues.has(value));
	}

	/**
	 * Get the items in the collection that are not present in the given items, using the callback.
	 */
	diffUsing(items: T[] | CollectionParam<T>, callback: (a: T, b: T) => number): Collection<T, CK> {
		const otherValues = Array.isArray(items) ? items : items.toArray();
		return this.filter((value) => !otherValues.some((other) => callback(value, other) === 0));
	}

	/**
	 * Get the items in the collection whose keys are not present in the given items.
	 */
	diffKeys(items: Record<string, unknown> | CollectionParam): Collection<T, CK> {
		const otherKeys = new Set(
			'all' in items && typeof (items as CollectionParam).all === 'function'
				? Object.keys((items as CollectionParam).all() as Record<string, unknown>)
				: Object.keys(items),
		);
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (!otherKeys.has(key)) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Get the items in the collection whose keys are not present in the given items, using the callback.
	 */
	diffKeysUsing(
		items: Record<string, unknown> | CollectionParam,
		callback: (a: string, b: string) => number,
	): Collection<T, CK> {
		const otherKeys =
			'all' in items && typeof (items as CollectionParam).all === 'function'
				? Object.keys((items as CollectionParam).all() as Record<string, unknown>)
				: Object.keys(items);
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (!otherKeys.some((other) => callback(key, other) === 0)) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Get the items in the collection whose keys and values are not present in the given items.
	 */
	diffAssoc(items: Record<string, T> | T[] | CollectionParam<T>): Collection<T, CK> {
		const other = this.getArrayableItems(items) as Record<string, unknown>;
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (!(key in other) || other[key] !== value) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Get the items in the collection whose keys and values are not present in the given items, using the callback.
	 */
	diffAssocUsing(
		items: Record<string, T> | T[] | CollectionParam<T>,
		callback: (a: string, b: string) => number,
	): Collection<T, CK> {
		const other = this.getArrayableItems(items) as Record<string, unknown>;
		const otherKeys = Object.keys(other);
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			const matchingKey = otherKeys.find((k) => callback(key, k) === 0);
			if (!matchingKey || other[matchingKey] !== value) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Intersect the collection with the given items.
	 */
	intersect(items: T[] | CollectionParam<T>): Collection<T, CK> {
		const otherValues = new Set(Array.isArray(items) ? items : items.toArray());
		return this.filter((value) => otherValues.has(value));
	}

	/**
	 * Intersect the collection with the given items, using the callback.
	 */
	intersectUsing(items: T[] | CollectionParam<T>, callback: (a: T, b: T) => number): Collection<T, CK> {
		const otherValues = Array.isArray(items) ? items : items.toArray();
		return this.filter((value) => otherValues.some((other) => callback(value, other) === 0));
	}

	/**
	 * Intersect the collection with the given items with additional index check.
	 */
	intersectAssoc(items: Record<string, T> | T[] | CollectionParam<T>): Collection<T, CK> {
		const other = this.getArrayableItems(items) as Record<string, unknown>;
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (key in other && other[key] === value) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Intersect the collection with the given items with additional index check, using the callback.
	 */
	intersectAssocUsing(
		items: Record<string, T> | T[] | CollectionParam<T>,
		callback: (a: string, b: string) => number,
	): Collection<T, CK> {
		const other = this.getArrayableItems(items) as Record<string, unknown>;
		const otherKeys = Object.keys(other);
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			const matchingKey = otherKeys.find((k) => callback(key, k) === 0);
			if (matchingKey !== undefined && other[matchingKey] === value) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Intersect the collection with the given items by key.
	 */
	intersectByKeys(items: Record<string, unknown> | CollectionParam): Collection<T, CK> {
		const otherKeys = new Set(
			'all' in items && typeof (items as CollectionParam).all === 'function'
				? Object.keys((items as CollectionParam).all() as Record<string, unknown>)
				: Object.keys(items),
		);
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (otherKeys.has(key)) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * Retrieve duplicate items from the collection.
	 * Uses loose comparison (==) for detecting duplicates.
	 */
	duplicates(callback?: ValueRetriever<T, unknown>, strict = false): Collection<T> {
		const retriever = valueRetriever(callback);
		const result: Record<string, T> = {};

		if (strict) {
			// Strict comparison using Map (uses ===)
			const seen = new Map<unknown, boolean>();
			for (const [key, value] of Object.entries(this.items)) {
				const id = retriever(value, key);
				if (seen.has(id)) {
					result[key] = value;
				} else {
					seen.set(id, true);
				}
			}
		} else {
			// Loose comparison - normalize values for comparison
			const seenValues: unknown[] = [];
			const seenKeys: string[] = [];

			const looseFind = (arr: unknown[], val: unknown): number => {
				for (let i = 0; i < arr.length; i++) {
					// biome-ignore lint/suspicious/noDoubleEquals: Laravel duplicates() uses loose comparison by design. Use duplicatesStrict() for strict comparison.
					if (arr[i] == val) return i;
				}
				return -1;
			};

			for (const [key, value] of Object.entries(this.items)) {
				const id = retriever(value, key);
				const foundIdx = looseFind(seenValues, id);
				if (foundIdx !== -1) {
					result[key] = value;
				} else {
					seenValues.push(id);
					seenKeys.push(key);
				}
			}
		}

		return new Collection(result);
	}

	/**
	 * Retrieve duplicate items from the collection using strict comparison.
	 */
	duplicatesStrict(callback?: ValueRetriever<T, unknown>): Collection<T> {
		return this.duplicates(callback, true);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// AGGREGATION METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get the median of a given key.
	 */
	median(key?: string): number | null {
		const values = (key ? this.pluck(key as keyof T) : this)
			.filter((v) => v !== null && v !== undefined)
			.map((v) => Number(v))
			.filter((v) => !Number.isNaN(v))
			.sort((a, b) => a - b)
			.all() as number[];

		const count = values.length;
		if (count === 0) return null;

		const middle = Math.floor(count / 2);
		if (count % 2 === 1) {
			return values[middle];
		}
		return (values[middle - 1] + values[middle]) / 2;
	}

	/**
	 * Get the mode of a given key.
	 */
	mode(key?: string): T[] | null {
		if (this.isEmpty()) return null;

		const values = key ? Object.values(this.pluck(key as keyof T).items) : Object.values(this.items);
		const counts = new Map<unknown, number>();

		for (const value of values) {
			counts.set(value, (counts.get(value) ?? 0) + 1);
		}

		let maxCount = 0;
		for (const count of counts.values()) {
			if (count > maxCount) maxCount = count;
		}

		const modes: T[] = [];
		for (const [value, count] of counts) {
			if (count === maxCount) modes.push(value as T);
		}

		// Return modes in the order they were first encountered (matches Laravel behavior)
		return modes;
	}

	/**
	 * Count the number of items in the collection.
	 */
	count(): number {
		return Object.keys(this.items).length;
	}

	/**
	 * Count the number of items in the collection by a field or using a callback.
	 */
	countBy(countBy?: ValueRetriever<T, string>): Collection<number> {
		const retriever = valueRetriever(countBy);
		const counts: Record<string, number> = {};

		for (const [key, value] of Object.entries(this.items)) {
			const groupKey = String(retriever(value, key));
			counts[groupKey] = (counts[groupKey] ?? 0) + 1;
		}

		return new Collection(counts, true);
	}

	/**
	 * Get the sum of the given values.
	 */
	sum(keyOrCallback?: ValueRetriever<T, number>): number {
		const retriever = valueRetriever(keyOrCallback);
		let total = 0;
		for (const [key, value] of Object.entries(this.items)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				total += num;
			}
		}
		return total;
	}

	/**
	 * Get the average value of a given key.
	 */
	avg(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever(keyOrCallback);
		let total = 0;
		let count = 0;
		for (const [key, value] of Object.entries(this.items)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				total += num;
				count++;
			}
		}
		return count > 0 ? total / count : null;
	}

	/**
	 * Alias for the "avg" method.
	 */
	average(keyOrCallback?: ValueRetriever<T, number>): number | null {
		return this.avg(keyOrCallback);
	}

	/**
	 * Get the min value of a given key.
	 */
	min(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever(keyOrCallback);
		let min: number | null = null;
		for (const [key, value] of Object.entries(this.items)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				if (min === null || num < min) min = num;
			}
		}
		return min;
	}

	/**
	 * Get the max value of a given key.
	 */
	max(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever(keyOrCallback);
		let max: number | null = null;
		for (const [key, value] of Object.entries(this.items)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				if (max === null || num > max) max = num;
			}
		}
		return max;
	}

	/**
	 * Calculate the percentage of items that pass a given truth test.
	 */
	percentage(callback: (value: T, key: string) => boolean, precision = 2): number | null {
		if (this.isEmpty()) return null;
		const count = this.filter(callback).count();
		return Number(((count / this.count()) * 100).toFixed(precision));
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// ARRAY BUILDING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Merge the collection with the given items.
	 */
	merge(items: T[] | Record<string, T> | CollectionParam<T>): Collection<T, CK> {
		let other: Record<string, T> | T[];
		if (Array.isArray(items)) {
			other = Object.fromEntries(items.map((v, i) => [String(Object.keys(this.items).length + i), v]));
		} else if ('all' in items && typeof (items as CollectionParam<T>).all === 'function') {
			other = (items as CollectionParam<T>).all() as Record<string, T>;
		} else {
			other = items as Record<string, T>;
		}
		return new Collection({ ...this.items, ...other }, this.isAssociative) as Collection<T, CK>;
	}

	/**
	 * Recursively merge the collection with the given items.
	 */
	mergeRecursive(items: Record<string, unknown> | CollectionParam): Collection<unknown, CK> {
		let other: Record<string, unknown>;
		if ('all' in items && typeof (items as CollectionParam).all === 'function') {
			other = (items as CollectionParam).all() as Record<string, unknown>;
		} else {
			other = items as Record<string, unknown>;
		}
		const mergeDeep = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
			const result = { ...target };
			for (const key of Object.keys(source)) {
				if (
					typeof result[key] === 'object' &&
					result[key] !== null &&
					typeof source[key] === 'object' &&
					source[key] !== null
				) {
					result[key] = mergeDeep(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					result[key] = source[key];
				}
			}
			return result;
		};
		return new Collection(
			mergeDeep(this.items as unknown as Record<string, unknown>, other),
			this.isAssociative,
		) as Collection<unknown, CK>;
	}

	/**
	 * Union the collection with the given items.
	 */
	union(items: Record<string, T> | CollectionParam<T>): Collection<T, CK> {
		let other: Record<string, T>;
		if ('all' in items && typeof (items as CollectionParam<T>).all === 'function') {
			other = (items as CollectionParam<T>).all() as Record<string, T>;
		} else {
			other = items as Record<string, T>;
		}
		return new Collection({ ...other, ...this.items });
	}

	/**
	 * Create a collection by using this collection for keys and another for its values.
	 */
	combine<U>(values: U[] | CollectionParam<U>): Collection<U, 'assoc'> {
		const keys = Object.values(this.items);
		const vals = Array.isArray(values) ? values : values.toArray();
		const result: Record<string, U> = {};
		for (let i = 0; i < keys.length && i < vals.length; i++) {
			result[String(keys[i])] = vals[i];
		}
		return new Collection(result);
	}

	/**
	 * Cross join with the given lists, returning all possible permutations.
	 */
	crossJoin<U>(...lists: (U[] | CollectionParam<U>)[]): Collection<(T | U)[]> {
		const arrays = lists.map((list) => (Array.isArray(list) ? list : list.toArray()));
		const result: (T | U)[][] = [];

		const combine = (current: (T | U)[], remaining: unknown[][]): void => {
			if (remaining.length === 0) {
				result.push(current);
				return;
			}
			const [first, ...rest] = remaining;
			for (const item of first) {
				combine([...current, item as T | U], rest);
			}
		};

		combine([], [Object.values(this.items), ...arrays]);
		return new Collection(result);
	}

	/**
	 * Push all of the given items onto the collection.
	 */
	concat(source: T[] | CollectionParam<T>): Collection<T> {
		const result = new Collection(this);
		const items = Array.isArray(source) ? source : source.toArray();
		for (const item of items) {
			result.push(item);
		}
		return result;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// ITEM MODIFICATION METHODS (MUTATING)
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Put an item in the collection by key.
	 */
	put(key: string | number, value: T): this {
		this.items[String(key)] = value;
		return this;
	}

	/**
	 * Get and remove an item from the collection.
	 */
	pull(key: string | number): T | undefined;
	pull<D>(key: string | number, defaultValue: D | (() => D)): T | D;
	pull<D = undefined>(key: string | number, defaultValue?: D | (() => D)): T | D | undefined {
		const k = String(key);
		if (k in this.items) {
			const value = this.items[k];
			delete this.items[k];
			return value;
		}
		return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
	}

	/**
	 * Push one or more items onto the end of the collection.
	 */
	push(...values: T[]): this {
		const currentKeys = Object.keys(this.items)
			.map(Number)
			.filter((n) => !Number.isNaN(n));
		let nextKey = currentKeys.length > 0 ? Math.max(...currentKeys) + 1 : 0;
		for (const value of values) {
			this.items[String(nextKey++)] = value;
		}
		return this;
	}

	/**
	 * Push an item onto the beginning of the collection.
	 */
	prepend(value: T, key?: string | number): this {
		if (key !== undefined) {
			this.items = { [String(key)]: value, ...this.items };
		} else {
			const values = Object.values(this.items);
			values.unshift(value);
			this.items = Object.fromEntries(values.map((v, i) => [String(i), v]));
		}
		return this;
	}

	/**
	 * Prepend one or more items to the beginning of the collection.
	 */
	unshift(...values: T[]): this {
		const currentValues = Object.values(this.items);
		this.items = Object.fromEntries([...values, ...currentValues].map((v, i) => [String(i), v]));
		return this;
	}

	/**
	 * Get and remove the last N items from the collection.
	 */
	pop(count = 1): T | Collection<T> | null {
		if (count < 1) {
			return new Collection<T>([]);
		}

		const keys = Object.keys(this.items);
		if (keys.length === 0) {
			return count === 1 ? null : new Collection<T>([]);
		}

		if (count === 1) {
			const lastKey = keys[keys.length - 1];
			const value = this.items[lastKey];
			delete this.items[lastKey];
			return value;
		}

		const results: T[] = [];
		const toRemove = Math.min(count, keys.length);
		for (let i = 0; i < toRemove; i++) {
			// biome-ignore lint/style/noNonNullAssertion: We know keys exist because toRemove <= keys.length
			const lastKey = Object.keys(this.items).pop()!;
			results.push(this.items[lastKey]);
			delete this.items[lastKey];
		}
		return new Collection(results);
	}

	/**
	 * Get and remove the first N items from the collection.
	 */
	shift(count = 1): T | Collection<T> | null {
		if (count < 0) {
			throw new InvalidArgumentException('Number of shifted items may not be less than zero.');
		}

		const keys = Object.keys(this.items);
		if (keys.length === 0) {
			return count === 1 ? null : new Collection<T>([]);
		}

		if (count === 0) {
			return new Collection<T>([]);
		}

		if (count === 1) {
			const firstKey = keys[0];
			const value = this.items[firstKey];
			delete this.items[firstKey];
			return value;
		}

		const results: T[] = [];
		const toRemove = Math.min(count, keys.length);
		for (let i = 0; i < toRemove; i++) {
			const firstKey = Object.keys(this.items)[0];
			results.push(this.items[firstKey]);
			delete this.items[firstKey];
		}
		return new Collection(results);
	}

	/**
	 * Add an item to the collection.
	 */
	add(item: T): this {
		return this.push(item);
	}

	/**
	 * Remove an item from the collection by key.
	 */
	forget(keys: string | number | (string | number)[]): this {
		const keysArray = Array.isArray(keys) ? keys : [keys];
		for (const key of keysArray) {
			delete this.items[String(key)];
		}
		return this;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// SELECTION METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get all items except for those with the specified keys.
	 */
	except(keys: (string | number)[] | Collection<string | number> | null): Collection<T> {
		if (keys === null) {
			return new Collection(this.items, this.isAssociative);
		}
		const keysArray = keys instanceof Collection ? Object.values(keys.items) : keys;
		const keySet = new Set(keysArray.map(String));
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (!keySet.has(key)) {
				result[key] = value;
			}
		}
		return new Collection(result, this.isAssociative);
	}

	/**
	 * Get the items with the specified keys.
	 */
	only(keys: (string | number)[] | Collection<string | number> | null): Collection<T> {
		if (keys === null) {
			return new Collection(this.items, this.isAssociative);
		}
		const keysArray = keys instanceof Collection ? Object.values(keys.items) : keys;
		const keySet = new Set(keysArray.map(String));
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (keySet.has(key)) {
				result[key] = value;
			}
		}
		return new Collection(result, this.isAssociative);
	}

	/**
	 * Select specific values from the items within the collection.
	 */
	select(keys: (string | number)[] | Collection<string | number, CollectionKind> | null): Collection<Partial<T>, CK> {
		if (keys === null) {
			return new Collection(this.items as unknown as Record<string, Partial<T>>, this.isAssociative) as Collection<
				Partial<T>,
				CK
			>;
		}
		const keysArray = (keys instanceof Collection ? Object.values(keys.items) : keys).map(String);
		return this.map((item) => {
			const result: Partial<T> = {};
			for (const key of keysArray) {
				const value = dataGet(item, key);
				if (value !== undefined) {
					(result as Record<string, unknown>)[key] = value;
				}
			}
			return result;
		});
	}

	/**
	 * Determine if an item exists in the collection by key.
	 */
	has(key: string | number | (string | number)[]): boolean {
		const keys = Array.isArray(key) ? key : [key];
		for (const k of keys) {
			if (!(String(k) in this.items)) return false;
		}
		return true;
	}

	/**
	 * Determine if any of the keys exist in the collection.
	 */
	hasAny(key: string | number | (string | number)[]): boolean {
		if (this.isEmpty()) return false;
		const keys = Array.isArray(key) ? key : [key];
		for (const k of keys) {
			if (String(k) in this.items) return true;
		}
		return false;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUPING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Group an associative array by a field or using a callback.
	 */
	groupBy(groupBy: ValueRetriever<T, string | string[]>, preserveKeys = false): Collection<Collection<T>> {
		const retriever = valueRetriever(groupBy);
		const results: Record<string, Record<string, T>> = {};

		for (const [key, value] of Object.entries(this.items)) {
			let groupKeys = retriever(value, key);
			if (!Array.isArray(groupKeys)) {
				groupKeys = [groupKeys] as unknown as string[];
			}

			for (let groupKey of groupKeys as string[]) {
				// Normalize group key
				if (typeof groupKey === 'boolean') {
					groupKey = groupKey ? '1' : '0';
				} else if (groupKey === null || groupKey === undefined) {
					groupKey = '';
				} else {
					groupKey = String(groupKey);
				}

				if (!results[groupKey]) {
					results[groupKey] = {};
				}

				if (preserveKeys) {
					results[groupKey][key] = value;
				} else {
					const nextIndex = Object.keys(results[groupKey]).length;
					results[groupKey][String(nextIndex)] = value;
				}
			}
		}

		const wrapped: Record<string, Collection<T>> = {};
		for (const [k, v] of Object.entries(results)) {
			wrapped[k] = new Collection(v, this.isAssociative);
		}
		return new Collection(wrapped, true);
	}

	/**
	 * Key an associative array by a field or using a callback.
	 */
	keyBy(keyBy: ValueRetriever<T, string>): Collection<T> {
		const retriever = valueRetriever(keyBy);
		const results: Record<string, T> = {};

		for (const [key, value] of Object.entries(this.items)) {
			let resolvedKey = retriever(value, key);

			// Normalize key
			if (typeof resolvedKey === 'object' && resolvedKey !== null) {
				resolvedKey = String(resolvedKey);
			}

			results[String(resolvedKey)] = value;
		}

		return new Collection(results, true);
	}

	/**
	 * Partition the collection into two arrays using the given callback or key.
	 */
	partition(
		keyOrCallback: string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): [Collection<T>, Collection<T>] {
		let callback: (value: T, key: string) => boolean;
		// biome-ignore lint/style/noArguments: Required to detect if caller passed multiple args (undefined could be explicit)
		const hasMultipleArgs = arguments.length > 1;
		if (hasMultipleArgs) {
			callback = operatorForWhere(keyOrCallback as string, operator, value);
		} else {
			const isCallable = useAsCallable(keyOrCallback);
			if (isCallable) {
				callback = keyOrCallback as (value: T, key: string) => boolean;
			} else {
				callback = valueRetriever(keyOrCallback as string);
			}
		}

		const passed: Record<string, T> = {};
		const failed: Record<string, T> = {};

		for (const [key, val] of Object.entries(this.items)) {
			if (callback(val, key)) {
				passed[key] = val;
			} else {
				failed[key] = val;
			}
		}

		return [new Collection(passed, this.isAssociative), new Collection(failed, this.isAssociative)];
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// SEARCHING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Search the collection for a given value and return the corresponding key if successful.
	 */
	search(value: T | ((value: T, key: string) => boolean), strict = false): string | false {
		if (!useAsCallable(value)) {
			for (const [key, item] of Object.entries(this.items)) {
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel search() uses loose comparison by default (strict param controls this)
				if (strict ? item === value : item == value) {
					return key;
				}
			}
			return false;
		}

		for (const [key, item] of Object.entries(this.items)) {
			if ((value as (value: T, key: string) => boolean)(item, key)) {
				return key;
			}
		}
		return false;
	}

	/**
	 * Get the item before the given item.
	 */
	before(value: T | ((value: T, key: string) => boolean), strict = false): T | null {
		const key = this.search(value, strict);
		if (key === false) return null;

		const keysArray = Object.values(this.keys().items);
		const position = keysArray.indexOf(key);
		if (position === 0) return null;

		return this.get(keysArray[position - 1]) ?? null;
	}

	/**
	 * Get the item after the given item.
	 */
	after(value: T | ((value: T, key: string) => boolean), strict = false): T | null {
		const key = this.search(value, strict);
		if (key === false) return null;

		const keysArray = Object.values(this.keys().items);
		const position = keysArray.indexOf(key);
		if (position === keysArray.length - 1) return null;

		return this.get(keysArray[position + 1]) ?? null;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// SORTING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Sort through each item with a callback.
	 */
	sort(callback?: ((a: T, b: T) => number) | number): Collection<T> {
		const values = [...Object.values(this.items)];

		if (callback && typeof callback === 'function') {
			values.sort(callback);
		} else {
			values.sort((a, b) => {
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			});
		}

		return new Collection(values);
	}

	/**
	 * Sort items in descending order.
	 * @param _options - Sorting options (reserved for Laravel API compatibility, not used in JS)
	 */
	sortDesc(_options?: number): Collection<T> {
		const values = [...Object.values(this.items)];
		values.sort((a, b) => {
			if (a < b) return 1;
			if (a > b) return -1;
			return 0;
		});
		return new Collection(values);
	}

	/**
	 * Sort the collection using the given callback.
	 */
	sortBy(callback: ValueRetriever<T, unknown>, _options?: number, descending = false): Collection<T> {
		const retriever = valueRetriever(callback as ValueRetriever<T, unknown>);
		const entries = Object.entries(this.items);

		entries.sort(([keyA, a], [keyB, b]) => {
			const valueA = retriever(a, keyA) as string | number;
			const valueB = retriever(b, keyB) as string | number;
			let result = 0;
			if (valueA < valueB) result = -1;
			else if (valueA > valueB) result = 1;
			return descending ? -result : result;
		});

		// Return as array to preserve sort order (Object.fromEntries reorders numeric keys)
		return new Collection(entries.map(([, v]) => v));
	}

	/**
	 * Sort the collection in descending order using the given callback.
	 */
	sortByDesc(callback: ValueRetriever<T, unknown>, options?: number): Collection<T> {
		return this.sortBy(callback as ValueRetriever<T, unknown>, options, true);
	}

	/**
	 * Sort the collection keys.
	 */
	sortKeys(_options?: number, descending = false): Collection<T> {
		const entries = Object.entries(this.items);
		entries.sort(([a], [b]) => {
			const result = a.localeCompare(b);
			return descending ? -result : result;
		});
		return new Collection(Object.fromEntries(entries));
	}

	/**
	 * Sort the collection keys in descending order.
	 */
	sortKeysDesc(options?: number): Collection<T> {
		return this.sortKeys(options, true);
	}

	/**
	 * Sort the collection keys using a callback.
	 */
	sortKeysUsing(callback: (a: string, b: string) => number): Collection<T> {
		const entries = Object.entries(this.items);
		entries.sort(([a], [b]) => callback(a, b));
		return new Collection(Object.fromEntries(entries));
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// SLICING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Skip the first {$count} items.
	 */
	skip(count: number): Collection<T> {
		return this.slice(count);
	}

	/**
	 * Skip items in the collection until the given condition is met.
	 */
	skipUntil(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;

		let skipping = true;
		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.items)) {
			if (skipping && callback(item, key)) {
				skipping = false;
			}
			if (!skipping) {
				result[key] = item;
			}
		}
		return new Collection(result);
	}

	/**
	 * Skip items in the collection while the given condition is met.
	 */
	skipWhile(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;

		let skipping = true;
		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.items)) {
			if (skipping && !callback(item, key)) {
				skipping = false;
			}
			if (!skipping) {
				result[key] = item;
			}
		}
		return new Collection(result);
	}

	/**
	 * Take the first or last {$limit} items.
	 */
	take(limit: number): Collection<T> {
		if (limit < 0) {
			// Take from the end: slice(limit) gets last |limit| items
			return this.slice(limit);
		}
		return this.slice(0, limit);
	}

	/**
	 * Take items in the collection until the given condition is met.
	 */
	takeUntil(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;

		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.items)) {
			if (callback(item, key)) break;
			result[key] = item;
		}
		return new Collection(result, this.isAssociative);
	}

	/**
	 * Take items in the collection while the given condition is met.
	 */
	takeWhile(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;

		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.items)) {
			if (!callback(item, key)) break;
			result[key] = item;
		}
		return new Collection(result, this.isAssociative);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// STRING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Concatenate values of a given key as a string.
	 */
	implode(value: string | ((value: T, key: string) => unknown), glue?: string): string {
		if (useAsCallable(value)) {
			const mapped = this.map(value as (value: T, key: string) => unknown);
			return Object.values(mapped.items).join(glue ?? '');
		}

		const first = this.first();
		if (typeof first === 'object' && first !== null) {
			const plucked = this.pluck(value as keyof T);
			return Object.values(plucked.items).join(glue ?? '');
		}

		return Object.values(this.items).join((value as string) ?? '');
	}

	/**
	 * Join all items from the collection using a string. The final items can use a separate glue string.
	 */
	join(glue: string, finalGlue = ''): string {
		if (finalGlue === '') {
			return this.implode(glue);
		}

		const count = this.count();
		if (count === 0) return '';
		if (count === 1) return String(this.last());

		const collection = new Collection(this);
		const finalItem = collection.pop();
		return collection.implode(glue) + finalGlue + String(finalItem);
	}

	/**
	 * Convert the collection to its string representation.
	 * Returns comma-separated values (consistent with EmptyAware trait expectations).
	 */
	toString(): string {
		return this.join(', ');
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// VALIDATION METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Determine if the collection is empty or not.
	 */
	isEmpty(): boolean {
		return Object.keys(this.items).length === 0;
	}

	/**
	 * Determine if the collection is not empty.
	 */
	isNotEmpty(): boolean {
		return !this.isEmpty();
	}

	/**
	 * Determine if the collection contains exactly one item.
	 */
	containsOneItem(callback?: (value: T, key: string) => boolean): boolean {
		if (callback) {
			return this.filter(callback).count() === 1;
		}
		return this.count() === 1;
	}

	/**
	 * Get the first item in the collection, but only if exactly one item exists. Otherwise, throw an exception.
	 */
	sole(keyOrCallback?: string | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): T {
		let filter: ((value: T, key: string) => boolean) | undefined;

		// biome-ignore lint/style/noArguments: Required to detect if caller passed multiple args (undefined could be explicit)
		if (arguments.length > 1) {
			filter = operatorForWhere(keyOrCallback as string, operator, value);
		} else if (keyOrCallback) {
			filter = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: string) => boolean)
				: operatorForWhere(keyOrCallback as string, '=', true);
		}

		const items = filter ? this.filter(filter) : this;
		const count = items.count();

		if (count === 0) {
			throw new ItemNotFoundException();
		}

		if (count > 1) {
			throw new MultipleItemsFoundException(count);
		}

		// biome-ignore lint/style/noNonNullAssertion: Guaranteed to exist - count === 1 at this point
		return items.first()!;
	}

	/**
	 * Get the first item in the collection but throw an exception if no matching items exist.
	 */
	firstOrFail(keyOrCallback?: string | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): T {
		let filter: ((value: T, key: string) => boolean) | undefined;

		// biome-ignore lint/style/noArguments: Required to detect if caller passed multiple args (undefined could be explicit)
		if (arguments.length > 1) {
			filter = operatorForWhere(keyOrCallback as string, operator, value);
		} else if (keyOrCallback) {
			filter = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: string) => boolean)
				: operatorForWhere(keyOrCallback as string, '=', true);
		}

		const placeholder = Symbol('placeholder');
		const item = this.first(filter, (() => placeholder) as unknown as () => T);

		if (item === (placeholder as unknown)) {
			throw new ItemNotFoundException();
		}

		return item as T;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// ADVANCED METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get the values of a given key.
	 */
	pluck<K extends keyof T>(value: K, key?: keyof T): Collection<T[K], CK> {
		if (key !== undefined) {
			const result: Record<string, T[K]> = {};
			for (const item of Object.values(this.items)) {
				const k = String(item[key]);
				result[k] = item[value];
			}
			// When key is provided, creates an associative collection
			return new Collection(result, true) as Collection<T[K], CK>;
		}
		return this.map((item) => item[value]);
	}

	/**
	 * Transform each item in the collection using a callback.
	 * NOTE: Unlike map(), this mutates the collection in place.
	 */
	transform(callback: (value: T, key: string) => T): this {
		for (const key in this.items) {
			this.items[key] = callback(this.items[key], key);
		}
		return this;
	}

	/**
	 * Create a new collection consisting of every n-th element.
	 */
	nth(step: number, offset = 0): Collection<T> {
		const values = Object.values(this.slice(offset).items);
		const result: T[] = [];
		for (let i = 0; i < values.length; i++) {
			if (i % step === 0) {
				result.push(values[i]);
			}
		}
		return new Collection(result);
	}

	/**
	 * Get one or a specified number of items randomly from the collection.
	 */
	random(number?: number | ((collection: Collection<T>) => number), preserveKeys = false): T | Collection<T> {
		const values = Object.values(this.items);
		if (values.length === 0) {
			throw new InvalidArgumentException('Cannot get random item from empty collection.');
		}

		if (number === undefined) {
			return values[Math.floor(Math.random() * values.length)];
		}

		const count = typeof number === 'function' ? number(this as unknown as Collection<T>) : number;

		if (count > values.length) {
			throw new InvalidArgumentException(
				`You requested ${count} items, but there are only ${values.length} items available.`,
			);
		}

		// Fisher-Yates shuffle helper
		const shuffle = <U>(arr: U[]): U[] => {
			const result = [...arr];
			for (let i = result.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[result[i], result[j]] = [result[j], result[i]];
			}
			return result;
		};

		if (preserveKeys) {
			const shuffledEntries = shuffle(Object.entries(this.items));
			return new Collection(Object.fromEntries(shuffledEntries.slice(0, count)));
		}

		return new Collection(shuffle(values).slice(0, count));
	}

	/**
	 * Create chunks representing a "sliding window" view of the items in the collection.
	 */
	sliding(size = 2, step = 1): Collection<Collection<T>> {
		if (size < 1) {
			throw new InvalidArgumentException('Size value must be at least 1.');
		}
		if (step < 1) {
			throw new InvalidArgumentException('Step value must be at least 1.');
		}

		const entries = Object.entries(this.items);
		const count = entries.length;
		const chunks = Math.floor((count - size) / step) + 1;

		if (chunks < 1) {
			return new Collection<Collection<T>>([]);
		}

		const result: Collection<T>[] = [];
		for (let i = 0; i < chunks; i++) {
			const start = i * step;
			const chunk = entries.slice(start, start + size);
			result.push(new Collection(Object.fromEntries(chunk), this.isAssociative));
		}

		return new Collection(result);
	}

	/**
	 * Multiply the items in the collection by the multiplier.
	 */
	multiply(multiplier: number): Collection<T> {
		const result = new Collection<T>([]);
		for (let i = 0; i < multiplier; i++) {
			result.push(...Object.values(this.items));
		}
		return result;
	}

	/**
	 * Replace the collection items with the given items.
	 */
	replace(items: Record<string, T> | CollectionParam<T>): Collection<T, CK> {
		let other: Record<string, T>;
		if ('all' in items && typeof (items as CollectionParam<T>).all === 'function') {
			other = (items as CollectionParam<T>).all() as Record<string, T>;
		} else {
			other = items as Record<string, T>;
		}
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			result[key] = key in other ? other[key] : value;
		}
		for (const [key, value] of Object.entries(other)) {
			if (!(key in result)) {
				result[key] = value;
			}
		}
		return new Collection(result, this.isAssociative) as Collection<T, CK>;
	}

	/**
	 * Recursively replace the collection items with the given items.
	 */
	replaceRecursive(items: Record<string, unknown> | CollectionParam): Collection<unknown, CK> {
		let other: Record<string, unknown>;
		if ('all' in items && typeof (items as CollectionParam).all === 'function') {
			other = (items as CollectionParam).all() as Record<string, unknown>;
		} else {
			other = items as Record<string, unknown>;
		}
		const replaceDeep = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
			const result = { ...target };
			for (const key of Object.keys(source)) {
				if (
					typeof result[key] === 'object' &&
					result[key] !== null &&
					typeof source[key] === 'object' &&
					source[key] !== null
				) {
					result[key] = replaceDeep(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					result[key] = source[key];
				}
			}
			return result;
		};
		return new Collection(
			replaceDeep(this.items as unknown as Record<string, unknown>, other),
			this.isAssociative,
		) as Collection<unknown, CK>;
	}

	/**
	 * Splice a portion of the underlying collection array.
	 */
	splice(offset: number, length?: number, replacement: T | T[] = [] as T[]): Collection<T, CK> {
		// Work with values array for proper reindexing (like PHP array_splice)
		const values = Object.values(this.items);

		// Normalize replacement to array
		const replacementArray: T[] = Array.isArray(replacement) ? replacement : [replacement];

		let removed: T[];
		if (length === undefined) {
			removed = values.splice(offset);
		} else {
			removed = values.splice(offset, length, ...replacementArray);
		}

		// Rebuild items with sequential keys
		this.items = {} as Record<string, T>;
		for (let i = 0; i < values.length; i++) {
			this.items[String(i)] = values[i];
		}

		return new Collection(removed);
	}

	/**
	 * Flatten a multi-dimensional associative array with dots.
	 */
	dot(): Collection<unknown> {
		const result: Record<string, unknown> = {};

		const flatten = (items: Record<string, unknown>, prefix = ''): void => {
			for (const [key, value] of Object.entries(items)) {
				const newKey = prefix ? `${prefix}.${key}` : key;
				if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
					flatten(value as Record<string, unknown>, newKey);
				} else {
					result[newKey] = value;
				}
			}
		};

		flatten(this.items as unknown as Record<string, unknown>);
		return new Collection(result);
	}

	/**
	 * Convert a flatten "dot" notation array into an expanded array.
	 */
	undot(): Collection<unknown> {
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(this.items)) {
			const keys = key.split('.');
			let current = result;

			for (let i = 0; i < keys.length - 1; i++) {
				const k = keys[i];
				if (!(k in current) || typeof current[k] !== 'object') {
					current[k] = {};
				}
				current = current[k] as Record<string, unknown>;
			}

			current[keys[keys.length - 1]] = value;
		}

		return new Collection(result);
	}

	/**
	 * Return only unique items from the collection array.
	 */
	unique(keyOrCallback?: ValueRetriever<T, unknown>, strict = false): Collection<T> {
		const retriever = valueRetriever(keyOrCallback);
		const seen: unknown[] = [];
		const result: Record<string, T> = {};

		for (const [key, value] of Object.entries(this.items)) {
			const id = retriever(value, key);
			// biome-ignore lint/suspicious/noDoubleEquals: Laravel unique() uses loose comparison by default. Use uniqueStrict() for strict comparison.
			const exists = strict ? seen.some((s) => s === id) : seen.some((s) => s == id);
			if (!exists) {
				seen.push(id);
				result[key] = value;
			}
		}

		return new Collection(result, this.isAssociative);
	}

	/**
	 * Return only unique items from the collection array using strict comparison.
	 */
	uniqueStrict(keyOrCallback?: ValueRetriever<T, unknown>): Collection<T> {
		return this.unique(keyOrCallback, true);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// WHERE CLAUSE METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Filter items by the given key value pair.
	 */
	where(key: string, operatorOrValue?: WhereOperator | unknown, value?: unknown): Collection<T, CK> {
		return this.filter(operatorForWhere(key, operatorOrValue, value));
	}

	/**
	 * Filter items by the given key value pair using strict comparison.
	 */
	whereStrict(key: string, value: unknown): Collection<T, CK> {
		return this.filter((item) => dataGet(item, key) === value);
	}

	/**
	 * Filter items by the given key value pair.
	 */
	whereIn(key: string, values: unknown[], strict = false): Collection<T, CK> {
		return this.filter((item) => {
			const retrieved = dataGet(item, key);
			// biome-ignore lint/suspicious/noDoubleEquals: Laravel whereIn() uses loose comparison by default. Use whereInStrict() for strict comparison.
			return strict ? values.some((v) => v === retrieved) : values.some((v) => v == retrieved);
		});
	}

	/**
	 * Filter items by the given key value pair using strict comparison.
	 */
	whereInStrict(key: string, values: unknown[]): Collection<T, CK> {
		return this.whereIn(key, values, true);
	}

	/**
	 * Filter items by the given key value pair.
	 */
	whereNotIn(key: string, values: unknown[], strict = false): Collection<T, CK> {
		return this.filter((item) => {
			const retrieved = dataGet(item, key);
			// biome-ignore lint/suspicious/noDoubleEquals: Laravel whereNotIn() uses loose comparison by default. Use whereNotInStrict() for strict comparison.
			return strict ? !values.some((v) => v === retrieved) : !values.some((v) => v == retrieved);
		});
	}

	/**
	 * Filter items by the given key value pair using strict comparison.
	 */
	whereNotInStrict(key: string, values: unknown[]): Collection<T, CK> {
		return this.whereNotIn(key, values, true);
	}

	/**
	 * Filter items such that the value of the given key is between the given values.
	 */
	whereBetween(key: string, values: [number, number]): Collection<T, CK> {
		return this.where(key, '>=', values[0]).where(key, '<=', values[1]);
	}

	/**
	 * Filter items such that the value of the given key is not between the given values.
	 */
	whereNotBetween(key: string, values: [number, number]): Collection<T, CK> {
		return this.filter((item) => {
			const value = dataGet(item, key) as number;
			return value < values[0] || value > values[1];
		});
	}

	/**
	 * Filter items where the value for the given key is null.
	 */
	whereNull(key?: string): Collection<T, CK> {
		return this.filter((item) => {
			const value = key ? dataGet(item, key) : item;
			return value === null || value === undefined;
		});
	}

	/**
	 * Filter items where the value for the given key is not null.
	 */
	whereNotNull(key?: string): Collection<T, CK> {
		return this.filter((item) => {
			const value = key ? dataGet(item, key) : item;
			return value !== null && value !== undefined;
		});
	}

	/**
	 * Filter the items, removing any items that don't match the given type(s).
	 */
	whereInstanceOf<U>(type: new (...args: unknown[]) => U): Collection<U> {
		return this.filter((item) => item instanceof type) as unknown as Collection<U>;
	}

	/**
	 * Get the first item by the given key value pair.
	 */
	firstWhere(key: string, operatorOrValue?: WhereOperator | unknown, value?: unknown): T | undefined {
		return this.first(operatorForWhere(key, operatorOrValue, value));
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// ITERATION & REDUCTION
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Execute a callback over each item.
	 */
	each(callback: (value: T, key: string) => unknown): this {
		for (const [key, value] of Object.entries(this.items)) {
			if (callback(value, key) === false) break;
		}
		return this;
	}

	/**
	 * Execute a callback over each nested chunk of items.
	 */
	eachSpread(callback: (...args: unknown[]) => unknown): this {
		for (const [key, value] of Object.entries(this.items)) {
			const args = Array.isArray(value) ? [...value, key] : [value, key];
			if (callback(...args) === false) break;
		}
		return this;
	}

	/**
	 * Reduce the collection to a single value.
	 */
	reduce<U>(callback: (accumulator: U, value: T, key: string) => U, initial: U): U {
		let acc = initial;
		for (const [key, value] of Object.entries(this.items)) {
			acc = callback(acc, value, key);
		}
		return acc;
	}

	/**
	 * Reduce the collection to multiple aggregate values.
	 */
	reduceSpread<U extends unknown[]>(callback: (...args: [...U, T, string]) => U, ...initial: U): U {
		let result = initial;
		for (const [key, value] of Object.entries(this.items)) {
			result = callback(...result, value, key);
		}
		return result;
	}

	/**
	 * Reduce an associative collection to a single value.
	 * Alias for reduce() that makes intent clearer when working with keyed collections.
	 */
	reduceWithKeys<U>(callback: (carry: U, value: T, key: string) => U, initial: U): U {
		return this.reduce(callback, initial);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// TESTING METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Determine if all items pass the given truth test.
	 */
	every(keyOrCallback: string | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): boolean {
		// biome-ignore lint/style/noArguments: Required to detect if caller passed 1 vs multiple args (undefined could be explicit)
		if (arguments.length === 1) {
			const callback = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: string) => boolean)
				: valueRetriever(keyOrCallback as string);

			for (const [key, val] of Object.entries(this.items)) {
				if (!callback(val, key)) return false;
			}
			return true;
		}

		return this.every(operatorForWhere(keyOrCallback as string, operator, value));
	}

	/**
	 * Alias for the "contains" method.
	 */
	some(keyOrCallback: T | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): boolean {
		return this.contains(keyOrCallback, operator, value);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// CONVERSION METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get the collection of items as a plain array or object (preserving keys).
	 * Returns an array if keys are sequential (0, 1, 2, ...), otherwise returns an object.
	 * Recursively converts nested collections.
	 */
	toArray(): T[] | Record<string, T> {
		const keys = Object.keys(this.items);

		if (keys.length === 0) {
			return [];
		}

		const isSequentialArray = keys.every((k, i) => k === String(i));

		if (isSequentialArray) {
			const result: unknown[] = [];
			for (const key in this.items) {
				const val = this.items[key];
				result.push(val instanceof Collection ? val.toArray() : val);
			}
			return result as T[];
		}

		const result: Record<string, unknown> = {};
		for (const key in this.items) {
			const val = this.items[key];
			result[key] = val instanceof Collection ? val.toArray() : val;
		}
		return result as Record<string, T>;
	}

	/**
	 * Get the collection of items as JSON.
	 */
	toJson(_options?: number): string {
		return JSON.stringify(this.all());
	}

	/**
	 * Collect the values into a collection.
	 */
	collect(): Collection<T> {
		return new Collection(this.all());
	}

	/**
	 * Get a base Support collection instance from this collection.
	 */
	toBase(): Collection<T> {
		return new Collection(this);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// UTILITY METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Pass the collection to the given callback and return the result.
	 */
	pipe<U>(callback: (collection: this) => U): U {
		return callback(this);
	}

	/**
	 * Pass the collection into a new class.
	 */
	pipeInto<U>(classType: new (collection: this) => U): U {
		return new classType(this);
	}

	/**
	 * Pass the collection through a series of callable pipes and return the result.
	 */
	pipeThrough<R>(callbacks: ((value: unknown) => unknown)[]): R {
		let result: unknown = this;
		for (const callback of callbacks) {
			result = callback(result);
		}
		return result as R;
	}

	/**
	 * Pass the collection to the given callback and then return it.
	 * If no callback provided, just returns self (useful for chaining).
	 */
	tap(callback?: (collection: this) => void): this {
		if (callback) {
			callback(this);
		}
		return this;
	}

	/**
	 * Dump the items.
	 */
	dump(...args: unknown[]): this {
		console.log(this.all(), ...args);
		return this;
	}

	/**
	 * Dump the items and end the script.
	 */
	dd(...args: unknown[]): never {
		console.log(this.all(), ...args);
		throw new Error('dd() called');
	}

	/**
	 * Ensure that every item in the collection is of the expected type.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Constructor types require any for generic instantiation support
	ensure(type: string | (new (...args: any[]) => any) | (string | (new (...args: any[]) => any))[]): this {
		const allowedTypes = Array.isArray(type) ? type : [type];

		this.each((item, key) => {
			const itemType = typeof item;

			for (const allowedType of allowedTypes) {
				if (typeof allowedType === 'string') {
					if (itemType === allowedType) return;
					if (allowedType === 'null' && item === null) return;
					if (allowedType === 'array' && Array.isArray(item)) return;
				} else if (item instanceof allowedType) {
					return;
				}
			}

			throw new UnexpectedValueException(
				`Collection should only include [${allowedTypes.map((t) => (typeof t === 'string' ? t : t.name)).join(', ')}] items, but '${itemType}' found at key '${key}'.`,
			);
		});

		return this;
	}

	/**
	 * "Paginate" the collection by slicing it into a smaller collection.
	 */
	forPage(page: number, perPage: number): Collection<T> {
		const offset = Math.max(0, (page - 1) * perPage);
		return this.slice(offset, perPage);
	}

	/**
	 * Get a single key's value from the first matching item in the collection.
	 */
	value<K extends keyof T>(key: K, defaultValue?: T[K] | (() => T[K])): T[K] | undefined {
		const item = this.first((target) => dataGet(target, key as string) !== undefined);
		if (item === undefined) {
			return typeof defaultValue === 'function' ? (defaultValue as () => T[K])() : defaultValue;
		}
		return dataGet(item, key as string) as T[K];
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// CONDITIONAL METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Apply the callback when value is truthy.
	 */
	when<V, U = this>(
		value: V | ((self: this) => V),
		callback?: (self: this, value: V) => U,
		defaultCallback?: (self: this, value: V) => U,
	): this | U {
		const resolvedValue = typeof value === 'function' ? (value as (self: this) => V)(this) : value;

		if (resolvedValue) {
			return callback ? callback(this, resolvedValue) : this;
		}
		return defaultCallback ? defaultCallback(this, resolvedValue) : this;
	}

	/**
	 * Apply the callback when value is falsy.
	 */
	unless<V, U = this>(
		value: V | ((self: this) => V),
		callback?: (self: this, value: V) => U,
		defaultCallback?: (self: this, value: V) => U,
	): this | U {
		const resolvedValue = typeof value === 'function' ? (value as (self: this) => V)(this) : value;

		if (!resolvedValue) {
			return callback ? callback(this, resolvedValue) : this;
		}
		return defaultCallback ? defaultCallback(this, resolvedValue) : this;
	}

	/**
	 * Apply the callback if the collection is empty.
	 */
	whenEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.when(this.isEmpty(), callback, defaultCallback);
	}

	/**
	 * Apply the callback if the collection is not empty.
	 */
	whenNotEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.when(this.isNotEmpty(), callback, defaultCallback);
	}

	/**
	 * Apply the callback unless the collection is empty.
	 */
	unlessEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.whenNotEmpty(callback, defaultCallback);
	}

	/**
	 * Apply the callback unless the collection is not empty.
	 */
	unlessNotEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.whenEmpty(callback, defaultCallback);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// ARRAY ACCESS (for bracket notation)
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Determine if an item exists at an offset.
	 */
	offsetExists(key: string | number): boolean {
		return String(key) in this.items;
	}

	/**
	 * Get an item at a given offset.
	 */
	offsetGet(key: string | number): T {
		return this.items[String(key)];
	}

	/**
	 * Set the item at a given offset.
	 */
	offsetSet(key: string | number | null, value: T): void {
		if (key === null) {
			this.push(value);
		} else {
			this.items[String(key)] = value;
		}
	}

	/**
	 * Unset the item at a given offset.
	 */
	offsetUnset(key: string | number): void {
		delete this.items[String(key)];
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// ITERATOR
	// ═══════════════════════════════════════════════════════════════════════════

	[Symbol.iterator](): Iterator<T> {
		return Object.values(this.items)[Symbol.iterator]();
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// HELPER FOR JOINED ITERATION
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Attach a related collection for joined iteration.
	 * Use with .map() to receive both item and related entries.
	 */
	with<U>(related: ProxiedCollection<U, CollectionKind>): WithCollection<T, U> {
		return new WithCollection(this as unknown as ProxiedCollection<T>, related);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// WITH COLLECTION HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Collection with an attached related collection for joined iteration.
 */
export class WithCollection<T, U, CK extends CollectionKind = 'array'> {
	constructor(
		private readonly primary: ProxiedCollection<T, CK>,
		private readonly related: ProxiedCollection<U, CollectionKind>,
	) {}

	/**
	 * Map over items, receiving both item and related entries.
	 * Related entries are filtered where value equals the current item.
	 */
	map<R>(fn: (item: T, related: Collection<U, CollectionKind>) => R): Collection<R, CK> {
		return this.primary.map((item) => {
			// Filter related where value equals current item (cast for comparison)
			const filtered = this.related.filter((value) => (value as unknown) === (item as unknown));
			return fn(item, filtered);
		});
	}

	/**
	 * Map over items with key, receiving both item, key, and related entries.
	 */
	mapWithKey<R>(fn: (item: T, key: string, related: Collection<U, CollectionKind>) => R): Collection<R, CK> {
		return this.primary.map((item, key) => {
			const filtered = this.related.filter((value) => (value as unknown) === (item as unknown));
			return fn(item, key, filtered);
		});
	}

	/**
	 * Each over items, receiving both item and related entries.
	 */
	each(fn: (item: T, related: Collection<U, CollectionKind>) => unknown): this {
		this.primary.each((item) => {
			const filtered = this.related.filter((value) => (value as unknown) === (item as unknown));
			return fn(item, filtered);
		});
		return this;
	}

	/**
	 * Get all mapped results as array.
	 */
	all(): CK extends 'array' ? T[] : Record<string, T> {
		return this.primary.all();
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new collection from an array or object.
 *
 * Supports Laravel's higher-order messaging:
 * - `collect(users).map.name` - Extract property from each item
 * - `collect(users).filter.active` - Filter by truthy property
 * - `collect(users).sum.age` - Sum a numeric property
 * - `collect(users).each.save()` - Call method on each item
 *
 * @example
 * ```ts
 * collect([1, 2, 3]).filter(n => n > 1).all()  // [2, 3]
 * collect({ a: 1, b: 2 }).keys().all()         // ['a', 'b']
 * collect(votes).countBy().all()               // { Pizza: 3, Tacos: 2 }
 *
 * // Higher-order messaging (Laravel-style)
 * collect(users).map.name                      // Collection<string>
 * collect(users).filter.active                 // Collection<User>
 * collect(users).sum.age                       // number
 * ```
 */
export function collect<T>(items: T[]): ProxiedCollection<T, 'array'>;
export function collect<T>(items: Record<string, T>): ProxiedCollection<T, 'assoc'>;
export function collect<T>(items: Collection<T, CollectionKind>): ProxiedCollection<T, 'array'>;
export function collect<T>(): ProxiedCollection<T, 'array'>;
export function collect<T>(items: Items<T> | Collection<T, CollectionKind> = []): ProxiedCollection<T, CollectionKind> {
	const isAssoc = !Array.isArray(items) && !(items instanceof Collection);
	return wrapCollectionWithProxy(new Collection(items, isAssoc)) as ProxiedCollection<T, CollectionKind>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type for state where arrays/objects are wrapped as Collections.
 */
export type CollectedState<T> = {
	[K in keyof T]: T[K] extends (infer U)[]
		? Collection<U>
		: T[K] extends Record<string, infer V>
			? Collection<V>
			: T[K];
};

/**
 * Wrap state arrays/objects as Collections automatically.
 * Used by modal renderers to provide pre-collected state.
 *
 * @example
 * ```ts
 * const state = { options: ['A', 'B'], votes: { u1: 'A' }, title: 'Poll' };
 * const wrapped = collectState(state);
 * // wrapped.options is Collection<string>
 * // wrapped.votes is Collection<string>
 * // wrapped.title is still 'Poll'
 * ```
 */
export function collectState<T extends Record<string, unknown>>(state: T): CollectedState<T> {
	const wrapped: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(state)) {
		if (key.startsWith('_')) {
			// Skip internal properties like _view
			wrapped[key] = value;
		} else if (Array.isArray(value)) {
			wrapped[key] = new Collection(value);
		} else if (value !== null && typeof value === 'object') {
			wrapped[key] = new Collection(value as Record<string, unknown>);
		} else {
			wrapped[key] = value;
		}
	}

	return wrapped as CollectedState<T>;
}

/**
 * Convert Collection to array, or return array as-is.
 * Use this in framework functions that accept both arrays and Collections.
 *
 * @example
 * ```ts
 * export const select = (stateKey: string, options: readonly string[] | CollectionLike<string>) => {
 *   const opts = toArray(options);
 *   // opts is always readonly string[]
 * }
 * ```
 */
export function toArray<T>(input: readonly T[] | CollectionParam<T>): readonly T[] {
	// Use 'in' operator to check for CollectionParam
	if ('toArray' in input && typeof input.toArray === 'function') {
		return input.toArray();
	}
	return input as readonly T[];
}
