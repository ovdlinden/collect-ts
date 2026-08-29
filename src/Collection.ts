/** @see https://laravel.com/docs/collections */

import { arrayContains, arrayFilterByKey, arrayFilterBySet, arrayFindByKey, arrayMapByKey } from './arrayUtils.js';
import {
	InvalidArgumentException,
	ItemNotFoundException,
	MultipleItemsFoundException,
	UnexpectedValueException,
} from './exceptions';
import {
	asyncLazy as asyncLazyFn,
	asyncStatics,
	lazy as lazyFn,
	lazyStatics,
	type ProxiedAsyncLazyCollection,
	type ProxiedLazyCollection,
} from './LazyCollection.js';

type Items<T> = Record<string, T> | T[];

type CollectInput<T> = T[] | Record<string, T> | Iterable<T> | (() => Generator<T>);

function isPlainObject<T>(value: unknown): value is Record<string, T> {
	if (value === null || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === null || proto === Object.prototype;
}

/** Brand symbol for identifying collection-like objects */
export const COLLECTION_BRAND = Symbol.for('collect-ts.collection');

/** Shared macro registry for Collection */
const collectionMacros: Map<string, (...args: unknown[]) => unknown> = new Map();

/** Type guard for collection-like objects */
export function isCollection(value: unknown): value is CollectionLike<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		COLLECTION_BRAND in value &&
		(value as Record<symbol, unknown>)[COLLECTION_BRAND] === true
	);
}

/**
 * Minimal interface for collection-like objects that support HOM proxy.
 * Uses structural branding for identification.
 */
export interface CollectionLike<T> {
	readonly [COLLECTION_BRAND]: true;
	all(): T[] | Record<string, T>;
	toArray(): T[] | Record<string, T>;
}

/** Internal type for HOM proxy handlers - uses unknown for duck typing */
type AnyCollection = {
	readonly [COLLECTION_BRAND]: true;
	// biome-ignore lint/suspicious/noExplicitAny: duck typing for HOM proxy
	[key: string]: any;
};

/** Collection kind - tracks whether collection is array-based or associative at the type level */
export type CollectionKind = 'array' | 'assoc';

/** Key type based on collection kind - arrays use numeric indices, associative uses string keys */
export type CollectionKey<CK extends CollectionKind> = CK extends 'array' ? number : string;

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
export type Arrayable<T> = T[] | readonly T[] | Iterable<T> | CollectionParam<T> | Collection<T, CollectionKind>;

/**
 * Any collection-compatible input including associative objects.
 * Use for methods that accept both arrays and key-value objects.
 */
export type Collectable<T> = Arrayable<T> | Record<string, T>;

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

/** Operator types for where clauses (Laravel uses loose comparison; use whereStrict() for strict) */
export type WhereOperator = '=' | '==' | '!=' | '<>' | '<' | '>' | '<=' | '>=';

/** Value retriever - can be a key string or callback function */
export type ValueRetriever<T, R> = string | ((value: T, key: string | number) => R);

/** Unwrap one level of array or Collection nesting. Returns T unchanged if not nested. */
export type Collapse<T> = T extends readonly (infer U)[]
	? U
	: T extends ProxiedCollection<infer U, CollectionKind>
		? U
		: T extends Collection<infer U, CollectionKind>
			? U
			: T;

/** Recursive flatten to depth D. Same pattern as lib.es2019.array.d.ts FlatArray. */
export type FlattenDepth<T, D extends number> = {
	done: T;
	recur: T extends readonly (infer U)[]
		? FlattenDepth<U, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][D]>
		: T extends ProxiedCollection<infer U, CollectionKind>
			? FlattenDepth<U, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][D]>
			: T extends Collection<infer U, CollectionKind>
				? FlattenDepth<U, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][D]>
				: T;
}[D extends -1 ? 'done' : 'recur'];

type NonNullableItem<T> = T extends null | undefined ? never : T;

type PropertyKeys<T> =
	NonNullableItem<T> extends never
		? never
		: {
				// biome-ignore lint/suspicious/noExplicitAny: conditional type matching
				[K in keyof NonNullableItem<T>]: NonNullableItem<T>[K] extends (...args: any[]) => any ? never : K;
			}[keyof NonNullableItem<T>];

type MethodKeys<T> =
	NonNullableItem<T> extends never
		? never
		: {
				// biome-ignore lint/suspicious/noExplicitAny: conditional type matching
				[K in keyof NonNullableItem<T>]: NonNullableItem<T>[K] extends (...args: any[]) => any ? K : never;
			}[keyof NonNullableItem<T>];

type HigherOrderMapProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: ProxiedCollection<NonNullableItem<T>[K], CK>;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => infer R
		? (...args: A) => ProxiedCollection<R, CK>
		: never;
};

type HigherOrderFilterProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: ProxiedCollection<T, CK>;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => ProxiedCollection<T, CK>
		: never;
};

type HigherOrderAggregateProxy<T, R> = {
	readonly [K in PropertyKeys<T>]: R;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => R
		: never;
};

type HigherOrderEachProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: ProxiedCollection<T, CK>;
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => ProxiedCollection<T, CK>
		: never;
};

type CallableHigherOrderMap<T, CK extends CollectionKind> = (<U>(
	callback: (value: T, key: CollectionKey<CK>) => U,
) => ProxiedCollection<U, CK>) & {
	call<U>(thisArg: unknown, callback: (value: T, key: CollectionKey<CK>) => U): ProxiedCollection<U, CK>;
	apply<U>(thisArg: unknown, args: [(value: T, key: CollectionKey<CK>) => U]): ProxiedCollection<U, CK>;
	bind(thisArg: unknown): <U>(callback: (value: T, key: CollectionKey<CK>) => U) => ProxiedCollection<U, CK>;
} & ([T] extends [never] ? object : HigherOrderMapProxy<T, CK>);

type CallableHigherOrderFilter<T, CK extends CollectionKind> = ((
	callback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
) => ProxiedCollection<T, CK>) & {
	call(
		thisArg: unknown,
		callback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
	): ProxiedCollection<T, CK>;
	apply(
		thisArg: unknown,
		args: [((value: T, key: CollectionKey<CK>) => unknown) | keyof T] | [],
	): ProxiedCollection<T, CK>;
	bind(
		thisArg: unknown,
	): (callback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T) => ProxiedCollection<T, CK>;
} & ([T] extends [never] ? object : HigherOrderFilterProxy<T, CK>);

type CallableHigherOrderAggregate<T, R, CK extends CollectionKind> = ((
	keyOrCallback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
) => R) & {
	call(thisArg: unknown, keyOrCallback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T): R;
	apply(thisArg: unknown, args: [((value: T, key: CollectionKey<CK>) => unknown) | keyof T] | []): R;
	bind(thisArg: unknown): (keyOrCallback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T) => R;
} & ([T] extends [never] ? object : HigherOrderAggregateProxy<T, R>);

type CallableHigherOrderEach<T, CK extends CollectionKind> = ((
	callback: (value: T, key: CollectionKey<CK>) => undefined | false,
) => ProxiedCollection<T, CK>) & {
	call(thisArg: unknown, callback: (value: T, key: CollectionKey<CK>) => undefined | false): ProxiedCollection<T, CK>;
	apply(thisArg: unknown, args: [(value: T, key: CollectionKey<CK>) => undefined | false]): ProxiedCollection<T, CK>;
	bind(
		thisArg: unknown,
	): (callback: (value: T, key: CollectionKey<CK>) => undefined | false) => ProxiedCollection<T, CK>;
} & ([T] extends [never] ? object : HigherOrderEachProxy<T, CK>);

type HigherOrderFirstProxy<T> = {
	readonly [K in PropertyKeys<T>]: T | undefined;
};

type CallableHigherOrderFirst<T, CK extends CollectionKind> = ((
	callback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
	defaultValue?: T,
) => T | undefined) & {
	call(
		thisArg: unknown,
		callback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
		defaultValue?: T,
	): T | undefined;
	apply(thisArg: unknown, args: [((value: T, key: CollectionKey<CK>) => unknown) | keyof T, T?] | []): T | undefined;
	bind(
		thisArg: unknown,
	): (callback?: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T, defaultValue?: T) => T | undefined;
} & ([T] extends [never] ? object : HigherOrderFirstProxy<T>);

