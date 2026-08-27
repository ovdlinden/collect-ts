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

	static make<U>(items: Items<U> | CollectionParam<U> = []): Collection<U> {
		return new Collection(items as Items<U> | Collection<U>);
	}

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

	static empty<U>(): Collection<U> {
		return new Collection<U>([]);
	}

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

	static fromJson<U>(json: string): Collection<U> {
		return new Collection(JSON.parse(json));
	}

	/**
	 * Returns the underlying array or record.
	 *
	 * @example
	 * ```ts
	 * collect([1, 2, 3]).all()  // [1, 2, 3]
	 * collect({ a: 1, b: 2 }).all()  // { a: 1, b: 2 }
	 * ```
	 *
	 * @see {@link toArray} for always-array output
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
	 * Get an item by key, or return a default value.
	 * @example
	 * collect({name: 'Taylor', role: 'admin'}).get('name')
	 * // => 'Taylor'
	 * @example
	 * collect({name: 'Taylor'}).get('missing', 'default')
	 * // => 'default'
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
	 * Get the first item, or the first item matching a callback.
	 *
	 * @param callback - Optional function to test each item
	 * @param defaultValue - Value to return if no item found (can be a factory function)
	 * @returns The first matching item, or undefined/default if not found
	 *
	 * @example
	 * collect([1, 2, 3]).first()
	 * // => 1
	 *
	 * @example With callback
	 * collect([1, 2, 3, 4]).first(n => n > 2)
	 * // => 3
	 *
	 * @example With default
	 * collect([]).first(null, 'default')
	 * // => 'default'
	 *
	 * @see {@link last} - Get the last item instead
	 * @see {@link firstOrFail} - Throws if no item found
	 * @see {@link sole} - Get the only item, throws if not exactly one
	 * @see {@link firstWhere} - Find by key/value pair
	 *
	 * @category Getting
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
	 * Get the last item, or the last item matching a callback.
	 *
	 * @param callback - Optional function to test each item
	 * @param defaultValue - Value to return if no item found (can be a factory function)
	 * @returns The last matching item, or undefined/default if not found
	 *
	 * @example
	 * collect([1, 2, 3]).last()
	 * // => 3
	 *
	 * @example With callback
	 * collect([1, 2, 3, 4]).last(n => n < 3)
	 * // => 2
	 *
	 * @see {@link first} - Get the first item instead
	 * @see {@link pop} - Remove and return the last item
	 *
	 * @category Getting
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
	 * Returns all keys as a new collection.
	 *
	 * @example
	 * ```ts
	 * collect({ a: 1, b: 2 }).keys()  // Collection ['a', 'b']
	 * collect([10, 20]).keys()  // Collection ['0', '1']
	 * ```
	 */
	keys(): Collection<string> {
		if (this.#arrayItems) {
			return new Collection(this.#arrayItems.map((_, i) => String(i)));
		}
		return new Collection(Object.keys(this.items));
	}

	/**
	 * Returns all values as a new collection.
	 *
	 * @example
	 * ```ts
	 * collect({ a: 1, b: 2 }).values()  // Collection [1, 2]
	 * ```
	 */
	values(): Collection<T> {
		if (this.#arrayItems) {
			return new Collection([...this.#arrayItems]);
		}
		return new Collection(Object.values(this.items));
	}

	/**
	 * Transform each item in the collection.
	 *
	 * @param callback - Function to transform each item. Receives value and key.
	 * @returns New collection with transformed items
	 *
	 * @example
	 * collect([1, 2, 3]).map(n => n * 2)
	 * // => Collection [2, 4, 6]
	 *
	 * @example Extract property
	 * collect(users).map(u => u.name)
	 * // => Collection ['Taylor', 'Abigail']
	 *
	 * @see {@link pluck} - Extract a single property by key
	 * @see {@link mapWithKeys} - Transform and change keys
	 * @see {@link flatMap} - Map and flatten results
	 * @see {@link transform} - Mutate the collection in place
	 *
	 * @category Mapping
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

	mapToGroups<K extends string, V>(callback: (value: T, key: string) => [K, V]): Collection<Collection<V>> {
		const groups = this.mapToDictionary(callback);
		const result: Record<string, Collection<V>> = {};
		for (const [key, values] of Object.entries(groups.items)) {
			result[key] = new Collection(values as V[]);
		}
		return new Collection(result);
	}

	mapInto<U>(classType: new (value: T, key: CollectionKey<CK>) => U): Collection<U, CK> {
		return this.map((value, key) => new classType(value, key));
	}

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
	 * collect([[1, 2], [3, 4]]).flatMap(arr => arr.map(n => n * 2))
	 * // => Collection [2, 4, 6, 8]
	 *
	 * @see {@link map} - Transform without flattening
	 * @see {@link flatten} - Flatten without mapping
	 * @see {@link collapse} - Flatten arrays of arrays
	 *
	 * @category Mapping
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
	 * Filter items by a callback, or remove falsy values if no callback given.
	 *
	 * @param callback - Function to test each item. Receives value and key. If omitted, removes falsy values.
	 * @returns New collection containing only items that passed the test
	 *
	 * @example
	 * collect([1, 2, 3, 4]).filter(n => n > 2)
	 * // => Collection [3, 4]
	 *
	 * @example Remove falsy values
	 * collect([0, 1, '', 'hello', null]).filter()
	 * // => Collection [1, 'hello']
	 *
	 * @see {@link reject} - Inverse: keeps items that fail the test
	 * @see {@link where} - Filter by key/value instead of callback
	 * @see {@link whereIn} - Filter where key matches array of values
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
	 * Filter out items that match the callback (inverse of filter).
	 *
	 * @param callback - Function to test each item, or a value to reject by loose equality
	 * @returns New collection with matching items removed
	 *
	 * @example
	 * collect([1, 2, 3, 4]).reject(n => n > 2)
	 * // => Collection [1, 2]
	 *
	 * @example Reject by value
	 * collect([1, null, 3]).reject(null)
	 * // => Collection [1, 3]
	 *
	 * @see {@link filter} - Inverse: keeps items that pass the test
	 * @see {@link whereNotIn} - Exclude items matching array of values
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
	 * Flattens a collection of arrays into a single flat collection.
	 *
	 * @example
	 * ```ts
	 * collect([[1, 2], [3, 4]]).collapse()  // Collection [1, 2, 3, 4]
	 * ```
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
	 * Flattens nested arrays/collections to the specified depth.
	 *
	 * @example
	 * ```ts
	 * collect([[1, [2]], [3]]).flatten()  // Collection [1, 2, 3]
	 * collect([[1, [2]], [3]]).flatten(1)  // Collection [1, [2], 3]
	 * ```
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

	flip(): Collection<string> {
		const flipped: Record<string, string> = {};
		for (const [key, value] of Object.entries(this.items)) {
			flipped[String(value)] = key;
		}
		return new Collection(flipped, true);
	}

	/**
	 * Splits the collection into chunks of the given size.
	 *
	 * @example
	 * ```ts
	 * collect([1, 2, 3, 4, 5]).chunk(2)
	 * // Collection [Collection [1, 2], Collection [3, 4], Collection [5]]
	 * ```
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

	splitIn(numberOfGroups: number): Collection<Collection<T>> {
		const chunkSize = Math.ceil(this.count() / numberOfGroups);
		return this.chunk(chunkSize);
	}

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

	reverse(): Collection<T> {
		if (this.#arrayItems) {
			return new Collection([...this.#arrayItems].reverse());
		}
		const values = [...Object.values(this.items)].reverse();
		return new Collection(values);
	}

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
	 * Check if the collection contains a value, or if any item matches a callback.
	 *
	 * Uses loose equality (==) to match Laravel behavior. JS differs from PHP:
	 * 0==false, null==undefined, ""==0.
	 *
	 * @param keyOrCallback - Value to find, property key, or callback function
	 * @param operator - Comparison operator when using key/value syntax
	 * @param value - Value to compare against when using key/operator/value syntax
	 * @returns True if item exists, false otherwise
	 *
	 * @example Check value exists
	 * collect([1, 2, 3]).contains(2)
	 * // => true
	 *
	 * @example With callback
	 * collect(users).contains(u => u.active)
	 * // => true if any user is active
	 *
	 * @example Key/value syntax
	 * collect(users).contains('role', 'admin')
	 * // => true if any user has role 'admin'
	 *
	 * @see {@link containsStrict} - Uses strict equality (===)
	 * @see {@link doesntContain} - Inverse: returns true if NOT found
	 * @see {@link some} - Alias for contains
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

	doesntContainStrict(keyOrValue: T | string | ((value: T, key: string) => boolean), value?: T): boolean {
		if (value !== undefined) {
			return !this.containsStrict(keyOrValue, value);
		}
		return !this.containsStrict(keyOrValue);
	}

	/**
	 * Returns items not present in the given array.
	 *
	 * @example
	 * ```ts
	 * collect([1, 2, 3]).diff([2, 3, 4])  // Collection [1]
	 * ```
	 *
	 * @see {@link intersect} for items present in both
	 */
	diff(items: Arrayable<T>): Collection<T, CK> {
		const otherValues = new Set(arrayableToArray(items));
		if (this.#arrayItems) {
			return new Collection(arrayFilterBySet(this.#arrayItems, otherValues, false)) as Collection<T, CK>;
		}
		return this.filter((value) => !otherValues.has(value));
	}

	diffUsing(items: Arrayable<T>, callback: (a: T, b: T) => number): Collection<T, CK> {
		const otherValues = arrayableToArray(items);
		return this.filter((value) => !otherValues.some((other) => callback(value, other) === 0));
	}

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
	 * Returns items present in both collections.
	 *
	 * @example
	 * ```ts
	 * collect([1, 2, 3]).intersect([2, 3, 4])  // Collection [2, 3]
	 * ```
	 *
	 * @see {@link diff} for items not present in the other
	 */
	intersect(items: Arrayable<T>): Collection<T, CK> {
		const otherValues = new Set(arrayableToArray(items));
		if (this.#arrayItems) {
			return new Collection(arrayFilterBySet(this.#arrayItems, otherValues, true)) as Collection<T, CK>;
		}
		return this.filter((value) => otherValues.has(value));
	}

	intersectUsing(items: Arrayable<T>, callback: (a: T, b: T) => number): Collection<T, CK> {
		const otherValues = arrayableToArray(items);
		return this.filter((value) => otherValues.some((other) => callback(value, other) === 0));
	}

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

	duplicatesStrict(callback?: ValueRetriever<T, unknown>): Collection<T> {
		return this.duplicates(callback, true);
	}

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
	 * Count the number of items in the collection.
	 *
	 * @returns Number of items
	 *
	 * @example
	 * collect([1, 2, 3]).count()
	 * // => 3
	 *
	 * @see {@link countBy} - Count items grouped by key/callback
	 * @see {@link isEmpty} - Check if collection has no items
	 * @see {@link isNotEmpty} - Check if collection has items
	 *
	 * @category Reducing
	 */
	count(): number {
		if (this.#arrayItems) {
			return this.#arrayItems.length;
		}
		return Object.keys(this.items).length;
	}

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
	 * @example Sum numbers
	 * collect([1, 2, 3]).sum()
	 * // => 6
	 *
	 * @example Sum property
	 * collect(orders).sum('total')
	 * // => 150.00
	 *
	 * @see {@link avg} - Calculate average instead
	 * @see {@link min} - Get minimum value
	 * @see {@link max} - Get maximum value
	 * @see {@link count} - Count items instead
	 *
	 * @category Reducing
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
	 * Get the average of all items, or a specific key/callback result.
	 * @example
	 * collect([1, 2, 3]).avg()
	 * // => 2
	 * @example
	 * collect(products).avg('price')
	 * // => 29.99
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

	average(keyOrCallback?: ValueRetriever<T, number>): number | null {
		return this.avg(keyOrCallback);
	}

	/**
	 * Returns the minimum value, or null if empty.
	 *
	 * @example
	 * ```ts
	 * collect([3, 1, 2]).min()  // 1
	 * collect(products).min('price')  // 9.99
	 * ```
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
	 * Returns the maximum value, or null if empty.
	 *
	 * @example
	 * ```ts
	 * collect([1, 2, 3]).max()  // 3
	 * collect(products).max('price')  // 99.99
	 * ```
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

	percentage(callback: (value: T, key: CollectionKey<CK>) => boolean, precision = 2): number | null {
		if (this.isEmpty()) return null;
		const count = this.filter(callback).count();
		return Number(((count / this.count()) * 100).toFixed(precision));
	}

	/**
	 * Merges items into the collection. Later values overwrite earlier ones.
	 *
	 * @example
	 * ```ts
	 * collect({ a: 1 }).merge({ b: 2 })  // Collection { a: 1, b: 2 }
	 * collect([1, 2]).merge([3, 4])  // Collection [1, 2, 3, 4]
	 * ```
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

	union(items: Collectable<T>): Collection<T, CK> {
		let other: Record<string, T>;
		if ('all' in items && typeof (items as CollectionParam<T>).all === 'function') {
			other = (items as CollectionParam<T>).all() as Record<string, T>;
		} else {
			other = items as Record<string, T>;
		}
		return new Collection({ ...other, ...this.items });
	}

	combine<U>(values: Arrayable<U>): Collection<U, 'assoc'> {
		const keys = this.#arrayItems ?? Object.values(this.items);
		const vals = arrayableToArray(values);
		const result: Record<string, U> = {};
		for (let i = 0; i < keys.length && i < vals.length; i++) {
			result[String(keys[i])] = vals[i];
		}
		return new Collection(result);
	}

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

	put(key: string | number, value: T): this {
		this.invalidateArrayItems();
		this.items[String(key)] = value;
		return this;
	}

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

	push(...values: T[]): this {
		this.invalidateArrayItems();
		let nextKey = this.getNextNumericKey();
		for (const value of values) {
			this.items[String(nextKey++)] = value;
		}
		this._nextNumericKey = nextKey;
		return this;
	}

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

	unshift(...values: T[]): this {
		this.invalidateArrayItems();
		const currentValues = Object.values(this.items);
		this.items = Object.fromEntries([...values, ...currentValues].map((v, i) => [String(i), v]));
		return this;
	}

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

	add(item: T): this {
		return this.push(item);
	}

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

	has(key: string | number | (string | number)[]): boolean {
		const keys = Array.isArray(key) ? key : [key];
		for (const k of keys) {
			if (!(String(k) in this.items)) return false;
		}
		return true;
	}

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
	 * @example By property
	 * collect(users).groupBy('role')
	 * // => Collection { admin: Collection [...], editor: Collection [...] }
	 *
	 * @example By callback
	 * collect(orders).groupBy(o => o.total > 100 ? 'large' : 'small')
	 * // => Collection { large: Collection [...], small: Collection [...] }
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
	 * collect(users).keyBy('id')
	 * // => Collection { 1: {id: 1, name: 'Taylor'}, 2: {id: 2, name: 'Abigail'} }
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
	 * Sort items by a key or callback result in ascending order.
	 *
	 * @param callback - Property key or callback returning value to sort by
	 * @param _options - Unused, kept for Laravel API compatibility
	 * @param descending - Sort in descending order instead
	 * @returns New sorted collection
	 *
	 * @example By property
	 * collect(users).sortBy('name')
	 * // => sorted A-Z by name
	 *
	 * @example By callback
	 * collect(users).sortBy(u => u.age)
	 * // => sorted by age ascending
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

	sortByDesc(callback: ValueRetriever<T, unknown>, options?: number): Collection<T> {
		return this.sortBy(callback as ValueRetriever<T, unknown>, options, true);
	}

	sortKeys(_options?: number, descending = false): Collection<T> {
		const entries = Object.entries(this.items);
		entries.sort(([a], [b]) => {
			const result = a.localeCompare(b);
			return descending ? -result : result;
		});
		return new Collection(Object.fromEntries(entries));
	}

	sortKeysDesc(options?: number): Collection<T> {
		return this.sortKeys(options, true);
	}

	sortKeysUsing(callback: (a: string, b: string) => number): Collection<T> {
		const entries = Object.entries(this.items);
		entries.sort(([a], [b]) => callback(a, b));
		return new Collection(Object.fromEntries(entries));
	}

	skip(count: number): Collection<T> {
		return this.slice(count);
	}

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

	take(limit: number): Collection<T> {
		if (limit < 0) {
			return this.slice(limit);
		}
		return this.slice(0, limit);
	}

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

	toString(): string {
		return this.join(', ');
	}

	isEmpty(): boolean {
		if (this.#arrayItems) {
			return this.#arrayItems.length === 0;
		}
		return Object.keys(this.items).length === 0;
	}

	isNotEmpty(): boolean {
		return !this.isEmpty();
	}

	containsOneItem(callback?: (value: T, key: CollectionKey<CK>) => boolean): boolean {
		if (callback) {
			return this.filter(callback).count() === 1;
		}
		return this.count() === 1;
	}

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
	 * @example Extract values
	 * collect(users).pluck('name')
	 * // => Collection ['Taylor', 'Abigail']
	 *
	 * @example With custom keys
	 * collect(users).pluck('name', 'id')
	 * // => Collection { 1: 'Taylor', 2: 'Abigail' }
	 *
	 * @see {@link map} - Transform items with full callback control
	 * @see {@link value} - Get first item's value at path
	 *
	 * @category Mapping
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

	/** Mutates in place (unlike map). */
	transform(callback: (value: T, key: string) => T): this {
		this.invalidateArrayItems();
		for (const key in this.items) {
			this.items[key] = callback(this.items[key], key);
		}
		return this;
	}

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

	multiply(multiplier: number): Collection<T> {
		const values = this.#arrayItems ?? Object.values(this.items);
		const result: T[] = [];
		for (let i = 0; i < multiplier; i++) {
			result.push(...values);
		}
		return new Collection(result);
	}

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
	 * Remove duplicate items, optionally by a key or callback.
	 *
	 * @param keyOrCallback - Property key or callback to determine uniqueness
	 * @param strict - Use strict equality (===) instead of loose equality
	 * @returns New collection with duplicates removed
	 *
	 * @example
	 * collect([1, 1, 2, 2, 3]).unique()
	 * // => Collection [1, 2, 3]
	 *
	 * @example By property
	 * collect(users).unique('email')
	 * // => Collection with unique emails
	 *
	 * @see {@link uniqueStrict} - Always uses strict equality
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

	uniqueStrict(keyOrCallback?: ValueRetriever<T, unknown>): Collection<T> {
		return this.unique(keyOrCallback, true);
	}

	/**
	 * Filter items by a key/value pair, with optional comparison operator.
	 *
	 * @param key - Property key to check (supports dot notation)
	 * @param operatorOrValue - Comparison operator or value if no operator
	 * @param value - Value to compare against when operator is provided
	 * @returns New collection with matching items
	 *
	 * @example Equality check
	 * collect(users).where('active', true)
	 * // => Collection of active users
	 *
	 * @example With operator
	 * collect(orders).where('total', '>', 100)
	 * // => Collection of orders over 100
	 *
	 * @see {@link whereStrict} - Uses strict equality (===)
	 * @see {@link whereIn} - Match against array of values
	 * @see {@link whereNotIn} - Exclude items matching array of values
	 * @see {@link whereBetween} - Match values in a range
	 * @see {@link whereNull} - Match null values
	 * @see {@link filter} - Filter with custom callback
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

	whereStrict(key: string, value: unknown): Collection<T, CK> {
		return this.filter((item) => dataGet(item, key) === value);
	}

	whereIn(key: string, values: unknown[], strict = false): Collection<T, CK> {
		return this.filter((item) => {
			const retrieved = dataGet(item, key);
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			return strict ? values.some((v) => v === retrieved) : values.some((v) => v == retrieved);
		});
	}

	whereInStrict(key: string, values: unknown[]): Collection<T, CK> {
		return this.whereIn(key, values, true);
	}

	whereNotIn(key: string, values: unknown[], strict = false): Collection<T, CK> {
		return this.filter((item) => {
			const retrieved = dataGet(item, key);
			// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
			return strict ? !values.some((v) => v === retrieved) : !values.some((v) => v == retrieved);
		});
	}

	whereNotInStrict(key: string, values: unknown[]): Collection<T, CK> {
		return this.whereNotIn(key, values, true);
	}

	whereBetween(key: string, values: [number, number]): Collection<T, CK> {
		return this.where(key, '>=', values[0]).where(key, '<=', values[1]);
	}

	whereNotBetween(key: string, values: [number, number]): Collection<T, CK> {
		return this.filter((item) => {
			const value = dataGet(item, key) as number;
			return value < values[0] || value > values[1];
		});
	}

	whereNull(key?: string): Collection<T, CK> {
		return this.filter((item) => {
			const value = key ? dataGet(item, key) : item;
			return value === null || value === undefined;
		});
	}

	whereNotNull(key?: string): Collection<T, CK> {
		return this.filter((item) => {
			const value = key ? dataGet(item, key) : item;
			return value !== null && value !== undefined;
		});
	}

	whereInstanceOf<U>(type: new (...args: unknown[]) => U): Collection<U> {
		return this.filter((item) => item instanceof type) as unknown as Collection<U>;
	}

	/**
	 * Get the first item matching a key/value pair.
	 * @example
	 * collect(users).firstWhere('role', 'admin')
	 * // => { id: 1, name: 'Taylor', role: 'admin' }
	 * @example
	 * collect(orders).firstWhere('total', '>', 100)
	 * // => first order over 100
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
	 * Iterate over items, executing a callback for each.
	 *
	 * Return false from the callback to stop iteration early.
	 *
	 * @param callback - Function to execute for each item
	 * @returns The collection (for chaining)
	 *
	 * @example
	 * collect([1, 2, 3]).each(n => console.log(n))
	 * // logs: 1, 2, 3
	 *
	 * @example Stop early
	 * collect([1, 2, 3]).each(n => {
	 *   if (n === 2) return false
	 *   console.log(n)
	 * })
	 * // logs: 1
	 *
	 * @see {@link tap} - Execute callback on entire collection
	 * @see {@link map} - Transform items instead of side effects
	 * @see {@link eachSpread} - Spread array items as arguments
	 *
	 * @category Iteration
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

	reduceSpread<U extends unknown[]>(callback: (...args: [...U, T, string]) => U, ...initial: U): U {
		let result = initial;
		for (const [key, value] of Object.entries(this.items)) {
			result = callback(...result, value, key);
		}
		return result;
	}

	reduceWithKeys<U>(callback: (carry: U, value: T, key: string) => U, initial: U): U {
		return this.reduce(callback, initial);
	}

	reduceInto<U>(initial: U, callback: (carry: U, value: T, key: string) => void): U {
		for (const [key, value] of Object.entries(this.items)) {
			callback(initial, value, key);
		}
		return initial;
	}

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

	some(keyOrCallback: T | ((value: T, key: string) => boolean), operator?: unknown, value?: unknown): boolean {
		return this.contains(keyOrCallback, operator, value);
	}

	/**
	 * Converts the collection to a plain array or record, recursively.
	 *
	 * @example
	 * ```ts
	 * collect([1, 2, 3]).toArray()  // [1, 2, 3]
	 * collect({ a: collect([1]) }).toArray()  // { a: [1] }
	 * ```
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

	toJson(_options?: number): string {
		return JSON.stringify(this.all());
	}

	toPrettyJson(): string {
		return JSON.stringify(this.all(), null, 2);
	}

	collect(): Collection<T> {
		return new Collection(this.all());
	}

	toBase(): Collection<T> {
		return new Collection(this);
	}

	pipe<U>(callback: (collection: this) => U): U {
		return callback(this);
	}

	pipeInto<U>(classType: new (collection: this) => U): U {
		return new classType(this);
	}

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
	 * @example Debug mid-chain
	 * collect([1, 2, 3])
	 *   .map(n => n * 2)
	 *   .tap(c => console.log(c.all()))
	 *   .filter(n => n > 2)
	 *
	 * @see {@link each} - Execute callback for each item
	 * @see {@link pipe} - Transform and return callback result
	 * @see {@link dump} - Log collection contents
	 *
	 * @category Iteration
	 */
	tap(callback?: (collection: this) => void): this {
		if (callback) {
			callback(this);
		}
		return this;
	}

	dump(...args: unknown[]): this {
		console.log(this.all(), ...args);
		return this;
	}

	dd(...args: unknown[]): never {
		console.log(this.all(), ...args);
		throw new Error('dd() called');
	}

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

	forPage(page: number, perPage: number): Collection<T> {
		const offset = Math.max(0, (page - 1) * perPage);
		return this.slice(offset, perPage);
	}

	value<K extends keyof T>(key: K, defaultValue?: T[K] | (() => T[K])): T[K] | undefined {
		const item = this.first((target) => dataGet(target, key as string) !== undefined);
		if (item === undefined) {
			return typeof defaultValue === 'function' ? (defaultValue as () => T[K])() : defaultValue;
		}
		return dataGet(item, key as string) as T[K];
	}

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

	whenEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.when(this.isEmpty(), callback, defaultCallback);
	}

	whenNotEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.when(this.isNotEmpty(), callback, defaultCallback);
	}

	unlessEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.whenNotEmpty(callback, defaultCallback);
	}

	unlessNotEmpty<U = this>(callback: (collection: this) => U, defaultCallback?: (collection: this) => U): this | U {
		return this.whenEmpty(callback, defaultCallback);
	}

	offsetExists(key: string | number): boolean {
		return String(key) in this.items;
	}

	offsetGet(key: string | number): T {
		return this.items[String(key)];
	}

	offsetSet(key: string | number | null, value: T): void {
		if (key === null) {
			this.push(value);
		} else {
			this.items[String(key)] = value;
		}
	}

	offsetUnset(key: string | number): void {
		delete this.items[String(key)];
	}

	[Symbol.iterator](): Iterator<T> {
		return Object.values(this.items)[Symbol.iterator]();
	}

	with<U>(related: ProxiedCollection<U, CollectionKind>): WithCollection<T, U> {
		return new WithCollection(this as unknown as ProxiedCollection<T>, related);
	}

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