type HigherOrderPartitionProxy<T, CK extends CollectionKind> = {
	readonly [K in PropertyKeys<T>]: [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
} & {
	readonly [K in MethodKeys<T>]: NonNullableItem<T>[K] extends (...args: infer A) => unknown
		? (...args: A) => [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>]
		: never;
};

type CallableHigherOrderPartition<T, CK extends CollectionKind> = ((
	callback: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
) => [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>]) & {
	call(
		thisArg: unknown,
		callback: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
	): [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
	apply(
		thisArg: unknown,
		args: [((value: T, key: CollectionKey<CK>) => unknown) | keyof T],
	): [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
	bind(
		thisArg: unknown,
	): (
		callback: ((value: T, key: CollectionKey<CK>) => unknown) | keyof T,
	) => [ProxiedCollection<T, CK>, ProxiedCollection<T, CK>];
} & ([T] extends [never] ? object : HigherOrderPartitionProxy<T, CK>);

/**
 * Interface for user-defined macros. Extend via module augmentation:
 * @example
 * ```ts
 * declare module 'collect-ts' {
 *   interface CollectionMacros<T> {
 *     toUpper: T extends string ? () => ProxiedCollection<string> : never;
 *   }
 * }
 * ```
 */
// Extended via module augmentation - see README for macro usage
export interface CollectionMacros<_T> {
	// Intentionally empty - extend via module augmentation
	readonly [key: string]: ((...args: never[]) => unknown) | undefined;
}

/**
 * Collection with higher-order messaging. Methods like map, filter work as
 * both callable methods (users.map(fn)) and property accessors (users.map.name).
 */
export type ProxiedCollection<T, CK extends CollectionKind = 'array'> = Collection<T, CK> &
	CollectionParam<T> &
	CollectionMacros<T> & {
		map: CallableHigherOrderMap<T, CK>;
		filter: CallableHigherOrderFilter<T, CK>;
		reject: CallableHigherOrderFilter<T, CK>;
		each: CallableHigherOrderEach<T, CK>;
		sum: CallableHigherOrderAggregate<T, number, CK>;
		avg: CallableHigherOrderAggregate<T, number | null, CK>;
		min: CallableHigherOrderAggregate<T, number | null, CK>;
		max: CallableHigherOrderAggregate<T, number | null, CK>;
		sortBy: CallableHigherOrderFilter<T, CK>;
		sortByDesc: CallableHigherOrderFilter<T, CK>;
		groupBy: CallableHigherOrderMap<T, CK>;
		keyBy: CallableHigherOrderFilter<T, CK>;
		unique: CallableHigherOrderFilter<T, CK>;
		flatMap: CallableHigherOrderMap<T, CK>;
		contains: CallableHigherOrderAggregate<T, boolean, CK>;
		every: CallableHigherOrderAggregate<T, boolean, CK>;
		some: CallableHigherOrderAggregate<T, boolean, CK>;
		doesntContain: CallableHigherOrderAggregate<T, boolean, CK>;
		partition: CallableHigherOrderPartition<T, CK>;
		first: CallableHigherOrderFirst<T, CK>;
		last: CallableHigherOrderFirst<T, CK>;
		takeWhile: CallableHigherOrderFilter<T, CK>;
		takeUntil: CallableHigherOrderFilter<T, CK>;
		skipWhile: CallableHigherOrderFilter<T, CK>;
		skipUntil: CallableHigherOrderFilter<T, CK>;
		average: CallableHigherOrderAggregate<T, number | null, CK>;
	};

/** @deprecated Use ProxiedCollection<T, 'array'> instead */
export type ProxiedArrayCollection<T> = ProxiedCollection<T, 'array'>;

export function dataGet(target: unknown, key: string | null): unknown {
	if (key === null) return target;
	if (typeof target !== 'object' || target === null) return undefined;
	const obj = target as Record<string, unknown>;
	if (key in obj) return obj[key];
	const parts = key.split('.');
	let value: unknown = target;
	for (const part of parts) {
		if (typeof value !== 'object' || value === null) return undefined;
		value = (value as Record<string, unknown>)[part];
	}
	return value;
}

export function useAsCallable(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === 'function';
}

export function valueRetriever<T, R>(
	keyOrCallback: ValueRetriever<T, R> | null | undefined,
): (value: T, key: string | number) => R {
	if (keyOrCallback === null || keyOrCallback === undefined) {
		return (value: T) => value as unknown as R;
	}
	if (useAsCallable(keyOrCallback)) {
		return keyOrCallback as (value: T, key: string | number) => R;
	}
	return (value: T) => dataGet(value, keyOrCallback as string) as R;
}

export function operatorForWhere<T>(
	key: string | ((value: T, key: string | number) => boolean),
	operator?: WhereOperator | unknown,
	value?: unknown,
): (value: T, key: string | number) => boolean {
	if (useAsCallable(key)) {
		return key as (value: T, key: string | number) => boolean;
	}

	let op: WhereOperator = '=';
	let compareValue: unknown = operator;

	if (value !== undefined) {
		op = operator as WhereOperator;
		compareValue = value;
	}

	// Loose comparison mirrors Laravel's where(). Use whereStrict() for strict comparison.
	return (item: T) => {
		const retrieved = dataGet(item, key as string);

		switch (op) {
			case '=':
			case '==':
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				return retrieved == compareValue;
			case '!=':
			case '<>':
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
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
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				return retrieved == compareValue;
		}
	};
}

type HigherOrderHandler<T> = (collection: AnyCollection, callback: (item: T) => unknown) => unknown;

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

const BYPASS_PROPERTIES = new Set<string | symbol>([
	'then',
	'catch',
	'finally', // Promise detection
	'constructor',
	'prototype',
	'toJSON',
	'inspect',
	'nodeType',
	'asymmetricMatch',
	'$$typeof',
]);

// biome-ignore lint/complexity/noStaticOnlyClass: namespace for typed proxy creation
class HigherOrderCollectionProxy {
	private static createHandlers<T>(): Record<string, HigherOrderHandler<T>> {
		return {
			map: (c, cb) => c.map(cb),
			flatMap: (c, cb) => c.flatMap(cb as (item: T) => unknown[]),
			filter: (c, cb) => c.filter((item: T) => Boolean(cb(item))),
			reject: (c, cb) => c.reject((item: T) => Boolean(cb(item))),
			sortBy: (c, cb) => c.sortBy(cb as ValueRetriever<T, unknown>),
			sortByDesc: (c, cb) => c.sortByDesc(cb as ValueRetriever<T, unknown>),
			groupBy: (c, cb) => c.groupBy(cb as ValueRetriever<T, string | string[]>),
			keyBy: (c, cb) => c.keyBy(cb as ValueRetriever<T, string>),
			unique: (c, cb) => c.unique(cb as ValueRetriever<T, unknown>),
			sum: (c, cb) => c.sum(cb as ValueRetriever<T, number>),
			avg: (c, cb) => c.avg(cb as ValueRetriever<T, number>),
			average: (c, cb) => c.avg(cb as ValueRetriever<T, number>),
			min: (c, cb) => c.min(cb as ValueRetriever<T, number>),
			max: (c, cb) => c.max(cb as ValueRetriever<T, number>),
			contains: (c, cb) => c.contains((item: T) => Boolean(cb(item))),
			some: (c, cb) => c.contains((item: T) => Boolean(cb(item))),
			every: (c, cb) => c.every((item: T) => Boolean(cb(item))),
			doesntContain: (c, cb) => !c.contains((item: T) => Boolean(cb(item))),
			each: (c, cb) => {
				c.each(cb);
				return c;
			},
			first: (c, cb) => c.first((item: T) => Boolean(cb(item))),
			last: (c, cb) => c.last((item: T) => Boolean(cb(item))),
			partition: (c, cb) => c.partition((item: T) => Boolean(cb(item))),
			skipUntil: (c, cb) => c.skipUntil((item: T) => Boolean(cb(item))),
			skipWhile: (c, cb) => c.skipWhile((item: T) => Boolean(cb(item))),
			takeUntil: (c, cb) => c.takeUntil((item: T) => Boolean(cb(item))),
			takeWhile: (c, cb) => c.takeWhile((item: T) => Boolean(cb(item))),
		};
	}

	/** @internal */
	static create<T, TReturn>(
		collection: AnyCollection,
		method: ProxyableMethod,
		wrapResult?: (c: AnyCollection) => unknown,
	): TReturn {
		const handlers = HigherOrderCollectionProxy.createHandlers<T>();
		const handler = handlers[method];

		// Use an object as the proxy target (the Proxy traps handle all operations)
		const proxyTarget = {} as object;

		return new Proxy(proxyTarget, {
			get: (_, property: string | symbol) => {
				if (typeof property === 'symbol' || BYPASS_PROPERTIES.has(property)) {
					return undefined;
				}

				const propertyCallback = (item: T) => {
					if (item == null) return undefined;
					return (item as Record<string, unknown>)[property];
				};

				const propertyResult = handler(collection, propertyCallback);

				if (
					propertyResult === null ||
					propertyResult === undefined ||
					typeof propertyResult === 'number' ||
					typeof propertyResult === 'boolean' ||
					typeof propertyResult === 'string'
				) {
					return propertyResult;
				}

				const wrappedResult = isCollection(propertyResult) && wrapResult ? wrapResult(propertyResult) : propertyResult;

				const methodInvoker = (...args: unknown[]) => {
					const methodResult = handler(collection, (item: T) => {
						if (item == null) return undefined;
						const member = (item as Record<string, unknown>)[property];
						if (typeof member === 'function') {
							return (member as (...a: unknown[]) => unknown).apply(item, args);
						}
						return member;
					});
					if (isCollection(methodResult) && wrapResult) {
						return wrapResult(methodResult);
					}
					return methodResult;
				};

				return new Proxy(methodInvoker, {
					get: (_, resultProp: string | symbol) => {
						if (resultProp === Symbol.toPrimitive) {
							return () => wrappedResult;
						}
						if (resultProp === 'valueOf') {
							return () => wrappedResult;
						}
						if (resultProp === 'toString') {
							return () => String(wrappedResult);
						}
						if (typeof resultProp === 'symbol') {
							return (wrappedResult as Record<symbol, unknown>)?.[resultProp];
						}
						return (wrappedResult as Record<string, unknown>)?.[resultProp];
					},

					apply: (target, _, args) => {
						return target(...args);
					},

					getPrototypeOf: () => {
						return Object.getPrototypeOf(wrappedResult);
					},

					has: (_, prop) => {
						return prop in (wrappedResult as object);
					},
				});
			},
		}) as TReturn;
	}
}

type MacroGetter = (name: string) => ((...args: unknown[]) => unknown) | undefined;

/** @internal Generic proxy wrapper for any CollectionLike */
export function wrapWithProxy<T, C extends CollectionLike<T>>(collection: C, getMacro: MacroGetter): C {
	const wrapResult = (c: AnyCollection) => wrapWithProxy(c as C, getMacro);

	return new Proxy(collection, {
		get(target, prop: string | symbol, receiver) {
			if (typeof prop === 'symbol') {
				const value = Reflect.get(target, prop, target);
				if (typeof value === 'function') {
					return value.bind(target);
				}
				return value;
			}
			if (BYPASS_PROPERTIES.has(prop)) {
				return Reflect.get(target, prop, receiver);
			}

			const macro = getMacro(prop as string);
			if (macro) {
				return function (this: C, ...args: unknown[]) {
					const result = macro.apply(target, args);
					if (isCollection(result)) {
						return wrapResult(result as AnyCollection);
					}
					return result;
				};
			}

			const value = Reflect.get(target, prop, target);

			if (!PROXYABLE_METHODS.has(prop as ProxyableMethod)) {
				if (typeof value === 'function') {
					return function (this: C, ...args: unknown[]) {
						const result = value.apply(target, args);
						if (result === target) {
							return receiver;
						}
						if (isCollection(result)) {
							return wrapResult(result as AnyCollection);
						}
						return result;
					};
				}
				return value;
			}

			const higherOrderProxy = HigherOrderCollectionProxy.create<T, Record<string, unknown>>(
				target as AnyCollection,
				prop as ProxyableMethod,
				wrapResult,
			);

			const callableProxy = function (this: C, ...args: unknown[]) {
				const result = (value as (...a: unknown[]) => unknown).apply(target, args);
				if (isCollection(result)) {
					return wrapResult(result as AnyCollection);
				}
				return result;
			};

			return new Proxy(callableProxy, {
				get(_, accessProp: string | symbol) {
					if (typeof accessProp === 'symbol') {
						return undefined;
					}

					if (accessProp === 'length') return (value as (...a: unknown[]) => unknown).length;
					if (accessProp === 'call') return Function.prototype.call.bind(callableProxy);
					if (accessProp === 'apply') return Function.prototype.apply.bind(callableProxy);
					if (accessProp === 'bind') {
						return Function.prototype.bind.bind(callableProxy);
					}

					return (higherOrderProxy as Record<string, unknown>)[accessProp];
				},

				apply(_target, _thisArg, args) {
					const result = (value as (...a: unknown[]) => unknown).apply(target, args);
					if (isCollection(result)) {
						return wrapResult(result as AnyCollection);
					}
					return result;
				},
			});
		},
	}) as C;
}

/** @internal Wraps Collection with HOM proxy */
function wrapCollectionWithProxy<T, CK extends CollectionKind>(
	collection: Collection<T, CK>,
): ProxiedCollection<T, CK> {
	return wrapWithProxy(collection, Collection.getMacro.bind(Collection)) as ProxiedCollection<T, CK>;
}

function arrayableToArray<T>(items: Arrayable<T>): T[] {
	if (Array.isArray(items)) {
		return items as T[];
	}
	if (items instanceof Collection) {
		return Object.values(items.all());
	}
	if ('toArray' in items && typeof (items as CollectionParam<T>).toArray === 'function') {
		return (items as CollectionParam<T>).toArray() as T[];
	}
	return Array.from(items as Iterable<T>);
}

function collectableToRecord<T>(items: Collectable<T>): Record<string, T> {
	if (items instanceof Collection) {
		return items.all() as Record<string, T>;
	}
	if ('all' in items && typeof (items as CollectionParam<T>).all === 'function') {
		return (items as CollectionParam<T>).all() as Record<string, T>;
	}
	if (Array.isArray(items)) {
		return Object.fromEntries(items.map((v, i) => [String(i), v])) as Record<string, T>;
	}
	if (Symbol.iterator in items) {
		return Object.fromEntries(Array.from(items as Iterable<T>).map((v, i) => [String(i), v])) as Record<string, T>;
	}
	return items as Record<string, T>;
}

export class Collection<T, CK extends CollectionKind = 'array'> {
	readonly [COLLECTION_BRAND] = true as const;

	private _items: Record<string, T> | null = null;
	private _lazyItems = false;
	protected isAssociative: boolean;

	private _nextNumericKey: number | null = null;
	#arrayItems: T[] | null = null;
	#source: Iterable<T> | (() => Generator<T>) | null = null;
	#sourceTransferred = false;

	/** Lazy getter: materializes Record from #arrayItems on first access */
	protected get items(): Record<string, T> {
		if (this._lazyItems && this.#arrayItems) {
			this._items = Object.fromEntries(this.#arrayItems.map((v, i) => [String(i), v]));
			this._lazyItems = false;
		}
		if (this._items !== null) {
			return this._items;
		}
		if (this.#sourceTransferred) {
			throw new Error('Collection source was transferred to lazy(). Use the LazyCollection instead.');
		}
		if (this.#source !== null) {
			const source = this.#source;
			this.#source = null;
			this.#arrayItems = [...this.iterateSource(source)];
			this._items = Object.fromEntries(this.#arrayItems.map((v, i) => [String(i), v]));
			this._lazyItems = false;
			return this._items;
		}
		// Fallback for empty collections
		this._items = {};
		return this._items;
	}

	protected set items(value: Record<string, T>) {
		this._items = value;
		this._lazyItems = false;
	}

	private *iterateSource(source: Iterable<T> | (() => Generator<T>)): Generator<T> {
		if (typeof source === 'function') {
			yield* source();
		} else {
			yield* source;
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: dynamic macro dispatch
	static macro(name: string, fn: (...args: any[]) => any): void {
		collectionMacros.set(name, fn);
	}

	static hasMacro(name: string): boolean {
		return collectionMacros.has(name);
	}

	static flushMacros(): void {
		collectionMacros.clear();
	}

	// biome-ignore lint/suspicious/noExplicitAny: dynamic macro dispatch
	static getMacro(name: string): ((...args: any[]) => any) | undefined {
		return collectionMacros.get(name);
	}

	constructor(items: CollectInput<T> | Collection<T, CollectionKind> = [], isAssociative?: boolean) {
		if (items instanceof Collection) {
			// Try to access private fields directly (fails for Proxied collections)
			let copied = false;
			try {
				// This will throw if items is a Proxy
				this._items = items._items ? { ...items._items } : null;
				this.#arrayItems = items.#arrayItems ? [...items.#arrayItems] : null;
				this._lazyItems = items._lazyItems;
				this.#source = items.#source;
				this.#sourceTransferred = items.#sourceTransferred;
				copied = true;
			} catch {
				// Proxied or subclassed Collection - use public API
			}
			if (!copied) {
				const all = items.all();
				if (Array.isArray(all)) {
					this.#arrayItems = [...all];
					this._lazyItems = true;
				} else {
					this._items = { ...all };
					this.#arrayItems = null;
				}
			}
		} else if (Array.isArray(items) && isAssociative !== true) {
			// Fast path: store array reference directly (no copy - we never mutate)
			this.#arrayItems = items;
			this._lazyItems = true;
		} else if (Array.isArray(items)) {
			this._items = Object.fromEntries(items.map((v, i) => [String(i), v]));
			this.#arrayItems = null;
		} else if (typeof items === 'function') {
			// Generator factory function: store for deferred consumption
			this.#source = items as () => Generator<T>;
		} else if (typeof items === 'object' && items !== null && Symbol.iterator in items) {
			// Iterable (not a plain object): store for deferred consumption
			this.#source = items as Iterable<T>;
		} else if (isPlainObject<T>(items)) {
			this._items = { ...items };
			this.#arrayItems = null;
		} else {
			this._items = {};
			this.#arrayItems = null;
		}

		if (isAssociative !== undefined) {
			this.isAssociative = isAssociative;
		} else if (items instanceof Collection) {
			this.isAssociative = items.isAssociative;
		} else if (Array.isArray(items)) {
			this.isAssociative = false;
		} else if (this.#source !== null) {
			this.isAssociative = false;
		} else {
			this.isAssociative = true;
		}
	}

	protected isArrayBacked(): boolean {
		return this.#arrayItems !== null;
	}

	protected invalidateArrayItems(): void {
		// Materialize items before invalidating (access triggers lazy getter)
		void this.items;
		this.#arrayItems = null;
	}

	protected getNextNumericKey(): number {
		if (this._nextNumericKey === null) {
			const numericKeys = Object.keys(this.items)
				.map(Number)
				.filter((n) => !Number.isNaN(n));
			this._nextNumericKey = numericKeys.length > 0 ? Math.max(...numericKeys) + 1 : 0;
		}
		return this._nextNumericKey;
	}

	protected invalidateNextNumericKey(): void {
		this._nextNumericKey = null;
	}

	/**
	 * The `make` method creates a new collection instance from the given items.
	 * This is equivalent to calling `new Collection()` or the `collect()` helper.
	 *
	 * @param items - Array, object, or existing collection
	 * @returns New collection
	 *
	 * @example
	 * Collection.make([1, 2, 3])
	 * // → Collection [1, 2, 3]
	 *
	 * @example From an object:
	 * Collection.make({ name: 'Taylor', role: 'admin' })
	 * // → Collection { name: 'Taylor', role: 'admin' }
	 *
	 * @see {@link wrap} - wrapping non-collection values
	 * @see {@link empty} - creating an empty collection
	 *
	 * @category Creating
	 */
	static make<U>(items: Items<U> | CollectionParam<U> = []): Collection<U> {
		return new Collection(items as Items<U> | Collection<U>);
	}

	/**
	 * The `wrap` method wraps the given value in a collection when applicable.
	 * Arrays and iterables are converted directly, single values become a
	 * one-element collection, and existing collections pass through unchanged.
	 *
	 * @param value - Value to wrap
	 * @returns Collection containing the value
	 *
	 * @example For an array:
	 * Collection.wrap([1, 2, 3])
	 * // → Collection [1, 2, 3]
	 *
	 * @example For a single value:
	 * Collection.wrap('hello')
	 * // → Collection ['hello']
	 *
	 * @example An existing collection passes through unchanged:
	 * Collection.wrap(collect([1, 2]))
	 * // → Collection [1, 2]
	 *
	 * @see {@link unwrap} - extracting the underlying array
	 * @see {@link make} - creating from items directly
	 *
	 * @category Creating
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
	 * The `unwrap` method returns the underlying array from the given value
	 * when possible. If the value is already an array, it is returned as-is.
	 * If the value is a collection, the underlying array is extracted.
	 *
	 * @param value - Collection or array to unwrap
	 * @returns Plain array
	 *
	 * @example To unwrap a collection:
	 * Collection.unwrap(collect([1, 2, 3]))
	 * // → [1, 2, 3]
	 *
	 * @example If already an array, it passes through:
	 * Collection.unwrap([1, 2, 3])
	 * // → [1, 2, 3]
	 *
	 * @see {@link wrap} - wrapping a value in a collection
	 * @see {@link all} - getting items from an instance
	 *
	 * @category Creating
	 */
	static unwrap<U>(value: U[] | CollectionParam<U>): U[] {
		if (value instanceof Collection) {
			return value.toArray() as U[];
		}
		if (Array.isArray(value)) {
			return value;
		}
		if (typeof value === 'object' && value !== null && 'toArray' in value && typeof value.toArray === 'function') {
			return value.toArray() as U[];
		}
		// Handle other cases (like @ts-expect-error tests with strings)
		return value as unknown as U[];
	}

	/**
	 * The `empty` method creates an empty collection. This is useful when you
	 * need a typed empty collection as a starting point for building up items.
	 *
	 * @returns Empty collection
	 *
	 * @example
	 * Collection.empty()
	 * // → Collection []
	 *
	 * @example For a typed empty collection:
	 * Collection.empty<User>()
	 * // → Collection<User> []
	 *
	 * @see {@link make} - creating with items
	 * @see {@link isEmpty} - checking if a collection is empty
	 *
	 * @category Creating
	 */
	static empty<U>(): Collection<U> {
		return new Collection<U>([]);
	}

	/**
	 * The `range` method creates a collection containing numbers within a specified range.
	 *
	 * Works in both directions: ascending when `from < to`, descending otherwise.
	 *
	 * @param from - Start of range (inclusive)
	 * @param to - End of range (inclusive)
	 * @returns Collection of integers
	 *
	 * @example In ascending order:
	 * Collection.range(1, 5)
	 * // → Collection [1, 2, 3, 4, 5]
	 *
	 * @example In descending order:
	 * Collection.range(5, 1)
	 * // → Collection [5, 4, 3, 2, 1]
	 *
	 * @see {@link times} - Generate by calling a function N times
	 *
	 * @category Transforming
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
	 * The `times` method creates a new collection by invoking the given closure a specified number of times.
	 *
	 * The callback receives 1-based indices (1, 2, 3...). Without a callback,
	 * returns a collection of numbers 1 through N.
	 *
	 * @param number - How many times to call the callback
	 * @param callback - Function receiving the 1-based index
	 * @returns Collection of callback results
	 *
	 * @example You may also pass a callback:
	 * Collection.times(3, i => i * 2)
	 * // → Collection [2, 4, 6]
	 *
	 * @example Without a callback, it returns numbers 1 through N:
	 * Collection.times(3)
	 * // → Collection [1, 2, 3]
	 *
	 * @see {@link range} - Generate a range between two numbers
	 *
	 * @category Transforming
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
	 * The `fromJson` method creates a collection from a JSON string. The string
	 * must be valid JSON representing either an array or an object.
	 *
	 * @param json - Valid JSON array or object string
	 * @returns Collection from parsed JSON
	 *
	 * @example From JSON array:
	 * Collection.fromJson('[1, 2, 3]')
	 * // → Collection [1, 2, 3]
	 *
	 * @example From JSON object:
	 * Collection.fromJson('{"a": 1, "b": 2}')
	 * // → Collection {a: 1, b: 2}
	 *
	 * @see {@link toJson} - converting collection to JSON
	 *
	 * @category Creating
	 */
	static fromJson<U>(json: string): Collection<U> {
		return new Collection(JSON.parse(json));
	}

	/**
	 * The `all` method returns the underlying array or object represented by
	 * the collection. Array-backed collections return an array, while
	 * associative collections return a plain object.
	 *
	 * @returns The raw items
	 *
	 * @example For an array collection:
	 * collect([1, 2, 3]).all()
	 * // → [1, 2, 3]
	 *
	 * @example For an associative collection:
	 * collect({ name: 'Taylor', role: 'admin' }).all()
	 * // → { name: 'Taylor', role: 'admin' }
	 *
	 * @see {@link toArray} - always getting an array
	 * @see {@link unwrap} - Static version
	 *
	 * @category Finding
	 */
	all(): CK extends 'array' ? T[] : Record<string, T> {
		const arr = this.ensureConsumed();
		if (arr) {
			return [...arr] as CK extends 'array' ? T[] : Record<string, T>;
		}
		return (this.isAssociative ? { ...this.items } : Object.values(this.items)) as CK extends 'array'
			? T[]
			: Record<string, T>;
	}

	/**
	 * The `get` method returns the item at a given key. If the key does not
	 * exist, `undefined` is returned. You may optionally pass a default value
	 * as the second argument, or a callback that returns the default.
	 *
	 * @param key - The key to retrieve
	 * @param defaultValue - Value or factory function to return if key not found
	 * @returns The item at the key, or the default value
	 *
	 * @example
	 * collect({ name: 'Taylor', role: 'admin' }).get('name')
	 * // → 'Taylor'
	 *
	 * @example You may pass a default value:
	 * collect({ name: 'Taylor' }).get('role', 'guest')
	 * // → 'guest'
	 *
	 * @example Or pass a callback that returns the default:
	 * collect({ name: 'Taylor' }).get('role', () => computeDefault())
	 * // → result of computeDefault()
	 *
	 * @see {@link getOrPut} - Get or store a default value
	 * @see {@link pull} - Remove and return an item by key
	 *
	 * @category Finding
	 */
	get(key: string | number | null, defaultValue?: T | (() => T)): T | undefined {
		if (this.#arrayItems) {
			const k = key === null ? 0 : Number(key);
			if (k >= 0 && k < this.#arrayItems.length) {
				return this.#arrayItems[k];
			}
			return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
		}
		const k = key === null ? '' : String(key);
		if (k in this.items) {
			return this.items[k];
		}
		return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
	}

	/**
	 * The `getOrPut` method retrieves an item by key. If the key does not exist,
	 * the default value is stored in the collection and returned. This is useful
	 * for lazily populating collection values.
	 *
	 * @param key - The key to retrieve or create
	 * @param value - Value or factory function to store if key not found
	 * @returns The existing item or the newly stored default
	 *
	 * @example
	 * const data = collect({ a: 1 })
	 * data.getOrPut('b', 2)
	 * // → 2
	 * data.all()
	 * // → { a: 1, b: 2 }
	 *
	 * @example You may also pass a factory function:
	 * data.getOrPut('expensive', () => computeExpensiveValue())
	 * // → computed value (only computed if key missing)
	 *
	 * @see {@link get} - Get without storing a default
	 * @see {@link put} - Store a value at a key
	 *
	 * @category Finding
	 */
	getOrPut(key: string | number | null, value: T | (() => T) | null): T {
		const k = key === null ? '' : String(key);
		if (k in this.items) {
			return this.items[k];
		}
		this.invalidateArrayItems();
		const resolvedValue = (typeof value === 'function' ? (value as () => T)() : value) as T;
		this.items[k] = resolvedValue;
		return resolvedValue;
	}

	/**
	 * The `first` method returns the first element in the collection that passes a given truth test.
	 *
	 * You may also call the method with no arguments to get the first element. If the collection
	 * is empty, the default value or undefined is returned.
	 *
	 * @param callback - Optional function to test each item
	 * @param defaultValue - Value to return if no item found (can be a factory function)
	 * @returns The first matching item, or undefined/default if not found
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .first()
	 * // → 1
	 *
	 * @example You may also pass a callback:
	 * collect([1, 2, 3, 4])
	 *     .first(n => n > 2)
	 * // → 3
	 *
	 * @example You may also pass a default:
	 * collect([])
	 *     .first(null, 'default')
	 * // → 'default'
	 *
	 * @see {@link last} - Get the last item instead
	 * @see {@link firstOrFail} - throwing when no item found
	 * @see {@link sole} - Get the only item, throws if not exactly one
	 * @see {@link firstWhere} - Find by key/value pair
	 *
	 * @category Finding
	 */
	first<S extends T>(callback: (value: T, key: string) => value is S): S | undefined;
	first<S extends T, D>(callback: (value: T, key: string) => value is S, defaultValue: D | (() => D)): S | D;
	first(callback?: ((value: T, key: string) => boolean) | null): T | undefined;
	first<D>(callback: ((value: T, key: string) => boolean) | null | undefined, defaultValue: D | (() => D)): T | D;
	first<D = undefined>(
		callback?: ((value: T, key: string) => boolean) | null,
		defaultValue?: D | (() => D),
	): T | D | undefined {
		if (this.#arrayItems) {
			if (!callback) {
				if (this.#arrayItems.length > 0) return this.#arrayItems[0];
				return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
			}
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (callback(this.#arrayItems[i], String(i))) return this.#arrayItems[i];
			}
			return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
		}
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
	 * The `last` method returns the last element in the collection that passes a given truth test.
	 *
	 * You may also call the method with no arguments to get the last element. If the collection
	 * is empty, the default value or undefined is returned.
	 *
	 * @param callback - Optional function to test each item
	 * @param defaultValue - Value to return if no item found (can be a factory function)
	 * @returns The last matching item, or undefined/default if not found
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .last()
	 * // → 3
	 *
	 * @example You may also pass a callback:
	 * collect([1, 2, 3, 4])
	 *     .last(n => n < 3)
	 * // → 2
	 *
	 * @see {@link first} - Get the first item instead
	 * @see {@link pop} - Remove and return the last item
	 *
	 * @category Finding
	 */
	last<S extends T>(callback: (value: T, key: string) => value is S): S | undefined;
	last<S extends T, D>(callback: (value: T, key: string) => value is S, defaultValue: D | (() => D)): S | D;
	last(callback?: ((value: T, key: string) => boolean) | null): T | undefined;
	last<D>(callback: ((value: T, key: string) => boolean) | null | undefined, defaultValue: D | (() => D)): T | D;
	last<D = undefined>(
		callback?: ((value: T, key: string) => boolean) | null,
		defaultValue?: D | (() => D),
	): T | D | undefined {
		if (this.#arrayItems) {
			if (!callback) {
				if (this.#arrayItems.length > 0) return this.#arrayItems[this.#arrayItems.length - 1];
				return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
			}
			for (let i = this.#arrayItems.length - 1; i >= 0; i--) {
				if (callback(this.#arrayItems[i], String(i))) return this.#arrayItems[i];
			}
			return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
		}
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
	 * The `keys` method returns all of the collection's keys as a new collection.
	 * For array-backed collections, this returns the numeric indices as strings.
	 *
	 * @returns Collection of keys
	 *
	 * @example For an associative collection:
	 * collect({ a: 1, b: 2 }).keys()
	 * // → Collection ['a', 'b']
	 *
	 * @example For an array collection:
	 * collect([10, 20, 30]).keys()
	 * // → Collection ['0', '1', '2']
	 *
	 * @see {@link values} - Get all values
	 * @see {@link has} - Check if a key exists
	 *
	 * @category Finding
	 */
	keys(): Collection<string> {
		if (this.#arrayItems) {
			return new Collection(this.#arrayItems.map((_, i) => String(i)));
		}
		return new Collection(Object.keys(this.items));
	}

	/**
	 * The `values` method returns all of the collection's values as a new
	 * collection with reset, sequential integer keys.
	 *
	 * @returns Collection of values
	 *
	 * @example For an associative collection:
	 * collect({ a: 1, b: 2, c: 3 }).values()
	 * // → Collection [1, 2, 3]
	 *
	 * @example To reset keys after filtering:
	 * collect([1, 2, 3, 4, 5])
	 *     .filter(n => n > 2)
	 *     .values()
	 * // → Collection [3, 4, 5] with keys 0, 1, 2
	 *
	 * @see {@link keys} - Get all keys
	 * @see {@link all} - Get the raw underlying data
	 *
	 * @category Finding
	 */
	values(): Collection<T> {
		if (this.#arrayItems) {
			return new Collection([...this.#arrayItems]);
		}
		return new Collection(Object.values(this.items));
	}

	/**
	 * The `map` method iterates over the collection and passes each value to the given callback.
	 * The callback is free to modify the item and return it, thus forming a new collection of
	 * modified items.
	 *
	 * @param callback - Function to transform each item. Receives value and key.
	 * @returns New collection with transformed items
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .map(n => n * 2)
	 * // → Collection [2, 4, 6]
	 *
	 * @example To extract a property:
	 * collect([
	 *   { name: 'Taylor' },
	 *   { name: 'Abigail' },
	 * ])
	 *   .map(u => u.name)
	 * // → ['Taylor', 'Abigail']
	 *
	 * @see {@link pluck} - Extract a single property by key
	 * @see {@link mapWithKeys} - Transform and change keys
	 * @see {@link flatMap} - Map and flatten results
	 * @see {@link transform} - Mutate the collection in place
	 *
	 * @category Transforming
	 */
	map<U>(callback: (value: T, key: CollectionKey<CK>) => U): Collection<U, CK> {
		if (this.#arrayItems) {
			return new Collection(this.#arrayItems.map((v, k) => callback(v, k as CollectionKey<CK>))) as Collection<U, CK>;
		}
		const mapped: Record<string, U> = {};
		for (const [key, value] of Object.entries(this.items)) {
			const typedKey = (this.isAssociative ? key : Number(key)) as CollectionKey<CK>;
			mapped[key] = callback(value, typedKey);
		}
		return new Collection(mapped, this.isAssociative) as Collection<U, CK>;
	}

	/**
	 * The `mapWithKeys` method iterates through the collection and passes each value to the given
	 * callback. The callback should return an associative array containing a single key/value pair.
	 *
	 * @param callback - Function returning a [key, value] tuple for each item
	 * @returns New associative collection with remapped keys and values
	 *
	 * @example
	 * collect([
	 *     { name: 'John', department: 'Sales' },
	 *     { name: 'Jane', department: 'Marketing' }
	 * ]).mapWithKeys(emp => [emp.name, emp.department])
	 * // → { John: 'Sales', Jane: 'Marketing' }
	 *
	 * @see {@link map} - Transform values keeping original keys
	 * @see {@link keyBy} - Key by a property without transforming values
	 * @see {@link pluck} - Extract values by key
	 *
	 * @category Transforming
	 */
	mapWithKeys<U>(callback: (value: T, key: string) => [string, U]): Collection<U> {
		const mapped: Record<string, U> = {};
		if (this.#arrayItems) {
			for (let i = 0; i < this.#arrayItems.length; i++) {
				const [newKey, newValue] = callback(this.#arrayItems[i], String(i));
				mapped[newKey] = newValue;
			}
		} else {
			for (const [key, value] of Object.entries(this.items)) {
				const [newKey, newValue] = callback(value, key);
				mapped[newKey] = newValue;
			}
		}
		return new Collection(mapped, true);
	}

	/**
	 * The `mapToDictionary` method runs the given callback over each item and groups the returned
	 * values by their keys. Unlike `groupBy`, this method allows complete control over the grouped
	 * values through the callback's return tuple.
	 *
	 * @param callback - Function returning a [groupKey, value] tuple for each item
	 * @returns Collection of arrays grouped by the returned keys
	 *
	 * @example
	 * collect([
	 *     { name: 'John', department: 'Sales' },
	 *     { name: 'Jane', department: 'Sales' },
	 *     { name: 'Bob', department: 'Marketing' }
	 * ]).mapToDictionary(emp => [emp.department, emp.name])
	 * // → { Sales: ['John', 'Jane'], Marketing: ['Bob'] }
	 *
	 * @see {@link mapToGroups} - Similar but returns nested Collections
	 * @see {@link groupBy} - Group by key without value transformation
	 * @see {@link mapWithKeys} - Map to single key-value pairs
	 *
	 * @category Transforming
	 */
	mapToDictionary<U>(callback: (value: T, key: string) => [string, U]): Collection<U[]> {
		const dictionary: Record<string, U[]> = {};
		if (this.#arrayItems) {
			for (let i = 0; i < this.#arrayItems.length; i++) {
				const [dictKey, dictValue] = callback(this.#arrayItems[i], String(i));
				if (!dictionary[dictKey]) {
					dictionary[dictKey] = [];
				}
				dictionary[dictKey].push(dictValue);
			}
		} else {
			for (const [key, value] of Object.entries(this.items)) {
				const [dictKey, dictValue] = callback(value, key);
				if (!dictionary[dictKey]) {
					dictionary[dictKey] = [];
				}
				dictionary[dictKey].push(dictValue);
			}
		}
		return new Collection(dictionary);
	}

	/**
	 * The `mapToGroups` method groups the collection's items by the given callback. The callback
	 * should return an associative array containing a single key/value pair, allowing you to
	 * customize both the group key and the value placed in each group.
	 *
	 * @param callback - Function returning a [groupKey, value] tuple for each item
	 * @returns Collection of Collections grouped by the returned keys
	 *
	 * @example
	 * collect([
	 *     { name: 'John', department: 'Sales' },
	 *     { name: 'Jane', department: 'Sales' },
	 *     { name: 'Bob', department: 'Marketing' }
	 * ]).mapToGroups(emp => [emp.department, emp.name])
	 * // → { Sales: Collection(['John', 'Jane']), Marketing: Collection(['Bob']) }
	 *
	 * @see {@link mapToDictionary} - Similar but returns plain arrays
	 * @see {@link groupBy} - Group by key without value transformation
	 *
	 * @category Transforming
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
	 * The `mapInto` method iterates over the collection and creates a new instance of the given
	 * class for each item, passing the item value and key to the constructor.
	 *
	 * @param classType - Class constructor to instantiate for each item
	 * @returns New collection of class instances
	 *
	 * @example
	 * class Currency {
	 *     constructor(public amount: number) {}
	 *     format() { return `$${this.amount.toFixed(2)}`; }
	 * }
	 *
	 * collect([100, 250, 50])
	 *     .mapInto(Currency)
	 *     .map(c => c.format())
	 * // → ['$100.00', '$250.00', '$50.00']
	 *
	 * @see {@link map} - Transform with arbitrary callback
	 * @see {@link pipeInto} - passing entire collection to a class constructor
	 *
	 * @category Transforming
	 */
	mapInto<U>(classType: new (value: T, key: CollectionKey<CK>) => U): Collection<U, CK> {
		return this.map((value, key) => new classType(value, key));
	}

	/**
	 * The `mapSpread` method iterates over the collection's items, passing each nested item value
	 * into the given callback as separate arguments. This is useful when working with nested arrays
	 * where each sub-array's elements should be passed as individual arguments.
	 *
	 * @param callback - Function receiving spread arguments from each nested array
	 * @returns New collection with callback results
	 *
	 * @example
	 * collect([[1, 2], [3, 4], [5, 6]])
	 *     .mapSpread((a, b) => a + b)
	 * // → [3, 7, 11]
	 *
	 * @example You may also pass a key as the final argument:
	 * collect([['Taylor', 'Laravel'], ['Caleb', 'Livewire']])
	 *     .mapSpread((name, project, key) => `${key}: ${name} - ${project}`)
	 * // → ['0: Taylor - Laravel', '1: Caleb - Livewire']
	 *
	 * @see {@link eachSpread} - Iterate without transforming
	 * @see {@link flatMap} - Map and flatten results
	 *
	 * @category Transforming
	 */
	mapSpread<U>(callback: (...args: unknown[]) => U): Collection<U, CK> {
		return this.map((value, key) => {
			const args = Array.isArray(value) ? [...value, key] : [value, key];
			return callback(...args);
		});
	}

	/**
	 * Map each item then flatten the results by one level.
	 *
	 * @param callback - Function returning an array for each item
	 * @returns New collection with mapped and flattened results
	 *
	 * @example
	 * collect([[1, 2], [3, 4]])
	 *     .flatMap(arr => arr.map(n => n * 2))
	 * // → Collection [2, 4, 6, 8]
	 *
	 * @see {@link map} - Transform without flattening
	 * @see {@link flatten} - Flatten without mapping
	 * @see {@link collapse} - Flatten arrays of arrays
	 *
	 * @category Transforming
	 */
	flatMap<U>(callback: (value: T, key: CollectionKey<CK>) => U[]): Collection<U, CK> {
		return this.map(callback).collapse() as Collection<U, CK>;
	}

	/**
	 * Ensure any deferred source is consumed and return the array items if available.
	 * Use this before operations that have array vs record paths.
	 */
	private ensureConsumed(): T[] | null {
		if (this.#arrayItems) return this.#arrayItems;
		if (this.#source !== null) {
			void this.items;
			return this.#arrayItems;
		}
		return null;
	}

	/**
	 * The `filter` method filters the collection using the given callback, keeping only
	 * items that pass a given truth test. If no callback is supplied, all falsy values
	 * (`false`, `null`, `undefined`, `0`, `''`) are removed.
	 *
	 * @param callback - Function to test each item. Receives value and key. If omitted, removes falsy values.
	 * @returns New collection containing only items that passed the test
	 *
	 * @example
	 * collect([1, 2, 3, 4])
	 *     .filter(n => n > 2)
	 * // → [3, 4]
	 *
	 * @example To remove falsy values, call without arguments:
	 * collect([0, 1, '', 'hello', null])
	 *     .filter()
	 * // → [1, 'hello']
	 *
	 * @see {@link reject} - the inverse (keeps items that fail)
	 * @see {@link where} - Filter by key/value instead of callback
	 *
	 * @category Filtering
	 */
	filter<S extends T>(callback: (value: T, key: CollectionKey<CK>) => value is S): Collection<S, CK>;
	filter(callback?: (value: T, key: CollectionKey<CK>) => boolean): Collection<T, CK>;
	filter(callback?: (value: T, key: CollectionKey<CK>) => boolean): Collection<T, CK> {
		const arr = this.ensureConsumed();
		if (arr) {
			const cb = callback ? (v: T, k: number) => callback(v, k as CollectionKey<CK>) : Boolean;
			return new Collection(arr.filter(cb)) as Collection<T, CK>;
		}
		const filtered: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			const typedKey = (this.isAssociative ? key : Number(key)) as CollectionKey<CK>;
			if (callback ? callback(value, typedKey) : Boolean(value)) {
				filtered[key] = value;
			}
		}
		return new Collection(filtered, this.isAssociative) as Collection<T, CK>;
	}

	/**
	 * The `reject` method filters the collection using the given callback, removing
	 * items that pass the truth test. It is the inverse of the `filter` method.
	 *
	 * @param callback - Function to test each item, or a value to reject by loose equality
	 * @returns New collection with matching items removed
	 *
	 * @example
	 * collect([1, 2, 3, 4])
	 *     .reject(n => n > 2)
	 * // → [1, 2]
	 *
	 * @example You may also pass a value directly to reject by loose equality:
	 * collect([1, null, 3])
	 *     .reject(null)
	 * // → [1, 3]
	 *
	 * @see {@link filter} - the inverse (keeps items that pass)
	 * @see {@link whereNotIn} - excluding items in an array
	 *
	 * @category Filtering
	 */
	reject<S extends T>(callback: (value: T, key: CollectionKey<CK>) => value is S): Collection<Exclude<T, S>, CK>;
	reject(callback: T | ((value: T, key: CollectionKey<CK>) => boolean)): Collection<T, CK>;
	reject(
		callback: T | ((value: T, key: CollectionKey<CK>) => boolean),
	): Collection<T, CK> | Collection<Exclude<T, T>, CK> {
		const useCallback = useAsCallable(callback);
		return this.filter((value, key) => {
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			return useCallback ? !(callback as (value: T, key: CollectionKey<CK>) => boolean)(value, key) : value != callback;
		});
	}

	/**
	 * The `collapse` method collapses a collection of arrays into a single, flat collection.
	 * It merges the elements of nested arrays or Collections into one level.
	 *
	 * @returns New collection with all nested arrays merged into one
	 *
	 * @example
	 * collect([[1, 2], [3, 4], [5]])
	 *     .collapse()
	 * // → [1, 2, 3, 4, 5]
	 *
	 * @example You may also use nested Collections:
	 * collect([collect([1, 2]), collect([3, 4])])
	 *     .collapse()
	 * // → [1, 2, 3, 4]
	 *
	 * @see {@link flatten} - Recursively flatten to any depth
	 * @see {@link flatMap} - Map then collapse
	 *
	 * @category Transforming
	 */
	collapse(): Collection<Collapse<T>> {
		const result: Collapse<T>[] = [];
		const items = this.#arrayItems ?? Object.values(this.items);
		for (const value of items) {
			const isArray = Array.isArray(value);
			if (isArray) {
				result.push(...(value as Collapse<T>[]));
				continue;
			}
			const isCollection = value instanceof Collection;
			if (isCollection) {
				result.push(...(value.all() as Collapse<T>[]));
			}
		}
		return new Collection(result) as Collection<Collapse<T>>;
	}

	/**
	 * The `collapseWithKeys` method collapses a collection of objects into a single object,
	 * preserving the keys from each nested object. Later objects override earlier ones when
	 * keys conflict.
	 *
	 * @returns New associative collection with all nested object keys merged
	 *
	 * @example
	 * collect([{ name: 'John' }, { email: 'john@example.com' }, { role: 'admin' }])
	 *     .collapseWithKeys()
	 * // → { name: 'John', email: 'john@example.com', role: 'admin' }
	 *
	 * @example With overlapping keys, later values override:
	 * collect([{ a: 1 }, { a: 2, b: 3 }])
	 *     .collapseWithKeys()
	 * // → { a: 2, b: 3 }
	 *
	 * @see {@link collapse} - Collapse arrays into a flat array
	 * @see {@link merge} - Merge another collection into this one
	 *
	 * @category Transforming
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
		return new Collection(results, true);
	}

	/**
	 * The `flatten` method flattens a multi-dimensional collection into a single dimension.
	 * You may optionally pass a depth argument to limit how many levels deep the flattening
	 * should go.
	 *
	 * @param depth - Maximum depth to flatten (default: infinite)
	 * @returns New collection with nested arrays flattened
	 *
	 * @example To flatten all levels:
	 * collect([[1, [2, [3]]], [4]])
	 *     .flatten()
	 * // → [1, 2, 3, 4]
	 *
	 * @example To flatten just one level:
	 * collect([[1, [2]], [3]])
	 *     .flatten(1)
	 * // → [1, [2], 3]
	 *
	 * @see {@link collapse} - Flatten by exactly one level
	 * @see {@link dot} - Flatten to dot notation keys
	 *
	 * @category Transforming
	 */
	flatten(): Collection<FlattenDepth<T, 20>>;
	flatten(depth: 1): Collection<Collapse<T>>;
	flatten(depth: 2): Collection<Collapse<Collapse<T>>>;
	flatten(depth: 3): Collection<Collapse<Collapse<Collapse<T>>>>;
	flatten(depth: 4): Collection<Collapse<Collapse<Collapse<Collapse<T>>>>>;
	flatten(depth: 5): Collection<Collapse<Collapse<Collapse<Collapse<Collapse<T>>>>>>;
	flatten(depth: number): Collection<unknown>;
	// biome-ignore lint/suspicious/noExplicitAny: wide implementation signature for overloads
	flatten(depth = Number.POSITIVE_INFINITY): Collection<any> {
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
		const items = this.#arrayItems ?? Object.values(this.items);
		return new Collection(doFlatten(items, depth));
	}

	/**
	 * The `flip` method swaps the collection's keys with their corresponding values. Values
	 * are converted to strings since object keys must be strings.
	 *
	 * @returns New collection with keys and values swapped
	 *
	 * @example
	 * collect({ name: 'taylor', framework: 'laravel' })
	 *     .flip()
	 * // → { taylor: 'name', laravel: 'framework' }
	 *
	 * @example For an array, keys become values:
	 * collect(['a', 'b', 'c'])
	 *     .flip()
	 * // → { a: '0', b: '1', c: '2' }
	 *
	 * @see {@link keys} - Get just the keys
	 * @see {@link values} - Get just the values
	 *
	 * @category Transforming
	 */
	flip(): Collection<string> {
		const flipped: Record<string, string> = {};
		for (const [key, value] of Object.entries(this.items)) {
			flipped[String(value)] = key;
		}
		return new Collection(flipped, true);
	}

	/**
	 * Split the collection into chunks of the given size.
	 *
	 * @param size - Maximum number of items per chunk
	 * @param preserveKeys - Keep original keys in chunks
	 * @returns Collection of Collections
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .chunk(2)
	 * // → [
	 * //   Collection [1, 2],
	 * //   Collection [3, 4],
	 * //   Collection [5],
	 * // ]
	 *
	 * @see {@link split} - Split into N groups
	 * @see {@link sliding} - Create overlapping windows
	 * @see {@link groupBy} - Group by key/callback
	 *
	 * @category Grouping
	 */
	chunk(size: number, preserveKeys = true): Collection<Collection<T>> {
		if (size <= 0) {
			return new Collection<Collection<T>>([]);
		}

		if (this.#arrayItems && !preserveKeys) {
			const chunks: Collection<T>[] = [];
			for (let i = 0; i < this.#arrayItems.length; i += size) {
				chunks.push(new Collection(this.#arrayItems.slice(i, i + size)));
			}
			return new Collection(chunks);
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
	 * The `chunkWhile` method breaks the collection into multiple, smaller collections
	 * based on the evaluation of the given callback. The callback receives the current
	 * item, its key, and the current chunk being built. A new chunk starts whenever
	 * the callback returns `false`.
	 *
	 * @example To group consecutive numbers:
	 * collect([1, 2, 3, 5, 6])
	 *     .chunkWhile((v, k, chunk) => v === chunk.last() + 1)
	 * // → [
	 * //   [1, 2, 3],
	 * //   [5, 6],
	 * // ]
	 *
	 * @see {@link chunk} - Split into fixed-size chunks
	 * @see {@link split} - Split into a specific number of groups
	 * @see {@link groupBy} - Group by a key or callback result
	 *
	 * @category Grouping
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
	 * The `split` method breaks a collection into the given number of groups,
	 * distributing extra items across earlier groups to balance sizes as evenly
	 * as possible.
	 *
	 * @example To split into three groups:
	 * collect([1, 2, 3, 4, 5])
	 *     .split(3)
	 * // → [
	 * //   [1, 2],
	 * //   [3, 4],
	 * //   [5],
	 * // ]
	 *
	 * @see {@link splitIn} - Fill non-terminal groups completely first
	 * @see {@link chunk} - Split into fixed-size chunks instead
	 *
	 * @category Grouping
	 */
	split(numberOfGroups: number): Collection<Collection<T>> {
		if (this.isEmpty()) {
			return new Collection<Collection<T>>([]);
		}

		const groups: Collection<T>[] = [];
		const values = this.#arrayItems ?? Object.values(this.items);
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
	 * The `splitIn` method breaks a collection into the given number of groups,
	 * filling non-terminal groups completely before allocating the remainder to
	 * the final group. Unlike `split`, which balances group sizes, `splitIn`
	 * creates full-sized chunks until items run out.
	 *
	 * @example To split into three groups:
	 * collect([1, 2, 3, 4, 5, 6, 7])
	 *     .splitIn(3)
	 * // → [
	 * //   [1, 2, 3],
	 * //   [4, 5, 6],
	 * //   [7],
	 * // ]
	 *
	 * @see {@link split} - Distribute items evenly across groups
	 * @see {@link chunk} - Split into fixed-size chunks
	 *
	 * @category Grouping
	 */
	splitIn(numberOfGroups: number): Collection<Collection<T>> {
		const chunkSize = Math.ceil(this.count() / numberOfGroups);
		return this.chunk(chunkSize);
	}

	/**
	 * The `slice` method returns a slice of the collection starting at the
	 * given index. You may pass a second argument to limit the size of the
	 * returned slice.
	 *
	 * @param offset - The starting index (0-based)
	 * @param length - Optional maximum number of items to include
	 * @returns New collection containing the slice
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5]).slice(2)
	 * // → Collection [3, 4, 5]
	 *
	 * @example You may also pass a length limit:
	 * collect([1, 2, 3, 4, 5]).slice(1, 2)
	 * // → Collection [2, 3]
	 *
	 * @example With a negative offset, it counts from the end:
	 * collect([1, 2, 3, 4, 5]).slice(-2)
	 * // → Collection [4, 5]
	 *
	 * @see {@link take} - Take items from beginning or end
	 * @see {@link skip} - Skip items from the beginning
	 * @see {@link forPage} - Paginate the collection
	 *
	 * @category Finding
	 */
	slice(offset: number, length?: number): Collection<T> {
		if (this.#arrayItems) {
			const sliced =
				length !== undefined ? this.#arrayItems.slice(offset, offset + length) : this.#arrayItems.slice(offset);
			return new Collection(sliced);
		}
		const entries = Object.entries(this.items);
		const sliced = length !== undefined ? entries.slice(offset, offset + length) : entries.slice(offset);
		return new Collection(Object.fromEntries(sliced), this.isAssociative);
	}

	/**
	 * The `reverse` method reverses the order of the collection's items, preserving the
	 * original keys.
	 *
	 * @returns New collection with items in reverse order
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .reverse()
	 * // → [5, 4, 3, 2, 1]
	 *
	 * @see {@link sort} - Sort items
	 * @see {@link sortDesc} - Sort in descending order
	 * @see {@link shuffle} - Randomize order
	 *
	 * @category Sorting
	 */
	reverse(): Collection<T> {
		if (this.#arrayItems) {
			return new Collection([...this.#arrayItems].reverse());
		}
		const values = [...Object.values(this.items)].reverse();
		return new Collection(values);
	}

	/**
	 * The `shuffle` method randomly shuffles the items in the collection.
	 *
	 * Uses the Fisher-Yates algorithm for unbiased shuffling.
	 *
	 * @returns New collection with items in random order
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .shuffle()
	 * // → [3, 1, 4, 5, 2] (random order)
	 *
	 * @see {@link random} - Get random item(s)
	 * @see {@link sort} - Sort items
	 * @see {@link reverse} - Reverse order
	 *
	 * @category Sorting
	 */
	shuffle(): Collection<T> {
		if (this.#arrayItems) {
			const values = [...this.#arrayItems];
			for (let i = values.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[values[i], values[j]] = [values[j], values[i]];
			}
			return new Collection(values);
		}
		const values = Object.values(this.items);
		for (let i = values.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[values[i], values[j]] = [values[j], values[i]];
		}
		return new Collection(values);
	}

	/**
	 * The `pad` method fills the array with the given value until the array reaches the
	 * specified size. This method behaves like PHP's `array_pad` function. To pad to the
	 * left, specify a negative size. No padding occurs if the absolute value of the given
	 * size is less than or equal to the length of the array.
	 *
	 * @param size - Target size (negative pads left, positive pads right)
	 * @param value - Value to pad with
	 * @returns New collection padded to the target size
	 *
	 * @example To pad to the right:
	 * collect([1, 2, 3])
	 *     .pad(5, 0)
	 * // → [1, 2, 3, 0, 0]
	 *
	 * @example To pad to the left:
	 * collect([1, 2, 3])
	 *     .pad(-5, 0)
	 * // → [0, 0, 1, 2, 3]
	 *
	 * @see {@link take} - Take items from start or end
	 * @see {@link splice} - Insert items at a position
	 *
	 * @category Transforming
	 */
	pad(size: number, value: T): Collection<T> {
		const values = this.#arrayItems ? [...this.#arrayItems] : Object.values(this.items);
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
	 * The `zip` method merges together the values of the given array with the values of
	 * the original collection at their corresponding index. This is useful for pairing
	 * related data from multiple sources, such as names with scores or dates with values.
	 *
	 * @param arrays - One or more arrays to zip with this collection
	 * @returns Collection of collections, where each inner collection contains values from the same index
	 *
	 * @example To pair names with scores:
	 * collect(['Alice', 'Bob', 'Charlie'])
	 *     .zip([85, 92, 78])
	 * // → [['Alice', 85], ['Bob', 92], ['Charlie', 78]]
	 *
	 * @example You may pass multiple arrays:
	 * collect([1, 2, 3])
	 *     .zip(['a', 'b', 'c'], [true, false, true])
	 * // → [[1, 'a', true], [2, 'b', false], [3, 'c', true]]
	 *
	 * @see {@link combine} - Use values as keys paired with another array's values
	 * @see {@link crossJoin} - Create cartesian product instead of pairing by index
	 *
	 * @category Combining
	 */
	zip<U>(...arrays: U[][]): Collection<Collection<T | U>> {
		const values = this.#arrayItems ?? Object.values(this.items);
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

	/**
	 * The `contains` method determines whether the collection contains a given item.
	 *
	 * Uses loose equality (`==`) to match Laravel behavior. Note that JS differs from PHP:
	 * `0 == false`, `null == undefined`, `"" == 0`.
	 *
	 * @param keyOrCallback - Value to find, property key, or callback function
	 * @param operator - Comparison operator when using key/value syntax
	 * @param value - Value to compare against when using key/operator/value syntax
	 * @returns `true` if item exists, `false` otherwise
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .contains(2)
	 * // → true
	 *
	 * @example You may pass a callback to check for a matching item:
	 * collect([
	 *   { name: 'Taylor', active: true },
	 *   { name: 'Abigail', active: false },
	 * ])
	 *   .contains(u => u.active)
	 * // → true
	 *
	 * @example You may also use key/value syntax:
	 * collect([
	 *   { name: 'Taylor', role: 'admin' },
	 *   { name: 'Abigail', role: 'editor' },
	 * ])
	 *   .contains('role', 'admin')
	 * // → true
	 *
	 * @see {@link containsStrict} - strict equality (`===`)
	 * @see {@link doesntContain} - the inverse (true if not found)
	 *
	 * @category Filtering
	 */
	contains(
		keyOrCallback: T | string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
		if (arguments.length === 1) {
			if (useAsCallable(keyOrCallback)) {
				if (this.#arrayItems) {
					for (let i = 0; i < this.#arrayItems.length; i++) {
						if ((keyOrCallback as (value: T, key: string) => boolean)(this.#arrayItems[i], String(i))) {
							return true;
						}
					}
					return false;
				}
				for (const [key, val] of Object.entries(this.items)) {
					if ((keyOrCallback as (value: T, key: string) => boolean)(val, key)) {
						return true;
					}
				}
				return false;
			}
			const items = this.#arrayItems ?? Object.values(this.items);
			return arrayContains(items, keyOrCallback);
		}

		return this.contains(operatorForWhere(keyOrCallback as string, operator, value));
	}

	/**
	 * The `containsStrict` method determines whether the collection contains a given item
	 * using strict comparison (`===`).
	 *
	 * Unlike `contains` which uses loose equality, this method distinguishes between types.
	 * For example, `1` and `'1'` are not equal under strict comparison.
	 *
	 * @example
	 * collect([1, '1'])
	 *     .containsStrict(1)
	 * // → true
	 *
	 * @example You may also use key/value with strict comparison:
	 * collect([{ id: 1 }, { id: '1' }])
	 *     .containsStrict('id', 1)
	 * // → true (first item matches, second does not)
	 *
	 * @see {@link contains} - loose equality (`==`)
	 * @see {@link doesntContainStrict} - the inverse (true if not found)
	 *
	 * @category Checking
	 */
	containsStrict(keyOrValue: T | string | ((value: T, key: string) => boolean), value?: T): boolean {
		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
		if (arguments.length === 2) {
			return this.contains((item) => dataGet(item, keyOrValue as string) === value);
		}

		if (useAsCallable(keyOrValue)) {
			return this.first(keyOrValue as unknown as (value: T, key: string) => boolean) !== undefined;
		}

		const items = this.#arrayItems ?? Object.values(this.items);
		for (const item of items) {
			if (item === keyOrValue) return true;
		}
		return false;
	}

	/**
	 * The `doesntContain` method determines whether the collection does not contain a given item.
	 *
	 * This method is the inverse of `contains` and uses loose equality (`==`) for comparison.
	 * It returns `true` when the item is NOT found in the collection.
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .doesntContain(4)
	 * // → true
	 *
	 * @example You may also pass a callback:
	 * collect([
	 *   { name: 'Taylor', role: 'editor' },
	 *   { name: 'Abigail', role: 'editor' },
	 * ])
	 *   .doesntContain(u => u.role === 'admin')
	 * // → true
	 *
	 * @see {@link contains} - the inverse (true if found)
	 * @see {@link doesntContainStrict} - strict equality (`===`)
	 *
	 * @category Checking
	 */
	doesntContain(
		keyOrCallback: T | string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		if (value !== undefined) {
			return !this.contains(keyOrCallback, operator, value);
		}
		if (operator !== undefined) {
			return !this.contains(keyOrCallback, operator);
		}
		return !this.contains(keyOrCallback);
	}

	/**
	 * The `doesntContainStrict` method determines whether the collection does not contain a given
	 * item using strict comparison (`===`).
	 *
	 * This method is the inverse of `containsStrict` and returns `true` when the item is NOT found.
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .doesntContainStrict('1')
	 * // → true (string '1' is not strictly equal to number 1)
	 *
	 * @see {@link containsStrict} - the inverse with strict equality
	 * @see {@link doesntContain} - loose equality (`==`)
	 *
	 * @category Checking
	 */
	doesntContainStrict(keyOrValue: T | string | ((value: T, key: string) => boolean), value?: T): boolean {
		if (value !== undefined) {
			return !this.containsStrict(keyOrValue, value);
		}
		return !this.containsStrict(keyOrValue);
	}

	/**
	 * The `diff` method compares the collection against another array or collection
	 * based on its values. This method returns the values in the original collection
	 * that are not present in the given collection.
	 *
	 * @param items - Array or collection to compare against
	 * @returns New collection containing items not present in the given array
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .diff([2, 4, 6])
	 * // → [1, 3, 5]
	 *
	 * @example To find missing items:
	 * const required = ['name', 'email', 'phone']
	 * const provided = ['name', 'email']
	 * collect(required).diff(provided)
	 * // → ['phone']
	 *
	 * @see {@link intersect} - Get items present in both collections
	 * @see {@link diffKeys} - comparing by keys instead of values
	 * @see {@link diffAssoc} - comparing by both keys and values
	 * @see {@link diffUsing} - comparing with a custom callback
	 *
	 * @category Combining
	 */
	diff(items: Arrayable<T>): Collection<T, CK> {
		const otherValues = new Set(arrayableToArray(items));
		if (this.#arrayItems) {
			return new Collection(arrayFilterBySet(this.#arrayItems, otherValues, false)) as Collection<T, CK>;
		}
		return this.filter((value) => !otherValues.has(value));
	}

	/**
	 * The `diffUsing` method compares the collection against another array or collection
	 * using a callback. The callback should return 0 when two values are considered equal,
	 * a negative number when the first is less than the second, or a positive number otherwise.
	 *
	 * @param items - Array or collection to compare against
	 * @param callback - Comparison function returning 0 for equal values
	 * @returns New collection containing items not considered equal to any in the given array
	 *
	 * @example For case-insensitive comparison:
	 * collect(['Apple', 'Banana'])
	 *     .diffUsing(['apple', 'cherry'], (a, b) =>
	 *         a.toLowerCase().localeCompare(b.toLowerCase())
	 *     )
	 * // → ['Banana']
	 *
	 * @see {@link diff} - comparing using default equality
	 * @see {@link diffAssocUsing} - comparing keys and values with a callback
	 *
	 * @category Combining
	 */
	diffUsing(items: Arrayable<T>, callback: (a: T, b: T) => number): Collection<T, CK> {
		const otherValues = arrayableToArray(items);
		return this.filter((value) => !otherValues.some((other) => callback(value, other) === 0));
	}

	/**
	 * The `diffKeys` method compares the collection against another array or collection
	 * based on its keys. This method returns the key/value pairs in the original
	 * collection whose keys are not present in the given collection.
	 *
	 * @param items - Object or collection to compare keys against
	 * @returns New collection containing items whose keys are not in the given object
	 *
	 * @example To find extra fields:
	 * collect({ name: 'Alice', age: 30, city: 'NYC' })
	 *     .diffKeys({ name: '', age: 0 })
	 * // → { city: 'NYC' }
	 *
	 * @see {@link diff} - comparing by values instead of keys
	 * @see {@link diffAssoc} - comparing by both keys and values
	 * @see {@link diffKeysUsing} - comparing keys with a custom callback
	 *
	 * @category Combining
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
	 * The `diffKeysUsing` method compares the collection against another array or collection
	 * based on its keys using a callback. The callback should return 0 when two keys are
	 * considered equal.
	 *
	 * @param items - Object or collection to compare keys against
	 * @param callback - Comparison function returning 0 for equal keys
	 * @returns New collection containing items whose keys don't match via the callback
	 *
	 * @example For case-insensitive key comparison:
	 * collect({ Name: 'Alice', AGE: 30 })
	 *     .diffKeysUsing({ name: '', age: 0 }, (a, b) =>
	 *         a.toLowerCase().localeCompare(b.toLowerCase())
	 *     )
	 * // → {} (all keys match case-insensitively)
	 *
	 * @see {@link diffKeys} - comparing keys using default equality
	 *
	 * @category Combining
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
	 * The `diffAssoc` method compares the collection against another array or collection
	 * based on both its keys and values. This method returns the key/value pairs in the
	 * original collection that are not present in the given collection.
	 *
	 * @param items - Object or collection to compare against
	 * @returns New collection containing items whose key/value pairs are not in the given object
	 *
	 * @example To compare key-value pairs:
	 * collect({ color: 'red', size: 'large', price: 100 })
	 *     .diffAssoc({ color: 'red', size: 'medium' })
	 * // → { size: 'large', price: 100 }
	 *
	 * @see {@link diff} - comparing by values only
	 * @see {@link diffKeys} - comparing by keys only
	 * @see {@link diffAssocUsing} - comparing with a custom key callback
	 *
	 * @category Combining
	 */
	diffAssoc(items: Collectable<T>): Collection<T, CK> {
		const other = collectableToRecord(items) as Record<string, unknown>;
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (!(key in other) || other[key] !== value) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * The `diffAssocUsing` method compares the collection against another array or collection
	 * based on its keys and values, using a callback for key comparison. The callback should
	 * return 0 when two keys are considered equal.
	 *
	 * @param items - Object or collection to compare against
	 * @param callback - Comparison function returning 0 for equal keys
	 * @returns New collection containing items whose key/value pairs don't match
	 *
	 * @example For case-insensitive key comparison:
	 * collect({ Name: 'Alice', Age: 30 })
	 *     .diffAssocUsing({ name: 'Alice', age: 25 }, (a, b) =>
	 *         a.toLowerCase().localeCompare(b.toLowerCase())
	 *     )
	 * // → { Age: 30 } (Name matches, Age differs in value)
	 *
	 * @see {@link diffAssoc} - comparing using default key equality
	 * @see {@link diffUsing} - comparing values with a custom callback
	 *
	 * @category Combining
	 */
	diffAssocUsing(items: Collectable<T>, callback: (a: string, b: string) => number): Collection<T, CK> {
		const other = collectableToRecord(items) as Record<string, unknown>;
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
	 * The `intersect` method removes any values from the original collection that are
	 * not present in the given array or collection. The resulting collection will
	 * preserve the original collection's keys.
	 *
	 * @param items - Array or collection to intersect with
	 * @returns New collection containing only items present in both
	 *
	 * @example To find common elements:
	 * collect([1, 2, 3, 4, 5])
	 *     .intersect([2, 4, 6, 8])
	 * // → [2, 4]
	 *
	 * @example To check permissions:
	 * const userPermissions = ['read', 'write', 'delete']
	 * const required = ['read', 'admin']
	 * collect(userPermissions).intersect(required)
	 * // → ['read']
	 *
	 * @see {@link diff} - Get items NOT present in the other collection
	 * @see {@link intersectByKeys} - Intersect by keys instead of values
	 * @see {@link intersectAssoc} - Intersect by both keys and values
	 * @see {@link intersectUsing} - Intersect with a custom callback
	 *
	 * @category Combining
	 */
	intersect(items: Arrayable<T>): Collection<T, CK> {
		const otherValues = new Set(arrayableToArray(items));
		if (this.#arrayItems) {
			return new Collection(arrayFilterBySet(this.#arrayItems, otherValues, true)) as Collection<T, CK>;
		}
		return this.filter((value) => otherValues.has(value));
	}

	/**
	 * The `intersectUsing` method removes values not present in the given array or collection,
	 * using a callback for comparison. The callback should return 0 when two values are
	 * considered equal.
	 *
	 * @param items - Array or collection to intersect with
	 * @param callback - Comparison function returning 0 for equal values
	 * @returns New collection containing only items that match via the callback
	 *
	 * @example For case-insensitive intersection:
	 * collect(['Apple', 'Banana', 'Cherry'])
	 *     .intersectUsing(['apple', 'cherry'], (a, b) =>
	 *         a.toLowerCase().localeCompare(b.toLowerCase())
	 *     )
	 * // → ['Apple', 'Cherry']
	 *
	 * @see {@link intersect} - Intersect using default equality
	 *
	 * @category Combining
	 */
	intersectUsing(items: Arrayable<T>, callback: (a: T, b: T) => number): Collection<T, CK> {
		const otherValues = arrayableToArray(items);
		return this.filter((value) => otherValues.some((other) => callback(value, other) === 0));
	}

	/**
	 * The `intersectAssoc` method compares the collection against another array or collection,
	 * returning key/value pairs that are present in both. Unlike `intersect`, this method
	 * considers both keys and values when determining matches.
	 *
	 * @param items - Object or collection to intersect with
	 * @returns New collection containing items with matching key/value pairs
	 *
	 * @example To find matching key-value pairs:
	 * collect({ name: 'Alice', age: 30, city: 'NYC' })
	 *     .intersectAssoc({ name: 'Alice', age: 25, city: 'NYC' })
	 * // → { name: 'Alice', city: 'NYC' }
	 *
	 * @see {@link intersect} - Intersect by values only
	 * @see {@link intersectByKeys} - Intersect by keys only
	 * @see {@link intersectAssocUsing} - Intersect with a custom key callback
	 *
	 * @category Combining
	 */
	intersectAssoc(items: Collectable<T>): Collection<T, CK> {
		const other = collectableToRecord(items) as Record<string, unknown>;
		const result: Record<string, T> = {};
		for (const [key, value] of Object.entries(this.items)) {
			if (key in other && other[key] === value) {
				result[key] = value;
			}
		}
		return new Collection(result);
	}

	/**
	 * The `intersectAssocUsing` method compares the collection against another array or collection
	 * based on both keys and values, using a callback for key comparison. The callback should
	 * return 0 when two keys are considered equal.
	 *
	 * @param items - Object or collection to intersect with
	 * @param callback - Comparison function returning 0 for equal keys
	 * @returns New collection containing items with matching key/value pairs via the callback
	 *
	 * @example For case-insensitive key matching:
	 * collect({ Name: 'Alice', AGE: 30 })
	 *     .intersectAssocUsing({ name: 'Alice', age: 30 }, (a, b) =>
	 *         a.toLowerCase().localeCompare(b.toLowerCase())
	 *     )
	 * // → { Name: 'Alice', AGE: 30 }
	 *
	 * @see {@link intersectAssoc} - Intersect using default key equality
	 *
	 * @category Combining
	 */
	intersectAssocUsing(items: Collectable<T>, callback: (a: string, b: string) => number): Collection<T, CK> {
		const other = collectableToRecord(items) as Record<string, unknown>;
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
	 * The `intersectByKeys` method removes any keys from the original collection that are
	 * not present in the given array or collection. This is useful for filtering an object
	 * to only include specific fields.
	 *
	 * @param items - Object or collection whose keys to intersect with
	 * @returns New collection containing only items whose keys exist in both
	 *
	 * @example To filter to allowed fields:
	 * collect({ name: 'Alice', age: 30, password: 'secret' })
	 *     .intersectByKeys({ name: '', age: '' })
	 * // → { name: 'Alice', age: 30 }
	 *
	 * @see {@link intersect} - Intersect by values instead of keys
	 * @see {@link intersectAssoc} - Intersect by both keys and values
	 * @see {@link only} - Similar but accepts key names as arguments
	 *
	 * @category Combining
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
	 * The `duplicates` method retrieves and returns duplicate values from the collection.
	 * By default, the method uses loose comparison.
	 *
	 * @param callback - Key or callback to derive comparison value
	 * @param strict - Use strict equality (`===`) for comparison
	 * @returns New collection containing only duplicate items
	 *
	 * @example
	 * collect([1, 2, 2, 3, 3, 3])
	 *     .duplicates()
	 * // → [2, 3, 3]
	 *
	 * @example You may also pass a key to compare by a derived value:
	 * collect([{ email: 'a@b.com' }, { email: 'c@d.com' }, { email: 'a@b.com' }])
	 *     .duplicates('email')
	 * // → [{ email: 'a@b.com' }]
	 *
	 * @see {@link duplicatesStrict} - strict equality (`===`)
	 * @see {@link unique} - get unique items instead
	 *
	 * @category Filtering
	 */
	duplicates(callback?: ValueRetriever<T, unknown>, strict = false): Collection<T> {
		const retriever = valueRetriever(callback);
		const result: Record<string, T> = {};

		if (strict) {
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
			const seenValues: unknown[] = [];
			const seenKeys: string[] = [];

			const looseFind = (arr: unknown[], val: unknown): number => {
				for (let i = 0; i < arr.length; i++) {
					// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
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
	 * The `duplicatesStrict` method retrieves duplicate values using strict equality (`===`).
	 *
	 * @param callback - Optional key or callback to derive comparison value
	 * @returns Collection of duplicate items
	 *
	 * @see {@link duplicates} - loose equality (`==`)
	 *
	 * @category Filtering
	 */
	duplicatesStrict(callback?: ValueRetriever<T, unknown>): Collection<T> {
		return this.duplicates(callback, true);
	}

	/**
	 * The `median` method returns the median value of a given key.
	 *
	 * The median is the middle value when all values are sorted in order. For collections with
	 * an even number of items, it returns the average of the two middle values.
	 *
	 * @param key - Property key to extract values from (optional for numeric arrays)
	 * @returns The median value, or null if the collection is empty
	 *
	 * @example
	 * collect([1, 3, 3, 6, 7, 8, 9])
	 *     .median()
	 * // → 6
	 *
	 * @example For an even count, it returns the average of two middle values:
	 * collect([1, 2, 3, 4])
	 *     .median()
	 * // → 2.5
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Desk', price: 200 },
	 *   { name: 'Chair', price: 100 },
	 *   { name: 'Lamp', price: 50 },
	 * ])
	 *   .median('price')
	 * // → 100
	 *
	 * @see {@link avg} - Get the arithmetic mean
	 * @see {@link mode} - Get the most frequent value(s)
	 * @see {@link min} - Get the minimum value
	 * @see {@link max} - Get the maximum value
	 *
	 * @category Aggregating
	 */
	median(key?: string): number | null {
		if (this.#arrayItems && !key) {
			const values = this.#arrayItems
				.filter((v) => v !== null && v !== undefined)
				.map((v) => Number(v))
				.filter((v) => !Number.isNaN(v))
				.sort((a, b) => a - b);

			const count = values.length;
			if (count === 0) return null;

			const middle = Math.floor(count / 2);
			if (count % 2 === 1) {
				return values[middle];
			}
			return (values[middle - 1] + values[middle]) / 2;
		}
		const source = (key ? this.pluck(key as Path<T>) : this) as Collection<unknown, CK>;
		const values = source
			.filter((v: unknown) => v !== null && v !== undefined)
			.map((v: unknown) => Number(v))
			.filter((v: number) => !Number.isNaN(v))
			.sort((a: number, b: number) => a - b)
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
	 * The `mode` method returns the mode value of a given key, which is the value that appears
	 * most frequently in the collection.
	 *
	 * If multiple values share the highest frequency, all of them are returned. Returns null
	 * if the collection is empty.
	 *
	 * @param key - Property key to extract values from (optional for simple arrays)
	 * @returns Array of most frequent value(s), or null if empty
	 *
	 * @example
	 * collect([1, 1, 2, 4])
	 *     .mode()
	 * // → [1]
	 *
	 * @example For multiple modes, all are returned:
	 * collect([1, 1, 2, 2, 3])
	 *     .mode()
	 * // → [1, 2]
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Desk', category: 'furniture' },
	 *   { name: 'Chair', category: 'furniture' },
	 *   { name: 'Laptop', category: 'electronics' },
	 * ])
	 *   .mode('category')
	 * // → ['furniture']
	 *
	 * @see {@link median} - Get the middle value
	 * @see {@link avg} - Get the arithmetic mean
	 * @see {@link countBy} - Count occurrences by value
	 *
	 * @category Aggregating
	 */
	mode(key?: string): T[] | null {
		if (this.isEmpty()) return null;

		const values =
			this.#arrayItems && !key
				? this.#arrayItems
				: key
					? Object.values(this.pluck(key as Path<T>).items)
					: Object.values(this.items);
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

		return modes;
	}

	/**
	 * The `count` method returns the total number of items in the collection.
	 *
	 * @returns Number of items
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .count()
	 * // → 3
	 *
	 * @see {@link countBy} - Count items grouped by key/callback
	 * @see {@link isEmpty} - Check if collection has no items
	 * @see {@link isNotEmpty} - Check if collection has items
	 *
	 * @category Aggregating
	 */
	count(): number {
		if (this.#arrayItems) {
			return this.#arrayItems.length;
		}
		return Object.keys(this.items).length;
	}

	/**
	 * The `countBy` method counts the occurrences of values in the collection.
	 * By default it counts by the value itself, but you can pass a callback or
	 * property key to count by a derived grouping key.
	 *
	 * @example
	 * collect([1, 2, 2, 3])
	 *     .countBy()
	 * // → {'1': 1, '2': 2, '3': 1}
	 *
	 * @example To count by email domain:
	 * collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com'])
	 *     .countBy(email => email.split('@')[1])
	 * // → {'gmail.com': 2, 'yahoo.com': 1}
	 *
	 * @see {@link groupBy} - Group items instead of counting them
	 * @see {@link count} - Get total item count
	 *
	 * @category Grouping
	 */
	countBy(countBy?: ValueRetriever<T, string>): Collection<number> {
		const retriever = valueRetriever(countBy);
		const counts: Record<string, number> = {};
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);

		for (let i = 0; i < items.length; i++) {
			const groupKey = String(retriever(items[i], keys[i]));
			counts[groupKey] = (counts[groupKey] ?? 0) + 1;
		}

		return new Collection(counts, true);
	}

	/**
	 * Sum all items, or a specific key/callback result.
	 *
	 * @param keyOrCallback - Property key or callback returning number to sum
	 * @returns Sum of values, or 0 if collection is empty
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .sum()
	 * // → 6
	 *
	 * @example To sum a property:
	 * collect([
	 *   { id: 1, total: 100 },
	 *   { id: 2, total: 50 },
	 * ])
	 *   .sum('total')
	 * // → 150
	 *
	 * @see {@link avg} - Calculate average instead
	 * @see {@link min} - Get minimum value
	 * @see {@link max} - Get maximum value
	 * @see {@link count} - Count items instead
	 *
	 * @category Aggregating
	 */
	sum(keyOrCallback?: ValueRetriever<T, number>): number {
		if (this.#arrayItems) {
			const len = this.#arrayItems.length;
			if (len === 0) return 0;

			if (!keyOrCallback) {
				// No callback: only sum numbers, skip NaN and non-numbers
				let total = 0;
				for (let i = 0; i < len; i++) {
					const item = this.#arrayItems[i];
					if (typeof item === 'number' && !Number.isNaN(item)) {
						total += item;
					}
				}
				return total;
			}

			// Fast path: simple string key without dots
			if (typeof keyOrCallback === 'string' && !keyOrCallback.includes('.')) {
				const key = keyOrCallback as keyof T;
				// Probe: is first value a number?
				const first = this.#arrayItems[0][key] as unknown;
				if (typeof first === 'number') {
					// Trust: sum assuming all values are numbers (common case)
					let total = first;
					for (let i = 1; i < len; i++) {
						total += this.#arrayItems[i][key] as unknown as number;
					}
					// Verify: if valid, done (99.9% of cases)
					if (!Number.isNaN(total)) return total;
					// Rare: has NaN values, re-sum defensively
					total = 0;
					for (let i = 0; i < len; i++) {
						const num = this.#arrayItems[i][key] as unknown;
						if (typeof num === 'number' && !Number.isNaN(num)) {
							total += num;
						}
					}
					return total;
				}
			}
		}

		// Slow path: use valueRetriever for callbacks, nested keys, or non-array collections
		const retriever = valueRetriever(keyOrCallback);
		let total = 0;
		if (this.#arrayItems) {
			for (let i = 0; i < this.#arrayItems.length; i++) {
				const num = retriever(this.#arrayItems[i], i);
				if (typeof num === 'number' && !Number.isNaN(num)) {
					total += num;
				}
			}
			return total;
		}

		const items = Object.values(this.items);
		const keys = Object.keys(this.items);
		for (let i = 0; i < items.length; i++) {
			const num = retriever(items[i], keys[i]);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				total += num;
			}
		}
		return total;
	}

	/**
	 * The `avg` method returns the average value of a given key.
	 *
	 * @param keyOrCallback - Property key or callback returning number
	 * @returns Average value, or null if collection is empty
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .avg()
	 * // → 2
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Desk', price: 200 },
	 *   { name: 'Chair', price: 100 },
	 * ])
	 *   .avg('price')
	 * // → 150
	 *
	 * @see {@link sum} - Get total instead of average
	 * @see {@link min} - Get minimum value
	 * @see {@link max} - Get maximum value
	 * @see {@link median} - Get median value
	 *
	 * @category Aggregating
	 */
	avg(keyOrCallback?: ValueRetriever<T, number>): number | null {
		if (this.#arrayItems) {
			const len = this.#arrayItems.length;
			if (len === 0) return null;

			if (!keyOrCallback) {
				// No callback: only average numbers
				let total = 0;
				let count = 0;
				for (let i = 0; i < len; i++) {
					const item = this.#arrayItems[i];
					if (typeof item === 'number' && !Number.isNaN(item)) {
						total += item;
						count++;
					}
				}
				return count > 0 ? total / count : null;
			}

			// Fast path: simple string key without dots
			if (typeof keyOrCallback === 'string' && !keyOrCallback.includes('.')) {
				const key = keyOrCallback as keyof T;
				const first = this.#arrayItems[0][key] as unknown;
				if (typeof first === 'number') {
					let total = first;
					let count = 1;
					for (let i = 1; i < len; i++) {
						const num = this.#arrayItems[i][key] as unknown as number;
						total += num;
						count++;
					}
					if (!Number.isNaN(total)) return total / count;
					// Fallback for NaN
					total = 0;
					count = 0;
					for (let i = 0; i < len; i++) {
						const num = this.#arrayItems[i][key] as unknown;
						if (typeof num === 'number' && !Number.isNaN(num)) {
							total += num;
							count++;
						}
					}
					return count > 0 ? total / count : null;
				}
			}
		}

		// Slow path
		const retriever = valueRetriever(keyOrCallback);
		let total = 0;
		let count = 0;
		if (this.#arrayItems) {
			for (let i = 0; i < this.#arrayItems.length; i++) {
				const num = retriever(this.#arrayItems[i], i);
				if (typeof num === 'number' && !Number.isNaN(num)) {
					total += num;
					count++;
				}
			}
			return count > 0 ? total / count : null;
		}

		const items = Object.values(this.items);
		const keys = Object.keys(this.items);
		for (let i = 0; i < items.length; i++) {
			const num = retriever(items[i], keys[i]);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				total += num;
				count++;
			}
		}
		return count > 0 ? total / count : null;
	}

	/**
	 * The `average` method is an alias for the `avg` method.
	 *
	 * @see {@link avg} - Primary method
	 *
	 * @category Aggregating
	 */
	average(keyOrCallback?: ValueRetriever<T, number>): number | null {
		return this.avg(keyOrCallback);
	}

	/**
	 * The `min` method returns the minimum value of a given key.
	 *
	 * @param keyOrCallback - Property key or callback returning number
	 * @returns Minimum value, or null if collection is empty
	 *
	 * @example
	 * collect([3, 1, 2])
	 *     .min()
	 * // → 1
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Desk', price: 200 },
	 *   { name: 'Chair', price: 100 },
	 * ])
	 *   .min('price')
	 * // → 100
	 *
	 * @see {@link max} - Get maximum value
	 * @see {@link avg} - Get average value
	 *
	 * @category Aggregating
	 */
	min(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever(keyOrCallback);
		let min: number | null = null;
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);
		for (let i = 0; i < items.length; i++) {
			const num = retriever(items[i], keys[i]);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				if (min === null || num < min) min = num;
			}
		}
		return min;
	}

	/**
	 * The `max` method returns the maximum value of a given key.
	 *
	 * @param keyOrCallback - Property key or callback returning number
	 * @returns Maximum value, or null if collection is empty
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .max()
	 * // → 3
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Desk', price: 200 },
	 *   { name: 'Chair', price: 100 },
	 * ])
	 *   .max('price')
	 * // → 200
	 *
	 * @see {@link min} - Get minimum value
	 * @see {@link avg} - Get average value
	 *
	 * @category Aggregating
	 */
	max(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever(keyOrCallback);
		let max: number | null = null;
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);
		for (let i = 0; i < items.length; i++) {
			const num = retriever(items[i], keys[i]);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				if (max === null || num > max) max = num;
			}
		}
		return max;
	}

	/**
	 * The `percentage` method may be used to quickly determine the percentage of items in the
	 * collection that pass a given truth test.
	 *
	 * @param callback - Function that returns true for items to count
	 * @param precision - Number of decimal places (default: 2)
	 * @returns Percentage (0-100), or null if collection is empty
	 *
	 * @example
	 * collect([1, 1, 2, 2, 2, 3])
	 *     .percentage(value => value === 1)
	 * // → 33.33
	 *
	 * @example You may also specify precision:
	 * collect([
	 *   { name: 'Desk', available: true },
	 *   { name: 'Chair', available: true },
	 *   { name: 'Lamp', available: true },
	 *   { name: 'Rug', available: false },
	 * ])
	 *   .percentage(p => p.available, 1)
	 * // → 75.0
	 *
	 * @see {@link count} - Count total items
	 * @see {@link filter} - Get matching items
	 *
	 * @category Aggregating
	 */
	percentage(callback: (value: T, key: CollectionKey<CK>) => boolean, precision = 2): number | null {
		if (this.isEmpty()) return null;
		const count = this.filter(callback).count();
		return Number(((count / this.count()) * 100).toFixed(precision));
	}

	/**
	 * The `merge` method merges the given array or collection with the original collection.
	 * If a string key in the given items matches a string key in the original collection,
	 * the given item's value will overwrite the value in the original collection.
	 *
	 * @param items - Array or collection to merge into this collection
	 * @returns New collection with merged items
	 *
	 * @example To merge objects:
	 * collect({ name: 'Alice', age: 25 })
	 *     .merge({ age: 30, city: 'NYC' })
	 * // → { name: 'Alice', age: 30, city: 'NYC' }
	 *
	 * @example For arrays, items are appended:
	 * collect([1, 2])
	 *     .merge([3, 4])
	 * // → [1, 2, 3, 4]
	 *
	 * @see {@link union} - keeping original values for duplicate keys
	 * @see {@link mergeRecursive} - Merge nested objects recursively
	 * @see {@link concat} - always appending without key consideration
	 *
	 * @category Combining
	 */
	merge(items: Collectable<T>): Collection<T, CK> {
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
	 * The `mergeRecursive` method merges the given array or collection recursively with
	 * the original collection. If a string key in the given items matches a string key
	 * in the original collection, the values for these keys are merged together into an
	 * object, and this is done recursively for nested structures.
	 *
	 * @param items - Object or collection to merge recursively
	 * @returns New collection with deeply merged items
	 *
	 * @example For recursive merge:
	 * collect({ user: { name: 'Alice', settings: { theme: 'dark' } } })
	 *     .mergeRecursive({ user: { settings: { language: 'en' } } })
	 * // → { user: { name: 'Alice', settings: { theme: 'dark', language: 'en' } } }
	 *
	 * @see {@link merge} - Shallow merge (overwrites nested objects)
	 * @see {@link replaceRecursive} - Similar but overwrites instead of merging arrays
	 *
	 * @category Combining
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
	 * The `union` method adds the given array to the collection. If the given array
	 * contains keys that are already in the original collection, the original collection's
	 * values will be preferred. This is the opposite of `merge` which prefers new values.
	 *
	 * @param items - Object or collection to union with
	 * @returns New collection with original values preserved for duplicate keys
	 *
	 * @example To prefer original values:
	 * collect({ a: 1, b: 2 })
	 *     .union({ b: 3, c: 4 })
	 * // → { a: 1, b: 2, c: 4 }
	 *
	 * @example To fill in defaults:
	 * const userSettings = collect(user.settings)
	 *     .union(defaultSettings)
	 * // Original settings preserved, defaults fill gaps
	 *
	 * @see {@link merge} - preferring new values for duplicate keys
	 *
	 * @category Combining
	 */
	union(items: Collectable<T>): Collection<T, CK> {
		let other: Record<string, T>;
		if ('all' in items && typeof (items as CollectionParam<T>).all === 'function') {
			other = (items as CollectionParam<T>).all() as Record<string, T>;
		} else {
			other = items as Record<string, T>;
		}
		return new Collection({ ...other, ...this.items });
	}

	/**
	 * The `combine` method combines the values of the collection, as keys, with the
	 * values of another array or collection. This is useful for creating key-value
	 * pairs from two separate lists.
	 *
	 * @param values - Array or collection to use as values
	 * @returns New associative collection with this collection's values as keys
	 *
	 * @example To create key-value mapping:
	 * collect(['name', 'age', 'city'])
	 *     .combine(['Alice', 30, 'NYC'])
	 * // → { name: 'Alice', age: 30, city: 'NYC' }
	 *
	 * @example To build form data:
	 * collect(fieldNames)
	 *     .combine(fieldValues)
	 * // → { field1: value1, field2: value2, ... }
	 *
	 * @see {@link zip} - Pair by index into nested arrays instead of key-value
	 * @see {@link pluck} - Extract key-value pairs from objects
	 *
	 * @category Combining
	 */
	combine<U>(values: Arrayable<U>): Collection<U, 'assoc'> {
		const keys = this.#arrayItems ?? Object.values(this.items);
		const vals = arrayableToArray(values);
		const result: Record<string, U> = {};
		for (let i = 0; i < keys.length && i < vals.length; i++) {
			result[String(keys[i])] = vals[i];
		}
		return new Collection(result);
	}

	/**
	 * The `crossJoin` method cross joins the collection's values among the given arrays
	 * or collections, returning a Cartesian product with all possible permutations.
	 *
	 * @param lists - One or more arrays or collections to cross join with
	 * @returns Collection of arrays representing all combinations
	 *
	 * @example For a two-way cross join:
	 * collect(['S', 'M', 'L'])
	 *     .crossJoin(['red', 'blue'])
	 * // → [
	 * //   ['S', 'red'], ['S', 'blue'],
	 * //   ['M', 'red'], ['M', 'blue'],
	 * //   ['L', 'red'], ['L', 'blue']
	 * // ]
	 *
	 * @example For a three-way cross join:
	 * collect([1, 2])
	 *     .crossJoin(['a', 'b'], [true, false])
	 * // → [[1, 'a', true], [1, 'a', false], [1, 'b', true], ...]
	 *
	 * @see {@link zip} - Pair by index instead of creating all combinations
	 *
	 * @category Combining
	 */
	crossJoin<U>(...lists: Arrayable<U>[]): Collection<(T | U)[]> {
		const arrays = lists.map((list) => arrayableToArray(list));
		const result: (T | U)[][] = [];
		const values = this.#arrayItems ?? Object.values(this.items);

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

		combine([], [values, ...arrays]);
		return new Collection(result);
	}

	/**
	 * The `concat` method appends the given array or collection's values onto the end
	 * of another collection. Unlike `merge`, this method does not consider keys and
	 * simply appends all values to the end.
	 *
	 * @param source - Array or collection to concatenate
	 * @returns New collection with values appended
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .concat([4, 5, 6])
	 * // → [1, 2, 3, 4, 5, 6]
	 *
	 * @example You may chain multiple concatenations:
	 * collect(['a'])
	 *     .concat(['b', 'c'])
	 *     .concat(['d'])
	 * // → ['a', 'b', 'c', 'd']
	 *
	 * @see {@link merge} - Merge with key consideration
	 * @see {@link push} - Append single items (mutates collection)
	 *
	 * @category Combining
	 */
	concat(source: Arrayable<T>): Collection<T> {
		if (this.#arrayItems) {
			const other = arrayableToArray(source);
			return new Collection([...this.#arrayItems, ...other]);
		}
		const result = new Collection(this);
		const items = arrayableToArray(source);
		for (const item of items) {
			result.push(item);
		}
		return result;
	}

	/**
	 * The `put` method sets the given key and value in the collection. If the key
	 * already exists, its value will be overwritten. This method mutates the collection.
	 *
	 * @param key - The key to set
	 * @param value - The value to assign
	 * @returns The collection instance for chaining
	 *
	 * @example
	 * collect({ a: 1, b: 2 })
	 *     .put('c', 3)
	 *     .put('a', 10)
	 * // → { a: 10, b: 2, c: 3 }
	 *
	 * @example To build an object dynamically:
	 * collect({})
	 *     .put('name', 'Alice')
	 *     .put('age', 30)
	 * // → { name: 'Alice', age: 30 }
	 *
	 * @see {@link push} - Append without specifying a key
	 * @see {@link get} - Retrieve a value by key
	 * @see {@link pull} - Get and remove by key
	 *
	 * @category Combining
	 */
	put(key: string | number, value: T): this {
		this.invalidateArrayItems();
		this.items[String(key)] = value;
		return this;
	}

	/**
	 * The `pull` method removes and returns an item from the collection by its
	 * key. If the key does not exist, the default value is returned. This method
	 * mutates the collection.
	 *
	 * @param key - The key of the item to remove
	 * @param defaultValue - Optional value to return if key not found
	 * @returns The removed item, or the default value
	 *
	 * @example
	 * const data = collect({ name: 'Taylor', role: 'admin' })
	 * data.pull('name')
	 * // → 'Taylor'
	 * data.all()
	 * // → { role: 'admin' }
	 *
	 * @example You may pass a default value:
	 * collect({ a: 1 }).pull('missing', 'default')
	 * // → 'default'
	 *
	 * @see {@link get} - Get without removing
	 * @see {@link pop} - Remove and return the last item
	 * @see {@link shift} - Remove and return the first item
	 * @see {@link forget} - Remove without returning
	 *
	 * @category Finding
	 */
	pull(key: string | number): T | undefined;
	pull<D>(key: string | number, defaultValue: D | (() => D)): T | D;
	pull<D = undefined>(key: string | number, defaultValue?: D | (() => D)): T | D | undefined {
		const k = String(key);
		if (k in this.items) {
			this.invalidateArrayItems();
			const value = this.items[k];
			delete this.items[k];
			if (!Number.isNaN(Number(k))) {
				this.invalidateNextNumericKey();
			}
			return value;
		}
		return typeof defaultValue === 'function' ? (defaultValue as () => D)() : defaultValue;
	}

	/**
	 * The `push` method appends one or more items to the end of the collection.
	 * This method mutates the collection and returns it for chaining.
	 *
	 * @param values - One or more values to append
	 * @returns The collection instance for chaining
	 *
	 * @example To append a single item:
	 * collect([1, 2, 3])
	 *     .push(4)
	 * // → [1, 2, 3, 4]
	 *
	 * @example To append multiple items:
	 * collect(['a', 'b'])
	 *     .push('c', 'd', 'e')
	 * // → ['a', 'b', 'c', 'd', 'e']
	 *
	 * @see {@link prepend} - Add to the beginning
	 * @see {@link put} - Set by key
	 * @see {@link concat} - Append without mutation
	 * @see {@link add} - push alias
	 *
	 * @category Combining
	 */
	push(...values: T[]): this {
		this.invalidateArrayItems();
		let nextKey = this.getNextNumericKey();
		for (const value of values) {
			this.items[String(nextKey++)] = value;
		}
		this._nextNumericKey = nextKey;
		return this;
	}

	/**
	 * The `prepend` method adds an item to the beginning of the collection.
	 * You may optionally pass a second argument to set the key of the prepended item.
	 * This method mutates the collection.
	 *
	 * @param value - The value to prepend
	 * @param key - Optional key for the prepended item
	 * @returns The collection instance for chaining
	 *
	 * @example To prepend a value:
	 * collect([2, 3, 4])
	 *     .prepend(1)
	 * // → [1, 2, 3, 4]
	 *
	 * @example To prepend with a key:
	 * collect({ b: 2, c: 3 })
	 *     .prepend(1, 'a')
	 * // → { a: 1, b: 2, c: 3 }
	 *
	 * @see {@link push} - Add to the end
	 * @see {@link unshift} - Prepend multiple values
	 *
	 * @category Combining
	 */
	prepend(value: T, key?: string | number): this {
		this.invalidateArrayItems();
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
	 * The `unshift` method is an alias for the `prepend` method, but accepts multiple
	 * values. It adds one or more items to the beginning of the collection, preserving
	 * their order. This method mutates the collection.
	 *
	 * @param values - One or more values to prepend
	 * @returns The collection instance for chaining
	 *
	 * @example To prepend multiple values:
	 * collect([4, 5, 6])
	 *     .unshift(1, 2, 3)
	 * // → [1, 2, 3, 4, 5, 6]
	 *
	 * @see {@link prepend} - Add single item with optional key
	 * @see {@link push} - Add to the end
	 *
	 * @category Combining
	 */
	unshift(...values: T[]): this {
		this.invalidateArrayItems();
		const currentValues = Object.values(this.items);
		this.items = Object.fromEntries([...values, ...currentValues].map((v, i) => [String(i), v]));
		return this;
	}

	/**
	 * The `pop` method removes and returns the last item from the collection.
	 * You may pass a count to remove and return multiple items from the end.
	 * If the collection is empty, `null` is returned.
	 *
	 * @param count - Optional number of items to pop (default: 1)
	 * @returns The popped item(s), or null if empty
	 *
	 * @example For a single item:
	 * const data = collect([1, 2, 3, 4, 5])
	 * data.pop()
	 * // → 5
	 * data.all()
	 * // → [1, 2, 3, 4]
	 *
	 * @example For multiple items:
	 * collect([1, 2, 3, 4, 5]).pop(2)
	 * // → Collection [4, 5]
	 *
	 * @example For an empty collection:
	 * collect([]).pop()
	 * // → null
	 *
	 * @see {@link shift} - Remove from the beginning
	 * @see {@link pull} - Remove by key
	 * @see {@link last} - Get last without removing
	 *
	 * @category Finding
	 */
	pop(): T | null;
	pop(count: 1): T | null;
	pop(count: number): Collection<T>;
	pop(count = 1): T | Collection<T> | null {
		if (count < 1) {
			return new Collection<T>([]);
		}

		const keys = Object.keys(this.items);
		if (keys.length === 0) {
			return count === 1 ? null : new Collection<T>([]);
		}

		this.invalidateArrayItems();
		if (count === 1) {
			const lastKey = keys[keys.length - 1];
			const value = this.items[lastKey];
			delete this.items[lastKey];
			this.invalidateNextNumericKey();
			return value;
		}

		const results: T[] = [];
		const toRemove = Math.min(count, keys.length);
		const keysToRemove = keys.slice(-toRemove);
		for (const key of keysToRemove) {
			results.push(this.items[key]);
			delete this.items[key];
		}
		this.invalidateNextNumericKey();
		return new Collection(results);
	}

	/**
	 * The `shift` method removes and returns the first item from the collection.
	 * You may pass a count to remove and return multiple items from the beginning.
	 * If the collection is empty, `null` is returned.
	 *
	 * @param count - Optional number of items to shift (default: 1)
	 * @returns The shifted item(s), or null if empty
	 * @throws {InvalidArgumentException} If count is negative
	 *
	 * @example For a single item:
	 * const data = collect([1, 2, 3, 4, 5])
	 * data.shift()
	 * // → 1
	 * data.all()
	 * // → [2, 3, 4, 5]
	 *
	 * @example For multiple items:
	 * collect([1, 2, 3, 4, 5]).shift(2)
	 * // → Collection [1, 2]
	 *
	 * @example For an empty collection:
	 * collect([]).shift()
	 * // → null
	 *
	 * @see {@link pop} - Remove from the end
	 * @see {@link pull} - Remove by key
	 * @see {@link first} - Get first without removing
	 *
	 * @category Finding
	 */
	shift(): T | null;
	shift(count: 1): T | null;
	shift(count: number): Collection<T>;
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

		this.invalidateArrayItems();
		if (count === 1) {
			const firstKey = keys[0];
			const value = this.items[firstKey];
			delete this.items[firstKey];
			this.invalidateNextNumericKey();
			return value;
		}

		const results: T[] = [];
		const toRemove = Math.min(count, keys.length);
		const keysToRemove = keys.slice(0, toRemove);
		for (const key of keysToRemove) {
			results.push(this.items[key]);
			delete this.items[key];
		}
		this.invalidateNextNumericKey();
		return new Collection(results);
	}

	/**
	 * The `add` method is an alias for the `push` method. It appends a single item
	 * to the end of the collection. This method mutates the collection.
	 *
	 * @param item - The item to add
	 * @returns The collection instance for chaining
	 *
	 * @example To add an item:
	 * collect([1, 2, 3])
	 *     .add(4)
	 * // → [1, 2, 3, 4]
	 *
	 * @see {@link push} - Primary method (supports multiple items)
	 *
	 * @category Combining
	 */
	add(item: T): this {
		return this.push(item);
	}

	/**
	 * The `forget` method removes an item from the collection by its key.
	 *
	 * Unlike `except`, this method modifies the collection in place. For numeric keys,
	 * the collection does not re-index the remaining items.
	 *
	 * @param keys - Key or keys to remove
	 * @returns This collection (mutated)
	 *
	 * @example To remove a single key:
	 * collect({ a: 1, b: 2, c: 3 })
	 *     .forget('b')
	 * // → Collection { a: 1, c: 3 }
	 *
	 * @example To remove multiple keys:
	 * collect({ a: 1, b: 2, c: 3 })
	 *     .forget(['a', 'c'])
	 * // → Collection { b: 2 }
	 *
	 * @see {@link except} - returning new collection without specified keys
	 * @see {@link pull} - Remove and return a single value
	 *
	 * @category Transforming
	 */
	forget(keys: string | number | (string | number)[]): this {
		this.invalidateArrayItems();
		const keysArray = Array.isArray(keys) ? keys : [keys];
		let hasNumericKey = false;
		for (const key of keysArray) {
			const k = String(key);
			if (!hasNumericKey && !Number.isNaN(Number(k))) {
				hasNumericKey = true;
			}
			delete this.items[k];
		}
		if (hasNumericKey) {
			this.invalidateNextNumericKey();
		}
		return this;
	}

	/**
	 * The `except` method returns all items in the collection except for those with the specified keys.
	 *
	 * @param keys - Keys to exclude from the result
	 * @returns New collection without the specified keys
	 *
	 * @example
	 * collect({ a: 1, b: 2, c: 3 })
	 *     .except(['a', 'c'])
	 * // → Collection { b: 2 }
	 *
	 * @see {@link only} - Include only specified keys
	 * @see {@link filter} - Filter by custom callback
	 *
	 * @category Filtering
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
	 * The `only` method returns the items in the collection with the specified keys.
	 *
	 * @param keys - Keys to include in the result
	 * @returns New collection with only the specified keys
	 *
	 * @example
	 * collect({ a: 1, b: 2, c: 3 })
	 *     .only(['a', 'c'])
	 * // → Collection { a: 1, c: 3 }
	 *
	 * @see {@link except} - Exclude specified keys
	 * @see {@link select} - Pick specific properties from each item
	 *
	 * @category Filtering
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
	 * The `select` method selects the given keys from each item in the
	 * collection, similar to a SQL SELECT statement. This is useful for
	 * extracting only the properties you need from complex objects.
	 *
	 * @param keys - Array or collection of property keys to select
	 * @returns New collection with only the selected properties
	 *
	 * @example
	 * const users = collect([
	 *     { id: 1, name: 'Taylor', email: 'taylor@example.com', role: 'admin' },
	 *     { id: 2, name: 'Abigail', email: 'abigail@example.com', role: 'user' }
	 * ])
	 * users.select(['name', 'email'])
	 * // → Collection [{ name: 'Taylor', email: '...' }, { name: 'Abigail', email: '...' }]
	 *
	 * @example For nested properties:
	 * collect([{ user: { name: 'Taylor' }, meta: { active: true } }])
	 *     .select(['user.name'])
	 * // → Collection [{ 'user.name': 'Taylor' }]
	 *
	 * @see {@link pluck} - Extract a single property as values
	 * @see {@link only} - Select keys from the collection itself
	 * @see {@link map} - Transform items with full control
	 *
	 * @category Finding
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
	 * The `has` method determines if a given key exists in the collection.
	 *
	 * When an array of keys is passed, returns `true` only if ALL keys exist.
	 *
	 * @param key - Key or array of keys to check
	 * @returns True if key(s) exist, false otherwise
	 *
	 * @example For a single key:
	 * collect({ a: 1, b: 2 })
	 *     .has('a')
	 * // → true
	 *
	 * @example For multiple keys (all must exist):
	 * collect({ a: 1, b: 2 })
	 *     .has(['a', 'c'])
	 * // → false (c does not exist)
	 *
	 * @see {@link hasAny} - checking if any key exists
	 * @see {@link contains} - Check if a value exists
	 *
	 * @category Checking
	 */
	has(key: string | number | (string | number)[]): boolean {
		const keys = Array.isArray(key) ? key : [key];
		for (const k of keys) {
			if (!(String(k) in this.items)) return false;
		}
		return true;
	}

	/**
	 * The `hasAny` method determines if any of the given keys exist in the collection.
	 *
	 * Returns `true` if at least one of the provided keys exists. Returns `false` for
	 * empty collections regardless of the keys provided.
	 *
	 * @param key - Key or array of keys to check
	 * @returns True if any key exists, false otherwise
	 *
	 * @example
	 * collect({ a: 1, b: 2 })
	 *     .hasAny(['b', 'c', 'd'])
	 * // → true (b exists)
	 *
	 * @example If no keys match:
	 * collect({ a: 1, b: 2 })
	 *     .hasAny(['c', 'd'])
	 * // → false
	 *
	 * @see {@link has} - checking if all keys exist
	 * @see {@link contains} - Check if a value exists
	 *
	 * @category Checking
	 */
	hasAny(key: string | number | (string | number)[]): boolean {
		if (this.isEmpty()) return false;
		const keys = Array.isArray(key) ? key : [key];
		for (const k of keys) {
			if (String(k) in this.items) return true;
		}
		return false;
	}

	/**
	 * Group items by a key or callback result.
	 *
	 * @param groupBy - Property key or callback returning group key(s)
	 * @param preserveKeys - Keep original keys within groups
	 * @returns Collection of Collections, keyed by group
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Taylor', role: 'admin' },
	 *   { name: 'Abigail', role: 'editor' },
	 *   { name: 'James', role: 'editor' },
	 * ])
	 *   .groupBy('role')
	 * // → {
	 * //     admin: [{ name: 'Taylor', role: 'admin' }],
	 * //     editor: [
	 * //       { name: 'Abigail', role: 'editor' },
	 * //       { name: 'James', role: 'editor' },
	 * //     ],
	 * //   }
	 *
	 * @example You may also pass a callback:
	 * collect([
	 *   { id: 1, total: 150 },
	 *   { id: 2, total: 50 },
	 *   { id: 3, total: 200 },
	 * ])
	 *   .groupBy(o => o.total > 100 ? 'large' : 'small')
	 * // → {
	 * //     large: [{ id: 1, total: 150 }, { id: 3, total: 200 }],
	 * //     small: [{ id: 2, total: 50 }],
	 * //   }
	 *
	 * @see {@link keyBy} - Similar but keeps only the last item per key
	 * @see {@link partition} - Split into two groups by condition
	 * @see {@link chunk} - Split into groups of fixed size
	 * @see {@link countBy} - Count items per group instead of collecting
	 *
	 * @category Grouping
	 */
	groupBy(groupBy: ValueRetriever<T, string | string[]>, preserveKeys = false): Collection<Collection<T>> {
		// Fast path: simple string key on array-backed collection without preserveKeys
		if (this.#arrayItems && !preserveKeys && typeof groupBy === 'string' && !groupBy.includes('.')) {
			const arr = this.#arrayItems;
			const k = groupBy as keyof T;
			const len = arr.length;
			const rawGroups: Record<string, T[]> = Object.create(null);

			// Single pass: group items directly into raw arrays
			for (let i = 0; i < len; i++) {
				const item = arr[i];
				let gk = item[k] as unknown;
				if (typeof gk === 'boolean') {
					gk = gk ? '1' : '0';
				} else if (gk === null || gk === undefined) {
					gk = '';
				} else {
					gk = String(gk);
				}
				const key = gk as string;
				let group = rawGroups[key];
				if (!group) {
					group = [];
					rawGroups[key] = group;
				}
				group.push(item);
			}

			// Wrap each group as Collection
			const wrapped: Record<string, Collection<T>> = Object.create(null);
			const keys = Object.keys(rawGroups);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				wrapped[key] = new Collection(rawGroups[key]);
			}
			return new Collection(wrapped, true);
		}

		const retriever = valueRetriever(groupBy);
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);

		// Use Map for O(1) index tracking instead of O(n) Object.keys().length
		const results = new Map<string, { items: Record<string, T>; nextIndex: number }>();

		for (let i = 0; i < items.length; i++) {
			const key = keys[i];
			const value = items[i];
			let groupKeys = retriever(value, key);
			if (!Array.isArray(groupKeys)) {
				groupKeys = [groupKeys] as unknown as string[];
			}

			for (let groupKey of groupKeys as string[]) {
				if (typeof groupKey === 'boolean') {
					groupKey = groupKey ? '1' : '0';
				} else if (groupKey === null || groupKey === undefined) {
					groupKey = '';
				} else {
					groupKey = String(groupKey);
				}

				let group = results.get(groupKey);
				if (!group) {
					group = { items: {}, nextIndex: 0 };
					results.set(groupKey, group);
				}

				if (preserveKeys) {
					group.items[key] = value;
				} else {
					group.items[String(group.nextIndex++)] = value;
				}
			}
		}

		const wrapped: Record<string, Collection<T>> = {};
		for (const [gk, group] of results) {
			wrapped[gk] = new Collection(group.items, this.isAssociative);
		}
		return new Collection(wrapped, true);
	}

	/**
	 * Key the collection by a field or callback result.
	 *
	 * If multiple items have the same key, only the last one is kept.
	 *
	 * @param keyBy - Property key or callback returning the new key
	 * @returns New collection keyed by the specified field
	 *
	 * @example
	 * collect([
	 *   { id: 1, name: 'Taylor' },
	 *   { id: 2, name: 'Abigail' },
	 * ])
	 *   .keyBy('id')
	 * // → {
	 * //     1: { id: 1, name: 'Taylor' },
	 * //     2: { id: 2, name: 'Abigail' },
	 * //   }
	 *
	 * @see {@link groupBy} - Similar but keeps all items per key
	 * @see {@link mapWithKeys} - Transform and key in one step
	 *
	 * @category Grouping
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
	 * Split the collection into two groups: items passing the test and items failing.
	 *
	 * @param keyOrCallback - Callback function or key/operator/value syntax
	 * @param operator - Comparison operator when using key/value syntax
	 * @param value - Value to compare against
	 * @returns Tuple of [passing, failing] collections
	 *
	 * @example
	 * const [active, inactive] = collect([
	 *   { name: 'Taylor', active: true },
	 *   { name: 'Abigail', active: false },
	 *   { name: 'James', active: true },
	 * ]).partition(u => u.active)
	 * // active  → [{ name: 'Taylor', ... }, { name: 'James', ... }]
	 * // inactive → [{ name: 'Abigail', ... }]
	 *
	 * @example You may also use key/value syntax:
	 * const [admins, others] = collect([
	 *   { name: 'Taylor', role: 'admin' },
	 *   { name: 'Abigail', role: 'editor' },
	 * ]).partition('role', 'admin')
	 * // admins → [{ name: 'Taylor', role: 'admin' }]
	 * // others → [{ name: 'Abigail', role: 'editor' }]
	 *
	 * @see {@link groupBy} - Split into multiple groups
	 * @see {@link filter} - Keep only passing items
	 *
	 * @category Grouping
	 */
	partition<S extends T>(
		callback: (value: T, key: string) => value is S,
	): [Collection<S, CK>, Collection<Exclude<T, S>, CK>];
	partition(
		keyOrCallback: string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): [Collection<T, CK>, Collection<T, CK>];
	partition(
		keyOrCallback: string | ((value: T, key: string) => boolean),
		operator?: unknown,
		value?: unknown,
	): [Collection<T, CK>, Collection<T, CK>] | [Collection<T, CK>, Collection<Exclude<T, T>, CK>] {
		let callback: (value: T, key: string) => boolean;
		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
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

	/**
	 * The `search` method searches the collection for the given value and
	 * returns its key if found. If the item is not found, `false` is returned.
	 * By default, comparison uses loose equality. Pass `true` as the second
	 * argument for strict comparison.
	 *
	 * @param value - Value to search for, or a callback returning true for a match
	 * @param strict - Use strict equality comparison (default: false)
	 * @returns The key of the found item, or false if not found
	 *
	 * @example
	 * collect([2, 4, 6, 8]).search(4)
	 * // → '1'
	 *
	 * @example You may also pass a callback:
	 * collect([2, 4, 6, 8]).search(item => item > 5)
	 * // → '2'
	 *
	 * @example For strict comparison:
	 * collect([2, 4, '6', 8]).search('6', true)
	 * // → '2'
	 *
	 * @see {@link contains} - Check if a value exists
	 * @see {@link first} - Get the first matching item
	 * @see {@link firstWhere} - Find by key/value pair
	 *
	 * @category Finding
	 */
	search(value: T | ((value: T, key: string) => boolean), strict = false): string | false {
		if (this.#arrayItems) {
			if (useAsCallable(value)) {
				const cb = value as (value: T, key: string) => boolean;
				for (let i = 0; i < this.#arrayItems.length; i++) {
					if (cb(this.#arrayItems[i], String(i))) return String(i);
				}
				return false;
			}
			for (let i = 0; i < this.#arrayItems.length; i++) {
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				if (strict ? this.#arrayItems[i] === value : this.#arrayItems[i] == value) {
					return String(i);
				}
			}
			return false;
		}
		if (!useAsCallable(value)) {
			for (const [key, item] of Object.entries(this.items)) {
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
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

	before(value: T | ((value: T, key: string) => boolean), strict = false): T | null {
		const key = this.search(value, strict);
		if (key === false) return null;

		const keysArray = Object.values(this.keys().items);
		const position = keysArray.indexOf(key);
		if (position === 0) return null;

		return this.get(keysArray[position - 1]) ?? null;
	}

	after(value: T | ((value: T, key: string) => boolean), strict = false): T | null {
		const key = this.search(value, strict);
		if (key === false) return null;

		const keysArray = Object.values(this.keys().items);
		const position = keysArray.indexOf(key);
		if (position === keysArray.length - 1) return null;

		return this.get(keysArray[position + 1]) ?? null;
	}

	/**
	 * The `sort` method sorts the collection.
	 *
	 * The sorted collection keeps the original keys, but the order of items changes. You may
	 * pass a custom comparison callback for more control over sorting behavior.
	 *
	 * @param callback - Optional comparison function returning negative/zero/positive
	 * @returns New sorted collection
	 *
	 * @example
	 * collect([5, 3, 1, 2, 4])
	 *     .sort()
	 * // → [1, 2, 3, 4, 5]
	 *
	 * @example You may pass a custom comparator:
	 * collect([
	 *   { name: 'Taylor', age: 32 },
	 *   { name: 'Abigail', age: 28 },
	 * ])
	 *   .sort((a, b) => a.age - b.age)
	 * // → [
	 * //     { name: 'Abigail', age: 28 },
	 * //     { name: 'Taylor', age: 32 },
	 * //   ]
	 *
	 * @see {@link sortDesc} - Sort in descending order
	 * @see {@link sortBy} - Sort by property or callback
	 * @see {@link sortKeys} - Sort by keys instead of values
	 * @see {@link reverse} - Reverse the order
	 *
	 * @category Sorting
	 */
	sort(callback?: ((a: T, b: T) => number) | number): Collection<T> {
		const values = this.#arrayItems ? [...this.#arrayItems] : [...Object.values(this.items)];

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
	 * The `sortDesc` method sorts the collection in the opposite order as the `sort` method.
	 *
	 * @param _options - Unused, kept for Laravel API compatibility
	 * @returns New collection sorted in descending order
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .sortDesc()
	 * // → [5, 4, 3, 2, 1]
	 *
	 * @see {@link sort} - Sort in ascending order
	 * @see {@link sortByDesc} - Sort by property in descending order
	 *
	 * @category Sorting
	 */
	sortDesc(_options?: number): Collection<T> {
		const values = this.#arrayItems ? [...this.#arrayItems] : [...Object.values(this.items)];
		values.sort((a, b) => {
			if (a < b) return 1;
			if (a > b) return -1;
			return 0;
		});
		return new Collection(values);
	}

	/**
	 * The `sortBy` method sorts the collection by the given key.
	 *
	 * The sorted collection keeps the original array keys, so in the following example
	 * we will use the `values` method to reset the keys to consecutively numbered indexes.
	 *
	 * @param callback - Property key or callback returning value to sort by
	 * @param _options - Unused, kept for Laravel API compatibility
	 * @param descending - Sort in descending order instead
	 * @returns New sorted collection
	 *
	 * @example
	 * collect([
	 *   { name: 'Taylor', age: 32 },
	 *   { name: 'Abigail', age: 28 },
	 * ])
	 *   .sortBy('name')
	 * // → [
	 * //     { name: 'Abigail', age: 28 },
	 * //     { name: 'Taylor', age: 32 },
	 * //   ]
	 *
	 * @example You may also pass a callback:
	 * collect([
	 *   { name: 'Taylor', age: 32 },
	 *   { name: 'Abigail', age: 28 },
	 * ])
	 *   .sortBy(u => u.age)
	 * // → [
	 * //     { name: 'Abigail', age: 28 },
	 * //     { name: 'Taylor', age: 32 },
	 * //   ]
	 *
	 * @see {@link sortByDesc} - Sort in descending order
	 * @see {@link sort} - Sort with custom comparator
	 * @see {@link sortKeys} - Sort by keys instead of values
	 * @see {@link reverse} - Reverse the order
	 *
	 * @category Sorting
	 */
	sortBy(callback: ValueRetriever<T, unknown>, _options?: number, descending = false): Collection<T> {
		const retriever = valueRetriever(callback as ValueRetriever<T, unknown>);
		if (this.#arrayItems) {
			const indexed = this.#arrayItems.map((v, i) => ({ v, i }));
			indexed.sort((a, b) => {
				const valueA = retriever(a.v, a.i) as string | number;
				const valueB = retriever(b.v, b.i) as string | number;
				let result = 0;
				if (valueA < valueB) result = -1;
				else if (valueA > valueB) result = 1;
				return descending ? -result : result;
			});
			return new Collection(indexed.map((x) => x.v));
		}
		const entries = Object.entries(this.items);

		entries.sort(([keyA, a], [keyB, b]) => {
			const valueA = retriever(a, keyA) as string | number;
			const valueB = retriever(b, keyB) as string | number;
			let result = 0;
			if (valueA < valueB) result = -1;
			else if (valueA > valueB) result = 1;
			return descending ? -result : result;
		});

		return new Collection(entries.map(([, v]) => v));
	}

	/**
	 * The `sortByDesc` method sorts the collection in the opposite order as the `sortBy` method.
	 *
	 * This method has the same signature as `sortBy`, but will sort in descending order.
	 *
	 * @param callback - Property key or callback returning value to sort by
	 * @param options - Unused, kept for Laravel API compatibility
	 * @returns New collection sorted in descending order
	 *
	 * @example
	 * collect([
	 *   { name: 'Taylor', age: 32 },
	 *   { name: 'Abigail', age: 28 },
	 * ])
	 *   .sortByDesc('age')
	 * // → [
	 * //     { name: 'Taylor', age: 32 },
	 * //     { name: 'Abigail', age: 28 },
	 * //   ]
	 *
	 * @example You may also pass a callback:
	 * collect([
	 *   { name: 'Chair', price: 100 },
	 *   { name: 'Desk', price: 200 },
	 * ])
	 *   .sortByDesc(p => p.price)
	 * // → [
	 * //     { name: 'Desk', price: 200 },
	 * //     { name: 'Chair', price: 100 },
	 * //   ]
	 *
	 * @see {@link sortBy} - Sort in ascending order
	 * @see {@link sortDesc} - Sort simple values descending
	 *
	 * @category Sorting
	 */
	sortByDesc(callback: ValueRetriever<T, unknown>, options?: number): Collection<T> {
		return this.sortBy(callback as ValueRetriever<T, unknown>, options, true);
	}

	/**
	 * The `sortKeys` method sorts the collection by the keys of the underlying associative array.
	 *
	 * Uses locale-aware string comparison for key ordering.
	 *
	 * @param _options - Unused, kept for Laravel API compatibility
	 * @param descending - Sort in descending order instead
	 * @returns New collection with sorted keys
	 *
	 * @example
	 * collect({ b: 2, a: 1, c: 3 })
	 *     .sortKeys()
	 * // → { a: 1, b: 2, c: 3 }
	 *
	 * @see {@link sortKeysDesc} - Sort keys in descending order
	 * @see {@link sortKeysUsing} - Sort keys with custom callback
	 * @see {@link sortBy} - Sort by values
	 *
	 * @category Sorting
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
	 * The `sortKeysDesc` method sorts the collection by the keys in descending order.
	 *
	 * @param options - Unused, kept for Laravel API compatibility
	 * @returns New collection with keys sorted in descending order
	 *
	 * @example
	 * collect({ a: 1, b: 2, c: 3 })
	 *     .sortKeysDesc()
	 * // → { c: 3, b: 2, a: 1 }
	 *
	 * @see {@link sortKeys} - Sort keys in ascending order
	 * @see {@link sortKeysUsing} - Sort keys with custom callback
	 *
	 * @category Sorting
	 */
	sortKeysDesc(options?: number): Collection<T> {
		return this.sortKeys(options, true);
	}

	/**
	 * The `sortKeysUsing` method sorts the collection by its keys using a callback.
	 *
	 * The callback must be a comparison function returning a negative integer, zero, or
	 * a positive integer to indicate sort order.
	 *
	 * @param callback - Comparison function receiving two keys to compare
	 * @returns New collection with keys sorted by callback
	 *
	 * @example For natural sorting:
	 * collect({ 'item2': 'b', 'item10': 'c', 'item1': 'a' })
	 *     .sortKeysUsing((a, b) => a.localeCompare(b, undefined, { numeric: true }))
	 * // → { item1: 'a', item2: 'b', item10: 'c' }
	 *
	 * @see {@link sortKeys} - Sort keys alphabetically
	 * @see {@link sortKeysDesc} - Sort keys in descending order
	 *
	 * @category Sorting
	 */
	sortKeysUsing(callback: (a: string, b: string) => number): Collection<T> {
		const entries = Object.entries(this.items);
		entries.sort(([a], [b]) => callback(a, b));
		return new Collection(Object.fromEntries(entries));
	}

	/**
	 * The `skip` method returns a new collection without the first N items.
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .skip(2)
	 * // → [3, 4, 5]
	 *
	 * @see {@link take} - Take the first N items
	 * @see {@link slice} - Skip and take in one call
	 * @see {@link skipUntil} - Skip until a condition is met
	 * @see {@link skipWhile} - Skip while a condition is true
	 *
	 * @category Filtering
	 */
	skip(count: number): Collection<T> {
		return this.slice(count);
	}

	/**
	 * The `skipUntil` method skips items until the given callback returns true.
	 * The matching item and all remaining items are returned as a new collection.
	 * You may also pass a value instead of a callback.
	 *
	 * @example
	 * collect([1, 2, 3, 4])
	 *     .skipUntil(number => number >= 3)
	 * // → [3, 4]
	 *
	 * @example You may also pass a value:
	 * collect(['a', 'b', 'c', 'd'])
	 *     .skipUntil('c')
	 * // → ['c', 'd']
	 *
	 * @see {@link skipWhile} - Skip while condition is true
	 * @see {@link takeUntil} - Take items until condition is met
	 *
	 * @category Filtering
	 */
	skipUntil(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;
		if (this.#arrayItems) {
			let startIdx = 0;
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (callback(this.#arrayItems[i], String(i))) {
					startIdx = i;
					break;
				}
				if (i === this.#arrayItems.length - 1) {
					startIdx = this.#arrayItems.length;
				}
			}
			return new Collection(this.#arrayItems.slice(startIdx));
		}

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
	 * The `skipWhile` method skips items while the given callback returns true.
	 * Once the callback returns false, all remaining items are returned as a
	 * new collection.
	 *
	 * @example
	 * collect([1, 1, 2, 3, 1])
	 *     .skipWhile(number => number < 2)
	 * // → [2, 3, 1]
	 *
	 * @see {@link skipUntil} - Skip until condition becomes true
	 * @see {@link takeWhile} - Take while condition is true
	 *
	 * @category Filtering
	 */
	skipWhile(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;
		if (this.#arrayItems) {
			let startIdx = this.#arrayItems.length;
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (!callback(this.#arrayItems[i], String(i))) {
					startIdx = i;
					break;
				}
			}
			return new Collection(this.#arrayItems.slice(startIdx));
		}

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
	 * The `take` method returns a new collection with the specified number of
	 * items. You may pass a negative integer to take that many items from the
	 * end of the collection.
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .take(3)
	 * // → [1, 2, 3]
	 *
	 * @example With negative values, it takes from the end:
	 * collect([1, 2, 3, 4, 5])
	 *     .take(-2)
	 * // → [4, 5]
	 *
	 * @see {@link skip} - Skip the first N items
	 * @see {@link slice} - Skip and take in one call
	 * @see {@link first} - Get just the first item
	 * @see {@link takeUntil} - Take until a condition is met
	 * @see {@link takeWhile} - Take while a condition is true
	 *
	 * @category Filtering
	 */
	take(limit: number): Collection<T> {
		if (limit < 0) {
			return this.slice(limit);
		}
		return this.slice(0, limit);
	}

	/**
	 * The `takeUntil` method returns items until the given callback returns true.
	 * The item that matches is not included in the result. You may also pass a
	 * value instead of a callback.
	 *
	 * @example
	 * collect([1, 2, 3, 4])
	 *     .takeUntil(number => number >= 3)
	 * // → [1, 2]
	 *
	 * @example You may also pass a value:
	 * collect(['a', 'b', 'c', 'd'])
	 *     .takeUntil('c')
	 * // → ['a', 'b']
	 *
	 * @see {@link takeWhile} - Take while condition is true
	 * @see {@link skipUntil} - Skip items until condition is met
	 *
	 * @category Filtering
	 */
	takeUntil(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;
		if (this.#arrayItems) {
			const result: T[] = [];
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (callback(this.#arrayItems[i], String(i))) break;
				result.push(this.#arrayItems[i]);
			}
			return new Collection(result);
		}

		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.items)) {
			if (callback(item, key)) break;
			result[key] = item;
		}
		return new Collection(result, this.isAssociative);
	}

	/**
	 * The `takeWhile` method returns items while the given callback returns true.
	 * Once the callback returns false, the method stops and returns what it
	 * collected so far.
	 *
	 * @example
	 * collect([1, 2, 3, 4])
	 *     .takeWhile(number => number < 3)
	 * // → [1, 2]
	 *
	 * @see {@link takeUntil} - Take until condition becomes true
	 * @see {@link skipWhile} - Skip while condition is true
	 *
	 * @category Filtering
	 */
	takeWhile(value: T | ((value: T, key: string) => boolean)): Collection<T> {
		const callback = useAsCallable(value) ? (value as (value: T, key: string) => boolean) : (v: T) => v === value;
		if (this.#arrayItems) {
			const result: T[] = [];
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (!callback(this.#arrayItems[i], String(i))) break;
				result.push(this.#arrayItems[i]);
			}
			return new Collection(result);
		}

		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.items)) {
			if (!callback(item, key)) break;
			result[key] = item;
		}
		return new Collection(result, this.isAssociative);
	}

	/**
	 * The `implode` method joins items in a collection.
	 *
	 * Its arguments depend on the type of items in the collection. If the collection contains
	 * arrays or objects, pass the key of the attribute you wish to join, and the "glue" string.
	 * For simple values, pass just the glue string.
	 *
	 * @param value - Property key, callback, or glue string (for simple arrays)
	 * @param glue - String to join items with (when first arg is key/callback)
	 * @returns Joined string
	 *
	 * @example For a simple array:
	 * collect([1, 2, 3, 4, 5])
	 *     .implode('-')
	 * // → '1-2-3-4-5'
	 *
	 * @example By property:
	 * collect([
	 *   { name: 'Desk' },
	 *   { name: 'Chair' },
	 *   { name: 'Bookcase' },
	 * ])
	 *   .implode('name', ', ')
	 * // → 'Desk, Chair, Bookcase'
	 *
	 * @example You may also pass a callback:
	 * collect([
	 *   { name: 'Desk' },
	 *   { name: 'Chair' },
	 * ])
	 *   .implode(p => p.name.toUpperCase(), ', ')
	 * // → 'DESK, CHAIR'
	 *
	 * @see {@link join} - Join with a final separator
	 * @see {@link toString} - Convert to comma-separated string
	 *
	 * @category Aggregating
	 */
	implode(value: string | ((value: T, key: CollectionKey<CK>) => unknown), glue?: string): string {
		if (useAsCallable(value)) {
			const mapped = this.map(value as (value: T, key: CollectionKey<CK>) => unknown);
			return Object.values(mapped.items).join(glue ?? '');
		}

		const first = this.first();
		if (typeof first === 'object' && first !== null) {
			const plucked = this.pluck(value as Path<T>);
			return Object.values(plucked.items).join(glue ?? '');
		}

		const items = this.#arrayItems ?? Object.values(this.items);
		return items.join((value as string) ?? '');
	}

	/**
	 * The `join` method joins the collection's values with a string.
	 *
	 * Using its second argument, you may also specify how the final element should be appended,
	 * which is useful for natural-language formatting like "and" or "or".
	 *
	 * @param glue - String to join items with
	 * @param finalGlue - String to use before the last item (optional)
	 * @returns Joined string
	 *
	 * @example
	 * collect(['a', 'b', 'c'])
	 *     .join(', ')
	 * // → 'a, b, c'
	 *
	 * @example You may specify a final glue:
	 * collect(['a', 'b', 'c'])
	 *     .join(', ', ', and ')
	 * // → 'a, b, and c'
	 *
	 * @example For Oxford comma style:
	 * collect(['Taylor', 'Abigail', 'Dayle'])
	 *     .join(', ', ', and ')
	 * // → 'Taylor, Abigail, and Dayle'
	 *
	 * @see {@link implode} - Join by property or callback
	 * @see {@link toString} - Convert to comma-separated string
	 *
	 * @category Aggregating
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
	 * The `toString` method returns the collection as a comma-separated string.
	 *
	 * This method is automatically called when the collection is coerced to a string.
	 *
	 * @returns Comma-separated string of values
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .toString()
	 * // → '1, 2, 3'
	 *
	 * @see {@link join} - Join with custom separator
	 * @see {@link implode} - Join by property or callback
	 * @see {@link toJson} - Convert to JSON string
	 *
	 * @category Aggregating
	 */
	toString(): string {
		return this.join(', ');
	}

	/**
	 * The `isEmpty` method returns `true` if the collection is empty.
	 *
	 * @returns True if the collection has no items
	 *
	 * @example
	 * collect([])
	 *     .isEmpty()
	 * // → true
	 *
	 * @example For a non-empty collection:
	 * collect([1, 2, 3])
	 *     .isEmpty()
	 * // → false
	 *
	 * @see {@link isNotEmpty} - the inverse (true if has items)
	 * @see {@link count} - Get the number of items
	 *
	 * @category Checking
	 */
	isEmpty(): boolean {
		if (this.#arrayItems) {
			return this.#arrayItems.length === 0;
		}
		return Object.keys(this.items).length === 0;
	}

	/**
	 * The `isNotEmpty` method returns `true` if the collection is not empty.
	 *
	 * @returns True if the collection has at least one item
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .isNotEmpty()
	 * // → true
	 *
	 * @example For an empty collection:
	 * collect([])
	 *     .isNotEmpty()
	 * // → false
	 *
	 * @see {@link isEmpty} - the inverse (true if empty)
	 * @see {@link count} - Get the number of items
	 *
	 * @category Checking
	 */
	isNotEmpty(): boolean {
		return !this.isEmpty();
	}

	/**
	 * The `containsOneItem` method returns `true` if the collection contains exactly one item.
	 *
	 * When a callback is provided, returns `true` only if exactly one item passes the test.
	 *
	 * @param callback - Optional filter callback
	 * @returns True if collection contains exactly one (matching) item
	 *
	 * @example
	 * collect(['a'])
	 *     .containsOneItem()
	 * // → true
	 *
	 * @example You may also pass a callback:
	 * collect([1, 2, 3, 4, 5])
	 *     .containsOneItem(n => n > 4)
	 * // → true (only 5 passes)
	 *
	 * @see {@link hasMany} - checking if more than one item
	 * @see {@link hasSole} - Similar but throws if not exactly one
	 * @see {@link count} - Get the number of items
	 *
	 * @category Checking
	 */
	containsOneItem(callback?: (value: T, key: CollectionKey<CK>) => boolean): boolean {
		if (callback) {
			return this.filter(callback).count() === 1;
		}
		return this.count() === 1;
	}

	/**
	 * The `hasMany` method returns `true` if the collection contains more than one item.
	 *
	 * When a callback or key/value pair is provided, returns `true` only if more than one
	 * item passes the test.
	 *
	 * @param keyOrCallback - Optional property key or filter callback
	 * @param operator - Comparison operator when using key/value syntax
	 * @param value - Value to compare against
	 * @returns True if collection contains multiple (matching) items
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .hasMany()
	 * // → true
	 *
	 * @example You may also pass a callback:
	 * collect([1, 2, 3, 4, 5])
	 *     .hasMany(n => n > 3)
	 * // → true (4 and 5 pass)
	 *
	 * @see {@link containsOneItem} - checking if exactly one item
	 * @see {@link hasSole} - checking if exactly one matching item
	 *
	 * @category Checking
	 */
	hasMany(
		keyOrCallback?: string | ((value: T, key: CollectionKey<CK>) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
		if (arguments.length > 1) {
			const filter = operatorForWhere(keyOrCallback as string, operator, value) as (
				value: T,
				key: CollectionKey<CK>,
			) => boolean;
			return this.filter(filter).count() > 1;
		}

		if (keyOrCallback) {
			const filter = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: CollectionKey<CK>) => boolean)
				: (operatorForWhere(keyOrCallback as string, '=', true) as (value: T, key: CollectionKey<CK>) => boolean);
			return this.filter(filter).count() > 1;
		}

		return this.count() > 1;
	}

	/**
	 * The `hasSole` method returns `true` if the collection contains exactly one item
	 * that passes the given truth test.
	 *
	 * Unlike `sole`, this method returns a boolean instead of throwing an exception
	 * when zero or multiple items match.
	 *
	 * @param keyOrCallback - Optional property key or filter callback
	 * @param operator - Comparison operator when using key/value syntax
	 * @param value - Value to compare against
	 * @returns True if exactly one item matches
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .hasSole(n => n > 4)
	 * // → true (only 5 passes)
	 *
	 * @example For multiple matches:
	 * collect([1, 2, 3, 4, 5])
	 *     .hasSole(n => n > 3)
	 * // → false (4 and 5 both pass)
	 *
	 * @see {@link sole} - getting the item (throws if not exactly one)
	 * @see {@link containsOneItem} - Check without filter
	 * @see {@link hasMany} - checking if more than one item
	 *
	 * @category Checking
	 */
	hasSole(
		keyOrCallback?: string | ((value: T, key: CollectionKey<CK>) => boolean),
		operator?: unknown,
		value?: unknown,
	): boolean {
		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
		if (arguments.length > 1) {
			const filter = operatorForWhere(keyOrCallback as string, operator, value) as (
				value: T,
				key: CollectionKey<CK>,
			) => boolean;
			return this.filter(filter).count() === 1;
		}

		if (keyOrCallback) {
			const filter = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: CollectionKey<CK>) => boolean)
				: (operatorForWhere(keyOrCallback as string, '=', true) as (value: T, key: CollectionKey<CK>) => boolean);
			return this.filter(filter).count() === 1;
		}

		return this.count() === 1;
	}

	/**
	 * The `sole` method returns the first element in the collection that passes a given truth test,
	 * but only if the truth test matches exactly one element.
	 *
	 * @throws {ItemNotFoundException} If no elements match
	 * @throws {MultipleItemsFoundException} If more than one element matches
	 *
	 * @example
	 * collect([1, 2, 3, 4])
	 *     .sole(n => n === 2)
	 * // → 2
	 *
	 * @example You may also use key/value syntax:
	 * collect([{ id: 1, active: true }, { id: 2, active: false }])
	 *     .sole('active', true)
	 * // → { id: 1, active: true }
	 *
	 * @see {@link first} - Get first matching item without throwing
	 * @see {@link hasSole} - Check without throwing
	 *
	 * @category Finding
	 */
	sole<S extends T>(callback: (value: T, key: CollectionKey<CK>) => value is S): S;
	sole(
		keyOrCallback?: string | ((value: T, key: CollectionKey<CK>) => boolean),
		operator?: unknown,
		value?: unknown,
	): T;
	sole(
		keyOrCallback?: string | ((value: T, key: CollectionKey<CK>) => boolean),
		operator?: unknown,
		value?: unknown,
	): T {
		let filter: ((value: T, key: CollectionKey<CK>) => boolean) | undefined;

		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
		if (arguments.length > 1) {
			filter = operatorForWhere(keyOrCallback as string, operator, value) as (
				value: T,
				key: CollectionKey<CK>,
			) => boolean;
		} else if (keyOrCallback) {
			filter = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: CollectionKey<CK>) => boolean)
				: (operatorForWhere(keyOrCallback as string, '=', true) as (value: T, key: CollectionKey<CK>) => boolean);
		}

		const items = filter ? this.filter(filter) : this;
		const count = items.count();

		if (count === 0) {
			throw new ItemNotFoundException();
		}

		if (count > 1) {
			throw new MultipleItemsFoundException(count);
		}

		// biome-ignore lint/style/noNonNullAssertion: count === 1
		return items.first()!;
	}

	/**
	 * The `firstOrFail` method returns the first element in the collection, or throws an
	 * `ItemNotFoundException` if the collection is empty or no matching element is found.
	 *
	 * @throws {ItemNotFoundException} If no matching element is found
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .firstOrFail(n => n > 2)
	 * // → 3
	 *
	 * @example You may also use key/value syntax:
	 * collect([{ id: 1 }, { id: 2 }])
	 *     .firstOrFail('id', 2)
	 * // → { id: 2 }
	 *
	 * @see {@link first} - Get first matching item without throwing
	 * @see {@link sole} - Get item only if exactly one matches
	 *
	 * @category Finding
	 */
	firstOrFail<S extends T>(callback: (value: T, key: string) => value is S): S;
	firstOrFail(keyOrCallback?: string | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): T;
	firstOrFail(keyOrCallback?: string | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): T {
		let filter: ((value: T, key: string) => boolean) | undefined;

		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
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

	/**
	 * Extract values at a given path from each item.
	 *
	 * @param path - Property path to extract (supports dot notation)
	 * @param key - Optional key path to use as keys in result
	 * @returns Collection of extracted values
	 *
	 * @example
	 * collect([
	 *   { id: 1, name: 'Taylor' },
	 *   { id: 2, name: 'Abigail' },
	 * ])
	 *   .pluck('name')
	 * // → ['Taylor', 'Abigail']
	 *
	 * @example You may also specify custom keys:
	 * collect([
	 *   { id: 1, name: 'Taylor' },
	 *   { id: 2, name: 'Abigail' },
	 * ])
	 *   .pluck('name', 'id')
	 * // → { 1: 'Taylor', 2: 'Abigail' }
	 *
	 * @see {@link map} - Transform items with full callback control
	 * @see {@link value} - Get first item's value at path
	 *
	 * @category Transforming
	 */
	pluck<P extends Path<T>>(path: P): Collection<PathValue<T, P>, CK>;
	pluck<P extends Path<T>, K extends Path<T>>(path: P, key: K): Collection<PathValue<T, P>, 'assoc'>;
	pluck<P extends Path<T>>(path: P, key?: Path<T>): Collection<PathValue<T, P>, CollectionKind> {
		// Fast path: simple key without dots on array-backed collection
		if (this.#arrayItems && typeof path === 'string' && !path.includes('.')) {
			const p = path as keyof T;
			if (key === undefined) {
				return new Collection(arrayMapByKey(this.#arrayItems, p)) as Collection<PathValue<T, P>, CK>;
			}
			// With key parameter
			if (typeof key === 'string' && !key.includes('.')) {
				const k = key as keyof T;
				const result: Record<string, PathValue<T, P>> = {};
				for (const item of this.#arrayItems) {
					result[String(item[k])] = item[p] as PathValue<T, P>;
				}
				return new Collection(result, true) as Collection<PathValue<T, P>, CK>;
			}
		}
		if (key !== undefined) {
			const result: Record<string, PathValue<T, P>> = {};
			const items = this.#arrayItems ?? Object.values(this.items);
			for (const item of items) {
				const k = String(dataGet(item, key as string));
				result[k] = dataGet(item, path as string) as PathValue<T, P>;
			}
			return new Collection(result, true) as Collection<PathValue<T, P>, CK>;
		}
		return this.map((item) => dataGet(item, path as string) as PathValue<T, P>);
	}

	/**
	 * The `transform` method iterates over the collection and calls the given callback with each
	 * item in the collection. The items in the collection will be replaced by the values returned
	 * by the callback. Unlike `map`, this method modifies the collection in place.
	 *
	 * @param callback - Function to transform each item
	 * @returns This collection (mutated)
	 *
	 * @example
	 * const collection = collect([1, 2, 3]);
	 * collection.transform(n => n * 2);
	 * collection.all();
	 * // → [2, 4, 6]
	 *
	 * @example You may chain after transform:
	 * collect({ price: 100, tax: 10 })
	 *     .transform((v, k) => k === 'price' ? v * 1.1 : v)
	 *     .sum()
	 * // → 120
	 *
	 * @see {@link map} - Transform without mutation
	 * @see {@link each} - Iterate without transforming
	 *
	 * @category Transforming
	 */
	transform(callback: (value: T, key: string) => T): this {
		this.invalidateArrayItems();
		for (const key in this.items) {
			this.items[key] = callback(this.items[key], key);
		}
		return this;
	}

	/**
	 * The `nth` method creates a new collection containing every n-th element.
	 * You may optionally pass an offset as the second argument.
	 *
	 * @example
	 * collect(['a', 'b', 'c', 'd', 'e', 'f'])
	 *     .nth(2)
	 * // → ['a', 'c', 'e']
	 *
	 * @example You may also pass an offset:
	 * collect(['a', 'b', 'c', 'd', 'e', 'f'])
	 *     .nth(2, 1)
	 * // → ['b', 'd', 'f']
	 *
	 * @see {@link filter} - filtering with a custom callback
	 *
	 * @category Filtering
	 */
	nth(step: number, offset = 0): Collection<T> {
		if (this.#arrayItems) {
			const result: T[] = [];
			for (let i = offset; i < this.#arrayItems.length; i += step) {
				result.push(this.#arrayItems[i]);
			}
			return new Collection(result);
		}
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
	 * The `random` method returns a random item from the collection. You may
	 * optionally pass an integer to specify how many items you would like to
	 * retrieve. If the collection is empty, an exception is thrown.
	 *
	 * @param number - Optional count of items to retrieve, or a callback
	 * @param preserveKeys - Keep original keys in the result (default: false)
	 * @returns Random item, or collection of random items if count specified
	 * @throws {InvalidArgumentException} If collection is empty or count exceeds size
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5]).random()
	 * // → 3 (random)
	 *
	 * @example For multiple random items:
	 * collect([1, 2, 3, 4, 5]).random(2)
	 * // → Collection [4, 1] (random)
	 *
	 * @example You may also pass a callback for count:
	 * collect([1, 2, 3, 4, 5]).random(items => items.count() - 2)
	 * // → Collection of 3 random items
	 *
	 * @see {@link shuffle} - Randomize the entire collection
	 * @see {@link first} - Get the first item
	 *
	 * @category Finding
	 */
	random(number?: number | ((collection: Collection<T>) => number), preserveKeys = false): T | Collection<T> {
		const values = this.#arrayItems ?? Object.values(this.items);
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
	 * The `sliding` method returns a new collection of chunks representing a
	 * "sliding window" view of the items. Each chunk contains `size` consecutive
	 * items, and the window advances by `step` items between chunks.
	 *
	 * @param size - Number of items in each window (default: 2)
	 * @param step - Number of items to advance between windows (default: 1)
	 * @throws {InvalidArgumentException} If size or step is less than 1
	 *
	 * @example For pairs of consecutive items:
	 * collect([1, 2, 3, 4, 5])
	 *     .sliding(2)
	 * // → [[1, 2], [2, 3], [3, 4], [4, 5]]
	 *
	 * @example For triplets with a step of 2:
	 * collect([1, 2, 3, 4, 5, 6])
	 *     .sliding(3, 2)
	 * // → [[1, 2, 3], [3, 4, 5]]
	 *
	 * @see {@link chunk} - Non-overlapping fixed-size chunks
	 * @see {@link chunkWhile} - Conditional chunking
	 *
	 * @category Grouping
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
	 * The `multiply` method creates multiple copies of all items in the collection.
	 * The resulting collection contains the original items repeated the specified
	 * number of times.
	 *
	 * @param multiplier - Number of times to repeat the items
	 * @returns New collection with items repeated
	 *
	 * @example To double the items:
	 * collect([1, 2, 3])
	 *     .multiply(2)
	 * // → [1, 2, 3, 1, 2, 3]
	 *
	 * @example To repeat for display:
	 * collect(['*'])
	 *     .multiply(5)
	 *     .join('')
	 * // → '*****'
	 *
	 * @see {@link pad} - Pad to a specific size
	 * @see {@link range} - Generate a sequence of numbers
	 *
	 * @category Combining
	 */
	multiply(multiplier: number): Collection<T> {
		const values = this.#arrayItems ?? Object.values(this.items);
		const result: T[] = [];
		for (let i = 0; i < multiplier; i++) {
			result.push(...values);
		}
		return new Collection(result);
	}

	/**
	 * The `replace` method behaves similarly to `merge`; however, in addition to
	 * overwriting matching items that have string keys, the `replace` method will
	 * also overwrite items in the collection that have matching numeric keys.
	 *
	 * @param items - Object or collection with replacement values
	 * @returns New collection with replaced values
	 *
	 * @example
	 * collect({ name: 'Alice', age: 25 })
	 *     .replace({ age: 30, city: 'NYC' })
	 * // → { name: 'Alice', age: 30, city: 'NYC' }
	 *
	 * @example To replace array items by index:
	 * collect(['a', 'b', 'c'])
	 *     .replace({ 1: 'B', 2: 'C' })
	 * // → ['a', 'B', 'C']
	 *
	 * @see {@link merge} - Merge without replacing by numeric key
	 * @see {@link replaceRecursive} - Replace nested objects recursively
	 *
	 * @category Combining
	 */
	replace(items: Collectable<T>): Collection<T, CK> {
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
	 * The `replaceRecursive` method works like `replace`, but it will recurse into
	 * nested objects and apply the same replacement process to the inner values.
	 *
	 * @param items - Object or collection with replacement values
	 * @returns New collection with recursively replaced values
	 *
	 * @example For recursive replacement:
	 * collect({
	 *     user: { name: 'Alice', settings: { theme: 'dark', lang: 'en' } }
	 * }).replaceRecursive({
	 *     user: { settings: { theme: 'light' } }
	 * })
	 * // → { user: { name: 'Alice', settings: { theme: 'light', lang: 'en' } } }
	 *
	 * @see {@link replace} - Shallow replacement
	 * @see {@link mergeRecursive} - Similar but merges arrays instead of replacing
	 *
	 * @category Combining
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
	 * The `splice` method removes and returns a slice of items starting at the specified index.
	 * You may pass a second argument to limit the size of the removed slice, and a third argument
	 * containing replacement items to insert at the splice point. This method modifies the
	 * original collection.
	 *
	 * @param offset - Starting index for the splice
	 * @param length - Number of items to remove (optional, removes rest if omitted)
	 * @param replacement - Items to insert at the splice point (optional)
	 * @returns New collection containing the removed items
	 *
	 * @example To remove from an index:
	 * const collection = collect([1, 2, 3, 4, 5]);
	 * const chunk = collection.splice(2);
	 * // chunk      → [3, 4, 5]
	 * // collection → [1, 2]
	 *
	 * @example To remove a specific length:
	 * const collection = collect([1, 2, 3, 4, 5]);
	 * const chunk = collection.splice(2, 1);
	 * // chunk      → [3]
	 * // collection → [1, 2, 4, 5]
	 *
	 * @example To replace items:
	 * const collection = collect([1, 2, 3, 4, 5]);
	 * collection.splice(2, 1, [10, 11]);
	 * // → [1, 2, 10, 11, 4, 5]
	 *
	 * @see {@link slice} - Extract without mutation
	 * @see {@link take} - Take from start or end
	 *
	 * @category Transforming
	 */
	splice(offset: number, length?: number, replacement: T | T[] = [] as T[]): Collection<T, CK> {
		this.invalidateArrayItems();
		// Work with values array for proper reindexing (like PHP array_splice)
		const values = Object.values(this.items);

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
	 * The `dot` method flattens a multi-dimensional collection into a single level collection
	 * that uses "dot" notation to indicate depth. This is useful for working with nested
	 * configuration or form data.
	 *
	 * @returns New collection with dot-notation keys
	 *
	 * @example
	 * collect({
	 *     user: { name: 'John', address: { city: 'NYC' } }
	 * }).dot()
	 * // → { 'user.name': 'John', 'user.address.city': 'NYC' }
	 *
	 * @example To flatten configuration:
	 * collect({
	 *     database: { host: 'localhost', port: 3306 },
	 *     cache: { driver: 'redis' }
	 * }).dot()
	 * // → { 'database.host': 'localhost', 'database.port': 3306, 'cache.driver': 'redis' }
	 *
	 * @see {@link undot} - Expand dot notation back to nested structure
	 * @see {@link flatten} - Flatten nested arrays
	 *
	 * @category Transforming
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
	 * The `undot` method expands a single-level collection that uses "dot" notation into a
	 * multi-dimensional collection. This is the inverse of the `dot` method.
	 *
	 * @returns New collection with nested structure restored
	 *
	 * @example
	 * collect({
	 *     'user.name': 'John',
	 *     'user.address.city': 'NYC'
	 * }).undot()
	 * // → { user: { name: 'John', address: { city: 'NYC' } } }
	 *
	 * @example To expand form data:
	 * collect({
	 *     'items.0.name': 'Widget',
	 *     'items.0.price': 100,
	 *     'items.1.name': 'Gadget',
	 *     'items.1.price': 200
	 * }).undot()
	 * // → { items: { 0: { name: 'Widget', price: 100 }, 1: { name: 'Gadget', price: 200 } } }
	 *
	 * @see {@link dot} - Flatten to dot notation
	 *
	 * @category Transforming
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
	 * The `unique` method returns all of the unique items in the collection.
	 *
	 * When dealing with nested objects, you may specify a key used to determine uniqueness.
	 *
	 * @param keyOrCallback - Property key or callback to determine uniqueness
	 * @param strict - Use strict equality (`===`) instead of loose equality
	 * @returns New collection with duplicates removed
	 *
	 * @example
	 * collect([1, 1, 2, 2, 3])
	 *     .unique()
	 * // → Collection [1, 2, 3]
	 *
	 * @example By property:
	 * collect([
	 *   { id: 1, email: 'taylor@example.com' },
	 *   { id: 2, email: 'abigail@example.com' },
	 *   { id: 3, email: 'taylor@example.com' },
	 * ])
	 *   .unique('email')
	 * // → [
	 * //     { id: 1, email: 'taylor@example.com' },
	 * //     { id: 2, email: 'abigail@example.com' },
	 * //   ]
	 *
	 * @see {@link uniqueStrict} - strict equality (always)
	 * @see {@link duplicates} - Get the duplicate items instead
	 *
	 * @category Filtering
	 */
	unique(keyOrCallback?: ValueRetriever<T, unknown>, strict = false): Collection<T> {
		// Fast path: simple string key on array-backed collection
		if (this.#arrayItems && !strict && typeof keyOrCallback === 'string' && !keyOrCallback.includes('.')) {
			const k = keyOrCallback as keyof T;
			const seen = new Set<unknown>();
			const result: T[] = [];
			for (let i = 0; i < this.#arrayItems.length; i++) {
				const id = this.#arrayItems[i][k];
				if (!seen.has(id)) {
					seen.add(id);
					result.push(this.#arrayItems[i]);
				}
			}
			return new Collection(result);
		}

		// Fast path: no key (unique by value) on array-backed collection
		if (this.#arrayItems && !strict && keyOrCallback === undefined) {
			const seen = new Set<unknown>();
			const result: T[] = [];
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (!seen.has(this.#arrayItems[i])) {
					seen.add(this.#arrayItems[i]);
					result.push(this.#arrayItems[i]);
				}
			}
			return new Collection(result);
		}

		const retriever = valueRetriever(keyOrCallback);
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);

		if (this.#arrayItems && !strict) {
			const seen = new Set<unknown>();
			const result: T[] = [];
			for (let i = 0; i < items.length; i++) {
				const id = retriever(items[i], keys[i]);
				if (!seen.has(id)) {
					seen.add(id);
					result.push(items[i]);
				}
			}
			return new Collection(result);
		}

		const seen: unknown[] = [];
		const result: Record<string, T> = {};

		for (let i = 0; i < items.length; i++) {
			const key = keys[i];
			const value = items[i];
			const id = retriever(value, key);
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			const exists = strict ? seen.some((s) => s === id) : seen.some((s) => s == id);
			if (!exists) {
				seen.push(id);
				result[key] = value;
			}
		}

		return new Collection(result, this.isAssociative);
	}

	/**
	 * The `uniqueStrict` method removes duplicate items using strict equality (`===`).
	 * Unlike `unique`, which uses loose comparison, this method distinguishes between
	 * values like `1` and `'1'`.
	 *
	 * @param keyOrCallback - Key or callback to derive comparison value
	 * @returns New collection with duplicates removed using strict comparison
	 *
	 * @example
	 * collect([1, '1', 2, '2', 2])
	 *     .uniqueStrict()
	 * // → [1, '1', 2, '2']
	 *
	 * @see {@link unique} - loose equality
	 * @see {@link duplicatesStrict} - Get duplicates using strict equality
	 *
	 * @category Filtering
	 */
	uniqueStrict(keyOrCallback?: ValueRetriever<T, unknown>): Collection<T> {
		return this.unique(keyOrCallback, true);
	}

	/**
	 * The `where` method filters the collection by a given key/value pair.
	 *
	 * The method uses "loose" comparisons when checking item values, meaning
	 * a string with an integer value will be considered equal to an integer
	 * of the same value. Use the `whereStrict` method for strict comparisons.
	 *
	 * You may optionally pass a comparison operator as the second argument.
	 * Supported operators: `=`, `==`, `!=`, `<>`, `<`, `>`, `<=`, `>=`.
	 *
	 * @example
	 * collect([
	 *     { product: 'Desk', price: 200 },
	 *     { product: 'Chair', price: 100 },
	 *     { product: 'Bookcase', price: 150 },
	 * ]).where('price', 100)
	 * // → [{ product: 'Chair', price: 100 }]
	 *
	 * @example You may also pass a comparison operator:
	 * collect([
	 *   { id: 1, total: 150 },
	 *   { id: 2, total: 50 },
	 *   { id: 3, total: 200 },
	 * ])
	 *   .where('total', '>', 100)
	 * // → [{ id: 1, total: 150 }, { id: 3, total: 200 }]
	 *
	 * @example To filter by nested property:
	 * collect([
	 *   { name: 'Taylor', address: { city: 'Amsterdam' } },
	 *   { name: 'Abigail', address: { city: 'London' } },
	 * ])
	 *   .where('address.city', 'Amsterdam')
	 * // → [{ name: 'Taylor', address: { city: 'Amsterdam' } }]
	 *
	 * @see {@link whereStrict} - strict type comparisons
	 * @see {@link whereIn} - matching against an array of values
	 * @see {@link whereNotIn} - excluding items in an array
	 * @see {@link whereBetween} - matching values in a range
	 * @see {@link whereNull} - matching null values
	 * @see {@link filter} - filtering with a custom callback
	 *
	 * @category Filtering
	 */
	where(key: string, operatorOrValue?: WhereOperator | unknown, value?: unknown): Collection<T, CK> {
		// Fast path: simple key on array-backed collection
		if (this.#arrayItems && key && !key.includes('.')) {
			const k = key as keyof T;
			// where(key, value) - equality check
			if (value === undefined && operatorOrValue !== undefined) {
				return new Collection(arrayFilterByKey(this.#arrayItems, k, operatorOrValue, '==')) as Collection<T, CK>;
			}
			// where(key, operator, value)
			if (value !== undefined) {
				const op = (operatorOrValue as WhereOperator | '===') || '==';
				return new Collection(arrayFilterByKey(this.#arrayItems, k, value, op)) as Collection<T, CK>;
			}
			// where(key) with no value - fall through
		}
		return this.filter(operatorForWhere(key, operatorOrValue, value) as (value: T, key: CollectionKey<CK>) => boolean);
	}

	/**
	 * The `whereStrict` method filters the collection by a given key/value pair using strict
	 * comparison (`===`). Unlike `where`, this method distinguishes between values like `1` and `'1'`.
	 *
	 * @param key - Property key to check
	 * @param value - Value to match
	 * @returns New collection with matching items
	 *
	 * @see {@link where} - loose equality
	 *
	 * @category Filtering
	 */
	whereStrict(key: string, value: unknown): Collection<T, CK> {
		return this.filter((item) => dataGet(item, key) === value);
	}

	/**
	 * The `whereIn` method filters the collection by a given key/value contained within the given array.
	 *
	 * @param key - Property key to check
	 * @param values - Array of values to match against
	 * @param strict - Use strict equality (`===`)
	 * @returns New collection with matching items
	 *
	 * @example
	 * collect([
	 *   { name: 'Taylor', role: 'admin' },
	 *   { name: 'Abigail', role: 'editor' },
	 *   { name: 'James', role: 'user' },
	 * ])
	 *   .whereIn('role', ['admin', 'editor'])
	 * // → [
	 * //     { name: 'Taylor', role: 'admin' },
	 * //     { name: 'Abigail', role: 'editor' },
	 * //   ]
	 *
	 * @see {@link whereNotIn} - excluding items in an array
	 * @see {@link where} - Match single value
	 *
	 * @category Filtering
	 */
	whereIn(key: string, values: unknown[], strict = false): Collection<T, CK> {
		return this.filter((item) => {
			const retrieved = dataGet(item, key);
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			return strict ? values.some((v) => v === retrieved) : values.some((v) => v == retrieved);
		});
	}

	/**
	 * The `whereInStrict` method filters the collection by a given key/value contained
	 * within the given array using strict comparison (`===`). Unlike `whereIn`, this
	 * method distinguishes between values like `1` and `'1'`.
	 *
	 * @param key - Property key to check
	 * @param values - Array of values to match against
	 * @returns New collection with matching items
	 *
	 * @example
	 * collect([{ id: 1 }, { id: '1' }, { id: 2 }])
	 *     .whereInStrict('id', [1])
	 * // → [{ id: 1 }]
	 *
	 * @see {@link whereIn} - loose equality
	 * @see {@link whereNotInStrict} - Exclude using strict equality
	 *
	 * @category Filtering
	 */
	whereInStrict(key: string, values: unknown[]): Collection<T, CK> {
		return this.whereIn(key, values, true);
	}

	/**
	 * The `whereNotIn` method filters the collection by a given key/value not contained within the given array.
	 *
	 * @param key - Property key to check
	 * @param values - Array of values to exclude
	 * @param strict - Use strict equality (`===`)
	 * @returns New collection with non-matching items
	 *
	 * @example
	 * collect([
	 *   { name: 'Taylor', status: 'active' },
	 *   { name: 'Abigail', status: 'banned' },
	 *   { name: 'James', status: 'active' },
	 * ])
	 *   .whereNotIn('status', ['banned', 'suspended'])
	 * // → [
	 * //     { name: 'Taylor', status: 'active' },
	 * //     { name: 'James', status: 'active' },
	 * //   ]
	 *
	 * @see {@link whereIn} - Include items matching array
	 * @see {@link reject} - Exclude by callback
	 *
	 * @category Filtering
	 */
	whereNotIn(key: string, values: unknown[], strict = false): Collection<T, CK> {
		return this.filter((item) => {
			const retrieved = dataGet(item, key);
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			return strict ? !values.some((v) => v === retrieved) : !values.some((v) => v == retrieved);
		});
	}

	/**
	 * The `whereNotInStrict` method filters the collection by a given key/value not
	 * contained within the given array using strict comparison (`===`). Unlike `whereNotIn`,
	 * this method distinguishes between values like `1` and `'1'`.
	 *
	 * @param key - Property key to check
	 * @param values - Array of values to exclude
	 * @returns New collection with non-matching items
	 *
	 * @example
	 * collect([{ id: 1 }, { id: '1' }, { id: 2 }])
	 *     .whereNotInStrict('id', [1])
	 * // → [{ id: '1' }, { id: 2 }]
	 *
	 * @see {@link whereNotIn} - loose equality
	 * @see {@link whereInStrict} - Include using strict equality
	 *
	 * @category Filtering
	 */
	whereNotInStrict(key: string, values: unknown[]): Collection<T, CK> {
		return this.whereNotIn(key, values, true);
	}

	/**
	 * The `whereBetween` method filters the collection by determining if a specified item value is within a given range.
	 *
	 * @param key - Property key to check
	 * @param values - Tuple of [min, max] values
	 * @returns New collection with items in range
	 *
	 * @example
	 * collect([
	 *   { name: 'Chair', price: 100 },
	 *   { name: 'Desk', price: 200 },
	 *   { name: 'Lamp', price: 30 },
	 * ])
	 *   .whereBetween('price', [50, 150])
	 * // → [{ name: 'Chair', price: 100 }]
	 *
	 * @see {@link whereNotBetween} - excluding items outside a range
	 * @see {@link where} - Filter with operators
	 *
	 * @category Filtering
	 */
	whereBetween(key: string, values: [number, number]): Collection<T, CK> {
		return this.where(key, '>=', values[0]).where(key, '<=', values[1]);
	}

	/**
	 * The `whereNotBetween` method filters the collection by determining if a specified item value
	 * is outside of a given range.
	 *
	 * @param key - Property key to check
	 * @param values - Tuple of [min, max] values to exclude
	 * @returns New collection with items outside range
	 *
	 * @see {@link whereBetween} - Include items in range
	 *
	 * @category Filtering
	 */
	whereNotBetween(key: string, values: [number, number]): Collection<T, CK> {
		return this.filter((item) => {
			const value = dataGet(item, key) as number;
			return value < values[0] || value > values[1];
		});
	}

	/**
	 * The `whereNull` method filters the collection by determining if a specified item value is null or undefined.
	 *
	 * @param key - Property key to check (if omitted, checks item itself)
	 * @returns New collection with null/undefined values
	 *
	 * @example
	 * collect([
	 *   { name: 'Taylor', email: 'taylor@example.com' },
	 *   { name: 'Abigail', email: null },
	 * ])
	 *   .whereNull('email')
	 * // → [{ name: 'Abigail', email: null }]
	 *
	 * @see {@link whereNotNull} - Exclude null/undefined values
	 *
	 * @category Filtering
	 */
	whereNull(key?: string): Collection<T, CK> {
		return this.filter((item) => {
			const value = key ? dataGet(item, key) : item;
			return value === null || value === undefined;
		});
	}

	/**
	 * The `whereNotNull` method filters the collection by determining if a specified item value
	 * is not null or undefined.
	 *
	 * @param key - Property key to check (if omitted, checks item itself)
	 * @returns New collection with non-null values
	 *
	 * @example
	 * collect([
	 *   { name: 'Taylor', verifiedAt: '2024-01-15' },
	 *   { name: 'Abigail', verifiedAt: null },
	 * ])
	 *   .whereNotNull('verifiedAt')
	 * // → [{ name: 'Taylor', verifiedAt: '2024-01-15' }]
	 *
	 * @see {@link whereNull} - Include null/undefined values
	 *
	 * @category Filtering
	 */
	whereNotNull(key?: string): Collection<T, CK> {
		return this.filter((item) => {
			const value = key ? dataGet(item, key) : item;
			return value !== null && value !== undefined;
		});
	}

	/**
	 * The `whereInstanceOf` method filters the collection by a given class type,
	 * keeping only items that are instances of the specified class. This is useful
	 * for filtering mixed collections to a specific type.
	 *
	 * @param type - Constructor class to check against
	 * @returns New collection containing only instances of the given type
	 *
	 * @example
	 * class User {}
	 * class Admin extends User {}
	 * collect([new User(), new Admin(), { name: 'plain' }])
	 *     .whereInstanceOf(User)
	 * // → [User, Admin]
	 *
	 * @see {@link filter} - filtering with a custom callback
	 *
	 * @category Filtering
	 */
	whereInstanceOf<U>(type: new (...args: unknown[]) => U): Collection<U> {
		return this.filter((item) => item instanceof type) as unknown as Collection<U>;
	}

	/**
	 * The `firstWhere` method returns the first element in the collection with the given key/value pair.
	 *
	 * @example
	 * collect([
	 *   { id: 1, name: 'Taylor', role: 'admin' },
	 *   { id: 2, name: 'Abigail', role: 'editor' },
	 * ])
	 *   .firstWhere('role', 'admin')
	 * // → { id: 1, name: 'Taylor', role: 'admin' }
	 *
	 * @example You may also pass a comparison operator:
	 * collect([
	 *   { id: 1, total: 50 },
	 *   { id: 2, total: 150 },
	 * ])
	 *   .firstWhere('total', '>', 100)
	 * // → { id: 2, total: 150 }
	 *
	 * @category Finding
	 */
	firstWhere(key: string, operatorOrValue?: WhereOperator | unknown, value?: unknown): T | undefined {
		// Fast path: simple key on array-backed collection
		if (this.#arrayItems && key && !key.includes('.')) {
			const k = key as keyof T;
			// firstWhere(key, value) - equality check
			if (value === undefined && operatorOrValue !== undefined) {
				return arrayFindByKey(this.#arrayItems, k, operatorOrValue, '==');
			}
			// firstWhere(key, operator, value)
			if (value !== undefined) {
				const op = (operatorOrValue as WhereOperator | '===') || '==';
				return arrayFindByKey(this.#arrayItems, k, value, op);
			}
			// firstWhere(key) with no value - fall through
		}
		return this.first(operatorForWhere(key, operatorOrValue, value));
	}

	/**
	 * The `each` method iterates over the items in the collection and passes each item to a closure.
	 *
	 * If you would like to stop iterating through the items, you may return false from your closure.
	 *
	 * @param callback - Function to execute for each item
	 * @returns The collection (for chaining)
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .each(n => console.log(n))
	 * // logs: 1, 2, 3
	 *
	 * @example To stop early:
	 * collect([1, 2, 3])
	 *     .each(n => {
	 *   if (n === 2) return false
	 *   console
	 *       .log(n)
	 * })
	 * // logs: 1
	 *
	 * @see {@link tap} - Execute callback on entire collection
	 * @see {@link map} - Transform items instead of side effects
	 * @see {@link eachSpread} - Spread array items as arguments
	 *
	 * @category Transforming
	 */
	each(callback: (value: T, key: string) => unknown): this {
		if (this.#arrayItems) {
			for (let i = 0; i < this.#arrayItems.length; i++) {
				if (callback(this.#arrayItems[i], String(i)) === false) break;
			}
			return this;
		}
		for (const [key, value] of Object.entries(this.items)) {
			if (callback(value, key) === false) break;
		}
		return this;
	}

	/**
	 * The `eachSpread` method iterates over the collection's items, passing each nested item value
	 * into the given callback as separate arguments. This is useful when working with nested arrays
	 * where each sub-array should be destructured into callback parameters.
	 *
	 * @param callback - Function receiving spread arguments from each nested array
	 * @returns This collection (unchanged)
	 *
	 * @example
	 * collect([['John', 35], ['Jane', 28]])
	 *     .eachSpread((name, age) => {
	 *         console.log(`${name} is ${age} years old`);
	 *     });
	 * // Logs: "John is 35 years old"
	 * // Logs: "Jane is 28 years old"
	 *
	 * @example You may also pass a key as the final argument:
	 * collect([['a', 'b'], ['c', 'd']])
	 *     .eachSpread((first, second, key) => {
	 *         console.log(`${key}: ${first}, ${second}`);
	 *     });
	 *
	 * @see {@link mapSpread} - Transform with spread arguments
	 * @see {@link each} - Iterate without spreading
	 *
	 * @category Transforming
	 */
	eachSpread(callback: (...args: unknown[]) => unknown): this {
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);
		for (let i = 0; i < items.length; i++) {
			const value = items[i];
			const args = Array.isArray(value) ? [...value, keys[i]] : [value, keys[i]];
			if (callback(...args) === false) break;
		}
		return this;
	}

	/**
	 * The `reduce` method reduces the collection to a single value, passing the result of each
	 * iteration into the subsequent iteration.
	 *
	 * The value for the accumulator on the first iteration is the initial value; on subsequent
	 * iterations, it is the value returned by the previous callback.
	 *
	 * @param callback - Function receiving (accumulator, value, key) and returning next accumulator
	 * @param initial - Starting value for the accumulator
	 * @returns Final accumulated value
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .reduce((carry, item) => carry + item, 0)
	 * // → 6
	 *
	 * @example To build an object:
	 * collect([
	 *   { id: 1, name: 'Taylor' },
	 *   { id: 2, name: 'Abigail' },
	 * ])
	 *   .reduce((carry, user) => {
	 *     carry[user.id] = user.name
	 *     return carry
	 *   }, {})
	 * // → { 1: 'Taylor', 2: 'Abigail' }
	 *
	 * @see {@link reduceSpread} - Reduce with spread arguments
	 * @see {@link reduceWithKeys} - Same as reduce (keys always available)
	 * @see {@link reduceInto} - Reduce by mutating an object
	 *
	 * @category Aggregating
	 */
	reduce<U>(callback: (accumulator: U, value: T, key: string) => U, initial: U): U {
		if (this.#arrayItems) {
			let acc = initial;
			for (let i = 0; i < this.#arrayItems.length; i++) {
				acc = callback(acc, this.#arrayItems[i], String(i));
			}
			return acc;
		}
		let acc = initial;
		for (const [key, value] of Object.entries(this.items)) {
			acc = callback(acc, value, key);
		}
		return acc;
	}

	/**
	 * The `reduceSpread` method reduces the collection to multiple values using spread arguments.
	 *
	 * The callback receives the accumulated values spread as individual arguments, followed by
	 * the current item and key. It must return an array of the same shape as the initial values.
	 *
	 * @param callback - Function receiving (...accumulators, value, key) and returning new accumulators
	 * @param initial - Starting values (spread as separate arguments)
	 * @returns Array of final accumulated values
	 *
	 * @example To track multiple values:
	 * collect([1, 2, 3, 4, 5])
	 *     .reduceSpread((sum, product, item) => [sum + item, product * item], 0, 1)
	 * // → [15, 120] (sum=15, product=120)
	 *
	 * @see {@link reduce} - Reduce to a single value
	 * @see {@link reduceInto} - Reduce by mutating an object
	 *
	 * @category Aggregating
	 */
	reduceSpread<U extends unknown[]>(callback: (...args: [...U, T, string]) => U, ...initial: U): U {
		let result = initial;
		for (const [key, value] of Object.entries(this.items)) {
			result = callback(...result, value, key);
		}
		return result;
	}

	/**
	 * The `reduceWithKeys` method reduces the collection with access to both value and key.
	 *
	 * This method works identically to `reduce` since the key is always provided as the third
	 * argument. It exists for API compatibility with Laravel.
	 *
	 * @param callback - Function receiving (carry, value, key) and returning next carry
	 * @param initial - Starting value for the carry
	 * @returns Final accumulated value
	 *
	 * @example To build a keyed object:
	 * collect({ a: 1, b: 2, c: 3 })
	 *     .reduceWithKeys((carry, value, key) => {
	 *         carry[key] = value * 2
	 *         return carry
	 *     }, {})
	 * // → { a: 2, b: 4, c: 6 }
	 *
	 * @see {@link reduce} - Primary reduce method
	 *
	 * @category Aggregating
	 */
	reduceWithKeys<U>(callback: (carry: U, value: T, key: string) => U, initial: U): U {
		return this.reduce(callback, initial);
	}

	/**
	 * The `reduceInto` method reduces the collection into an existing object, mutating it.
	 *
	 * Unlike `reduce`, the callback does not return a value. Instead, it modifies the carry
	 * object directly. The same object is returned at the end.
	 *
	 * @param initial - Object to mutate
	 * @param callback - Function receiving (carry, value, key) that mutates carry
	 * @returns The mutated initial object
	 *
	 * @example To build an object by mutation:
	 * collect([1, 2, 3])
	 *     .reduceInto({ total: 0 }, (carry, item) => {
	 *         carry.total += item
	 *     })
	 * // → { total: 6 }
	 *
	 * @example To populate an existing array:
	 * collect([
	 *   { name: 'Taylor', active: true },
	 *   { name: 'Abigail', active: true },
	 *   { name: 'James', active: false },
	 * ])
	 *   .reduceInto([], (carry, user) => {
	 *     if (user.active) carry.push(user.name)
	 *   })
	 * // → ['Taylor', 'Abigail']
	 *
	 * @see {@link reduce} - Reduce with immutable accumulator
	 * @see {@link reduceSpread} - Reduce to multiple values
	 *
	 * @category Aggregating
	 */
	reduceInto<U>(initial: U, callback: (carry: U, value: T, key: string) => void): U {
		for (const [key, value] of Object.entries(this.items)) {
			callback(initial, value, key);
		}
		return initial;
	}

	/**
	 * The `every` method verifies that all elements of the collection pass a given truth test.
	 *
	 * Returns `true` if the callback returns truthy for every item. If the collection is
	 * empty, `every` returns `true` (vacuous truth).
	 *
	 * @param keyOrCallback - Property key or callback function
	 * @param operator - Comparison operator when using key/operator/value syntax
	 * @param value - Value to compare against
	 * @returns True if all items pass the test
	 *
	 * @example You may also pass a callback:
	 * collect([1, 2, 3])
	 *     .every(n => n < 10)
	 * // → true
	 *
	 * @example You may also pass a property key:
	 * collect([{ active: true }, { active: true }])
	 *     .every('active')
	 * // → true
	 *
	 * @example Or use key/operator/value syntax:
	 * collect([{ qty: 5 }, { qty: 10 }])
	 *     .every('qty', '>=', 5)
	 * // → true
	 *
	 * @see {@link some} - checking if any item passes
	 * @see {@link contains} - Check if a specific value exists
	 *
	 * @category Checking
	 */
	every(keyOrCallback: string | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): boolean {
		// biome-ignore lint/complexity/noArguments: detect explicit undefined vs omitted
		if (arguments.length === 1) {
			const callback = useAsCallable(keyOrCallback)
				? (keyOrCallback as (value: T, key: string) => boolean)
				: valueRetriever(keyOrCallback as string);

			if (this.#arrayItems) {
				for (let i = 0; i < this.#arrayItems.length; i++) {
					if (!callback(this.#arrayItems[i], String(i))) return false;
				}
				return true;
			}

			for (const [key, val] of Object.entries(this.items)) {
				if (!callback(val, key)) return false;
			}
			return true;
		}

		return this.every(operatorForWhere(keyOrCallback as string, operator, value));
	}

	/**
	 * The `some` method is an alias for the `contains` method.
	 *
	 * It determines whether the collection contains any items that pass the given truth test.
	 * This method is useful for developers coming from JavaScript's Array.some() convention.
	 *
	 * @param keyOrCallback - Value to find, property key, or callback function
	 * @param operator - Comparison operator when using key/value syntax
	 * @param value - Value to compare against
	 * @returns True if any item passes the test
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5])
	 *     .some(n => n > 4)
	 * // → true
	 *
	 * @see {@link contains} - Primary method (identical behavior)
	 * @see {@link every} - checking if all items pass
	 *
	 * @category Checking
	 */
	some(keyOrCallback: T | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): boolean {
		return this.contains(keyOrCallback, operator, value);
	}

	/**
	 * The `toArray` method converts the collection into a plain array.
	 *
	 * For associative collections (keyed objects), it returns a record instead. Nested
	 * collections are also recursively converted to arrays/records.
	 *
	 * @returns Plain array or record of values
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .toArray()
	 * // → [1, 2, 3]
	 *
	 * @example For an associative collection:
	 * collect({ a: 1, b: 2 })
	 *     .toArray()
	 * // → { a: 1, b: 2 }
	 *
	 * @example For nested collections:
	 * collect([collect([1, 2]), collect([3, 4])])
	 *     .toArray()
	 * // → [[1, 2], [3, 4]]
	 *
	 * @see {@link all} - Get raw items without recursion
	 * @see {@link values} - Get values as new collection
	 * @see {@link toJson} - Convert to JSON string
	 *
	 * @category Aggregating
	 */
	toArray(): T[] | Record<string, T> {
		const items = this.#arrayItems ?? Object.values(this.items);
		const keys = this.#arrayItems ? items.map((_, i) => String(i)) : Object.keys(this.items);

		if (keys.length === 0) {
			return [];
		}

		const isSequentialArray = keys.every((k, i) => k === String(i));

		if (isSequentialArray) {
			const result: unknown[] = [];
			for (const val of items) {
				result.push(val instanceof Collection ? val.toArray() : val);
			}
			return result as T[];
		}

		const result: Record<string, unknown> = {};
		for (let i = 0; i < items.length; i++) {
			const val = items[i];
			result[keys[i]] = val instanceof Collection ? val.toArray() : val;
		}
		return result as Record<string, T>;
	}

	/**
	 * The `toJson` method converts the collection into a JSON serialized string.
	 *
	 * @param _options - Unused, kept for Laravel API compatibility
	 * @returns JSON string representation
	 *
	 * @example
	 * collect({ name: 'Desk', price: 200 })
	 *     .toJson()
	 * // → '{"name":"Desk","price":200}'
	 *
	 * @see {@link toPrettyJson} - JSON with indentation
	 * @see {@link toArray} - Convert to array/record
	 * @see {@link toString} - Convert to comma-separated string
	 *
	 * @category Aggregating
	 */
	toJson(_options?: number): string {
		return JSON.stringify(this.all());
	}

	/**
	 * The `toPrettyJson` method converts the collection into a pretty-printed JSON string.
	 *
	 * Uses 2-space indentation for readability.
	 *
	 * @returns Formatted JSON string with indentation
	 *
	 * @example
	 * collect({ name: 'Desk', price: 200 })
	 *     .toPrettyJson()
	 * // → '{\n  "name": "Desk",\n  "price": 200\n}'
	 *
	 * @see {@link toJson} - Compact JSON string
	 * @see {@link toArray} - Convert to array/record
	 *
	 * @category Aggregating
	 */
	toPrettyJson(): string {
		return JSON.stringify(this.all(), null, 2);
	}

	/**
	 * The `collect` method returns a new Collection instance with the current items. This is useful
	 * when you want to break the chain and get a fresh collection, or convert a subclass back to a
	 * base Collection.
	 *
	 * @returns New Collection instance with the same items
	 *
	 * @example
	 * const original = collect([1, 2, 3]);
	 * const copy = original.collect();
	 * // original and copy are separate instances
	 *
	 * @see {@link toBase} - Convert subclass to base Collection
	 *
	 * @category Transforming
	 */
	collect(): Collection<T> {
		return new Collection(this.all());
	}

	/**
	 * The `toBase` method returns a base Collection instance from the current collection. This is
	 * useful when working with collection subclasses and you need to ensure you have a standard
	 * Collection instance.
	 *
	 * @returns Base Collection instance
	 *
	 * @example
	 * class CustomCollection extends Collection {}
	 * const custom = new CustomCollection([1, 2, 3]);
	 * const base = custom.toBase();
	 * // base instanceof Collection === true
	 *
	 * @see {@link collect} - Create a new collection copy
	 *
	 * @category Transforming
	 */
	toBase(): Collection<T> {
		return new Collection(this);
	}

	/**
	 * The `pipe` method passes the collection to the given closure and returns the result of the
	 * executed closure. This is useful for wrapping the collection in custom logic or breaking
	 * out of the method chain when needed.
	 *
	 * @param callback - Function receiving the collection and returning any value
	 * @returns The callback's return value
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
	 * @see {@link tap} - Execute callback but return collection unchanged
	 * @see {@link pipeInto} - passing collection to a class constructor
	 * @see {@link pipeThrough} - passing through multiple callbacks
	 *
	 * @category Transforming
	 */
	pipe<U>(callback: (collection: this) => U): U {
		return callback(this);
	}

	/**
	 * The `pipeInto` method creates a new instance of the given class and passes the collection
	 * into the constructor. This is useful for wrapping the collection in domain-specific
	 * objects or adapters.
	 *
	 * @param classType - Class constructor that accepts the collection
	 * @returns New instance of the given class
	 *
	 * @example
	 * class Report {
	 *     constructor(private data: Collection<number>) {}
	 *     summary() { return { total: this.data.sum(), avg: this.data.avg() }; }
	 * }
	 *
	 * collect([10, 20, 30])
	 *     .pipeInto(Report)
	 *     .summary()
	 * // → { total: 60, avg: 20 }
	 *
	 * @see {@link pipe} - passing collection to a callback
	 * @see {@link mapInto} - Create instances from each item
	 *
	 * @category Transforming
	 */
	pipeInto<U>(classType: new (collection: this) => U): U {
		return new classType(this);
	}

	/**
	 * The `pipeThrough` method passes the collection through a series of callbacks and returns
	 * the final result. Each callback receives the result of the previous callback, creating
	 * a pipeline of transformations.
	 *
	 * @param callbacks - Array of functions to pipe through sequentially
	 * @returns The final callback's return value
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
	 * const addTax = (c) => c.map(p => p * 1.1);
	 * const round = (c) => c.map(p => Math.round(p));
	 *
	 * collect([100, 200])
	 *     .pipeThrough([addTax, round])
	 *     .all()
	 * // → [110, 220]
	 *
	 * @see {@link pipe} - passing through a single callback
	 *
	 * @category Transforming
	 */
	pipeThrough<R>(callbacks: ((value: unknown) => unknown)[]): R {
		let result: unknown = this;
		for (const callback of callbacks) {
			result = callback(result);
		}
		return result as R;
	}

	/**
	 * Pass the collection to the given callback and return it unchanged.
	 *
	 * Useful for debugging or side effects mid-chain.
	 *
	 * @param callback - Function receiving the collection
	 * @returns The collection (unchanged)
	 *
	 * @example To debug mid-chain:
	 * collect([1, 2, 3])
	 *   .map(n => n * 2)
	 *   .tap(c => console.log(c.all()))
	 *   .filter(n => n > 2)
	 *
	 * @see {@link each} - Execute callback for each item
	 * @see {@link pipe} - Transform and return callback result
	 * @see {@link dump} - Log collection contents
	 *
	 * @category Transforming
	 */
	tap(callback?: (collection: this) => void): this {
		if (callback) {
			callback(this);
		}
		return this;
	}

	/**
	 * The `dump` method outputs the collection's items to the console and returns the collection,
	 * allowing you to inspect the contents at any point in a method chain without interrupting
	 * the flow.
	 *
	 * @param args - Additional arguments to log alongside the collection
	 * @returns This collection (unchanged)
	 *
	 * @example To debug mid-chain:
	 * collect([1, 2, 3])
	 *     .map(n => n * 2)
	 *     .dump()              // Logs: [2, 4, 6]
	 *     .filter(n => n > 3)
	 *     .all()
	 * // → [4, 6]
	 *
	 * @example You may also pass a label:
	 * collection.dump('after filter')
	 * // Logs: [items...] 'after filter'
	 *
	 * @see {@link dd} - Dump and halt execution
	 * @see {@link tap} - Execute any callback mid-chain
	 *
	 * @category Transforming
	 */
	dump(...args: unknown[]): this {
		console.log(this.all(), ...args);
		return this;
	}

	/**
	 * The `dd` method outputs the collection's items to the console and then throws an error
	 * to halt script execution. This is useful for debugging when you want to inspect the
	 * collection and stop processing. The name comes from "dump and die."
	 *
	 * @param args - Additional arguments to log alongside the collection
	 * @throws Always throws an Error after dumping
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .map(n => n * 2)
	 *     .dd()  // Logs: [2, 4, 6], then throws
	 *     .filter(n => n > 3)  // Never reached
	 *
	 * @see {@link dump} - Dump without halting
	 *
	 * @category Transforming
	 */
	dd(...args: unknown[]): never {
		console.log(this.all(), ...args);
		throw new Error('dd() called');
	}

	/**
	 * The `ensure` method verifies that all elements of the collection are of a given type.
	 *
	 * Throws `UnexpectedValueException` if any item does not match the allowed type(s).
	 * Supports primitive type strings ('string', 'number', 'boolean', etc.) as well as
	 * class constructors for instanceof checks.
	 *
	 * @param type - Type string(s) or constructor class(es) to validate against
	 * @returns This collection (if all items pass)
	 * @throws UnexpectedValueException if any item fails validation
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .ensure('number')
	 * // → Collection [1, 2, 3]
	 *
	 * @example For class instances:
	 * collect([new User(), new User()])
	 *     .ensure(User)
	 * // → Collection [User, User]
	 *
	 * @example For multiple types:
	 * collect([1, 'two', 3])
	 *     .ensure(['number', 'string'])
	 * // → Collection [1, 'two', 3]
	 *
	 * @see {@link whereInstanceOf} - Filter to instances of a type
	 *
	 * @category Checking
	 */
	// biome-ignore lint/suspicious/noExplicitAny: generic constructor type
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
	 * The `forPage` method returns a new collection containing the items that would
	 * be present on a given page number. The method accepts the page number as its
	 * first argument and the number of items to show per page as its second argument.
	 *
	 * @param page - The page number (1-indexed)
	 * @param perPage - Number of items per page
	 * @returns New collection containing items for the specified page
	 *
	 * @example
	 * collect([1, 2, 3, 4, 5, 6, 7, 8, 9])
	 *     .forPage(2, 3)
	 * // → [4, 5, 6]
	 *
	 * @example For the first page:
	 * collect(['a', 'b', 'c', 'd', 'e'])
	 *     .forPage(1, 2)
	 * // → ['a', 'b']
	 *
	 * @see {@link slice} - Get items by offset and length
	 * @see {@link take} - Take the first N items
	 * @see {@link chunk} - Split into chunks of a given size
	 *
	 * @category Filtering
	 */
	forPage(page: number, perPage: number): Collection<T> {
		const offset = Math.max(0, (page - 1) * perPage);
		return this.slice(offset, perPage);
	}

	/**
	 * The `value` method retrieves a given value from the first element of the
	 * collection. This is useful for quickly extracting a single property from
	 * the first item without having to call `first()` separately.
	 *
	 * @param key - The property key to retrieve
	 * @param defaultValue - Optional value to return if not found
	 * @returns The value at the key from the first matching item
	 *
	 * @example
	 * collect([
	 *     { name: 'Taylor', role: 'admin' },
	 *     { name: 'Abigail', role: 'user' }
	 * ]).value('name')
	 * // → 'Taylor'
	 *
	 * @example You may pass a default:
	 * collect([]).value('name', 'Unknown')
	 * // → 'Unknown'
	 *
	 * @see {@link first} - Get the first item
	 * @see {@link pluck} - Extract a property from all items
	 * @see {@link get} - Get by collection key
	 *
	 * @category Finding
	 */
	value<K extends keyof T>(key: K, defaultValue?: T[K] | (() => T[K])): T[K] | undefined {
		const item = this.first((target) => dataGet(target, key as string) !== undefined);
		if (item === undefined) {
			return typeof defaultValue === 'function' ? (defaultValue as () => T[K])() : defaultValue;
		}
		return dataGet(item, key as string) as T[K];
	}

	/**
	 * The `when` method will execute the given callback when the first argument given to the
	 * method evaluates to true. The collection instance and the resolved value are passed to
	 * the closure. An optional second callback is executed when the condition is falsy.
	 *
	 * @param value - Condition to evaluate (or callback returning condition)
	 * @param callback - Executed when condition is truthy
	 * @param defaultCallback - Executed when condition is falsy (optional)
	 * @returns Result of the executed callback, or this collection if no callback ran
	 *
	 * @example
	 * collect([1, 2, 3])
	 *     .when(shouldDouble, c => c.map(n => n * 2))
	 *     .all()
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
	 * // → [{ name: 'Desk', active: true }]
	 *
	 * @example You may also pass a callback as the condition:
	 * collect([1, 2, 3])
	 *     .when(c => c.count() > 2, c => c.take(2))
	 *
	 * @see {@link unless} - Execute when condition is falsy
	 * @see {@link whenEmpty} - Execute when collection is empty
	 * @see {@link whenNotEmpty} - Execute when collection has items
	 *
	 * @category Transforming
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
	 * The `unless` method will execute the given callback when the first argument given to the
	 * method evaluates to false. This is the inverse of the `when` method. An optional second
	 * callback is executed when the condition is truthy.
	 *
	 * @param value - Condition to evaluate (or callback returning condition)
	 * @param callback - Executed when condition is falsy
	 * @param defaultCallback - Executed when condition is truthy (optional)
	 * @returns Result of the executed callback, or this collection if no callback ran
	 *
	 * @example To skip filtering for admins:
	 * const isAdmin = false
	 * collect([
	 *   { title: 'Public Post', public: true },
	 *   { title: 'Draft', public: false },
	 * ])
	 *   .unless(isAdmin, c => c.where('public', true))
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
	 * // → both posts (showAll is true)
	 *
	 * @see {@link when} - Execute when condition is truthy
	 * @see {@link whenEmpty} - Execute when collection is empty
	 *
	 * @category Transforming
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
	 * The `whenEmpty` method will execute the given callback when the collection is empty.
	 * An optional second callback is executed when the collection is not empty.
	 *
	 * @param callback - Executed when collection is empty
	 * @param defaultCallback - Executed when collection is not empty (optional)
	 * @returns Result of the executed callback, or this collection if no callback ran
	 *
	 * @example To provide defaults for an empty collection:
	 * collect([])
	 *     .whenEmpty(c => collect(['default']))
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
	whenEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.when(this.isEmpty(), callback, defaultCallback);
	}

	/**
	 * The `whenNotEmpty` method will execute the given callback when the collection is not empty.
	 * An optional second callback is executed when the collection is empty.
	 *
	 * @param callback - Executed when collection has items
	 * @param defaultCallback - Executed when collection is empty (optional)
	 * @returns Result of the executed callback, or this collection if no callback ran
	 *
	 * @example To process only if items exist:
	 * collect([
	 *   { id: 1, total: 100 },
	 *   { id: 2, total: 200 },
	 * ])
	 *   .whenNotEmpty(c => c.pluck('total'))
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
	 * @see {@link when} - Execute on arbitrary condition
	 * @see {@link isNotEmpty} - Check if collection has items
	 *
	 * @category Transforming
	 */
	whenNotEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.when(this.isNotEmpty(), callback, defaultCallback);
	}

	/**
	 * Alias for whenNotEmpty.
	 *
	 * @category Transforming
	 */
	unlessEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.whenNotEmpty(callback, defaultCallback);
	}

	/**
	 * Alias for whenEmpty.
	 *
	 * @category Transforming
	 */
	unlessNotEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.whenEmpty(callback, defaultCallback);
	}

	/**
	 * The `offsetExists` method determines if a key exists at the given offset.
	 *
	 * This method implements the ArrayAccess interface pattern, allowing bracket-style
	 * key existence checks. It is used internally for array-like access.
	 *
	 * @param key - Key to check
	 * @returns True if the key exists
	 *
	 * @example
	 * collect({ a: 1, b: 2 })
	 *     .offsetExists('a')
	 * // → true
	 *
	 * @see {@link has} - Primary method for key existence checks
	 * @see {@link offsetGet} - Get value at offset
	 *
	 * @category Checking
	 */
	offsetExists(key: string | number): boolean {
		return String(key) in this.items;
	}

	/**
	 * Get the value at a given offset.
	 *
	 * @category Finding
	 */
	offsetGet(key: string | number): T {
		return this.items[String(key)];
	}

	/**
	 * Set the value at a given offset.
	 *
	 * @category Transforming
	 */
	offsetSet(key: string | number | null, value: T): void {
		if (key === null) {
			this.push(value);
		} else {
			this.items[String(key)] = value;
		}
	}

	/**
	 * Remove the value at a given offset.
	 *
	 * @category Transforming
	 */
	offsetUnset(key: string | number): void {
		delete this.items[String(key)];
	}

	[Symbol.iterator](): Iterator<T> {
		return Object.values(this.items)[Symbol.iterator]();
	}

	/**
	 * The `with` method joins the collection with a related collection, enabling
	 * operations that correlate items between the two. This is useful for scenarios
	 * similar to database joins where you need to work with related data sets.
	 *
	 * @param related - The related collection to join with
	 * @returns A WithCollection that allows map/each operations with access to related items
	 *
	 * @example To join users with orders:
	 * const users = collect([
	 *   { id: 1, name: 'Taylor' },
	 *   { id: 2, name: 'Abigail' },
	 * ])
	 * const orders = collect([
	 *   { userId: 1, total: 100 },
	 *   { userId: 1, total: 200 },
	 * ])
	 * users.with(orders).map((user, related) => ({
	 *   ...user,
	 *   orderCount: related.count(),
	 * }))
	 *
	 * @see {@link crossJoin} - Create cartesian product of two collections
	 * @see {@link zip} - Pair items by index
	 *
	 * @category Combining
	 */
	with<U>(related: ProxiedCollection<U, CollectionKind>): WithCollection<T, U> {
		return new WithCollection(this as unknown as ProxiedCollection<T>, related);
	}

	/**
	 * The `lazy` method returns a new LazyCollection instance from the underlying items.
	 *
	 * This is particularly useful when you need to perform transformations on a large collection
	 * and want to defer processing until the items are actually needed.
	 *
	 * @category Transforming
	 */
	lazy(): ProxiedLazyCollection<T> {
		// Already have array items? Wrap them.
		if (this.#arrayItems !== null) {
			return lazyFn(this.#arrayItems);
		}
		// Already have items? Wrap the values.
		if (this._items !== null) {
			return lazyFn(Object.values(this._items));
		}
		// Have unconsumed source? Transfer it.
		if (this.#source !== null) {
			const source = this.#source;
			this.#source = null;
			this.#sourceTransferred = true;
			return lazyFn(source);
		}
		if (this.#sourceTransferred) {
			throw new Error('Collection source was already consumed or transferred.');
		}
		return lazyFn([] as T[]);
	}
}

export class WithCollection<T, U, CK extends CollectionKind = 'array'> {
	constructor(
		private readonly primary: ProxiedCollection<T, CK>,
		private readonly related: ProxiedCollection<U, CollectionKind>,
	) {}

	map<R>(fn: (item: T, related: Collection<U, CollectionKind>) => R): Collection<R, CK> {
		return this.primary.map((item) => {
			const filtered = this.related.filter((value) => (value as unknown) === (item as unknown));
			return fn(item, filtered);
		});
	}

	mapWithKey<R>(fn: (item: T, key: CollectionKey<CK>, related: Collection<U, CollectionKind>) => R): Collection<R, CK> {
		return this.primary.map((item, key) => {
			const filtered = this.related.filter((value) => (value as unknown) === (item as unknown));
			return fn(item, key, filtered);
		});
	}

	each(fn: (item: T, related: Collection<U, CollectionKind>) => unknown): this {
		this.primary.each((item) => {
			const filtered = this.related.filter((value) => (value as unknown) === (item as unknown));
			return fn(item, filtered);
		});
		return this;
	}

	all(): CK extends 'array' ? T[] : Record<string, T> {
		return this.primary.all();
	}
}

/**
 * Interface for collect.lazy() with static factory methods.
 */
export interface LazyCollectFunction {
	<T>(source: Iterable<T> | (() => Generator<T>)): ProxiedLazyCollection<T>;
	range(from: number, to: number): ProxiedLazyCollection<number>;
	times<T>(n: number, callback?: (index: number) => T): ProxiedLazyCollection<T | number>;
	empty<T>(): ProxiedLazyCollection<T>;
}

/**
 * Interface for collect.async() with static factory methods.
 */
export interface AsyncCollectFunction {
	<T>(source: T[]): ProxiedAsyncLazyCollection<T>;
	<T>(source: Iterable<T>): ProxiedAsyncLazyCollection<T>;
	<T>(source: AsyncIterable<T>): ProxiedAsyncLazyCollection<T>;
	<T>(source: () => Generator<T>): ProxiedAsyncLazyCollection<T>;
	<T>(source: () => AsyncGenerator<T>): ProxiedAsyncLazyCollection<T>;
	range(from: number, to: number): ProxiedAsyncLazyCollection<number>;
	times<T>(n: number, callback?: (index: number) => T): ProxiedAsyncLazyCollection<T | number>;
	empty<T>(): ProxiedAsyncLazyCollection<T>;
}

/**
 * Interface for the collect function with lazy and async entry points.
 */
export interface CollectFunction {
	<T>(items: T[]): ProxiedCollection<T, 'array'>;
	<T>(items: readonly T[]): ProxiedCollection<T, 'array'>;
	<T>(items: Record<string, T>): ProxiedCollection<T, 'assoc'>;
	<T>(items: Collection<T, CollectionKind>): ProxiedCollection<T, 'array'>;
	<T>(items: Iterable<T>): ProxiedCollection<T, 'array'>;
	<T>(items: () => Generator<T>): ProxiedCollection<T, 'array'>;
	<T>(): ProxiedCollection<T, 'array'>;

	/**
	 * Create a lazy collection for deferred evaluation.
	 * @see https://laravel.com/docs/collections#lazy-collections
	 */
	lazy: LazyCollectFunction;

	/**
	 * Create an async lazy collection for async iteration.
	 * @see https://laravel.com/docs/collections#lazy-collections
	 */
	async: AsyncCollectFunction;
}

function collectImpl<T>(items?: CollectInput<T> | Collection<T, CollectionKind>): ProxiedCollection<T, CollectionKind> {
	// Empty or undefined → empty Collection
	if (items === undefined || items === null) {
		return wrapCollectionWithProxy(new Collection<T>([])) as ProxiedCollection<T, 'array'>;
	}

	// Collection → return wrapped
	if (items instanceof Collection) {
		return wrapCollectionWithProxy(items) as ProxiedCollection<T, CollectionKind>;
	}

	// Array → Collection (optimized array path)
	if (Array.isArray(items)) {
		return wrapCollectionWithProxy(new Collection(items as T[])) as ProxiedCollection<T, 'array'>;
	}

	// Plain object → Collection (associative)
	if (isPlainObject<T>(items)) {
		return wrapCollectionWithProxy(new Collection(items, true)) as ProxiedCollection<T, 'assoc'>;
	}

	// Generator function or iterable → Collection (deferred consumption)
	return wrapCollectionWithProxy(new Collection(items)) as ProxiedCollection<T, 'array'>;
}

const lazyWithStatics = Object.assign(lazyFn, lazyStatics);
const asyncWithStatics = Object.assign(asyncLazyFn, asyncStatics);

collectImpl.lazy = lazyWithStatics;
collectImpl.async = asyncWithStatics;

export const collect: CollectFunction = collectImpl as CollectFunction;

export type CollectedState<T> = {
	[K in keyof T]: T[K] extends (infer U)[]
		? Collection<U>
		: T[K] extends Record<string, infer V>
			? Collection<V>
			: T[K];
};

export function collectState<T extends Record<string, unknown>>(state: T): CollectedState<T> {
	const wrapped: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(state)) {
		if (key.startsWith('_')) {
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

export function toArray<T>(input: Arrayable<T>): readonly T[] {
	return arrayableToArray(input);
}
