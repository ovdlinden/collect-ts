/**
 * LazyCollection - Laravel-style lazy collection using generators.
 *
 * Only ~12 methods are implemented as truly lazy. All other methods
 * auto-delegate to Collection via Proxy for zero code duplication.
 *
 * @see https://laravel.com/docs/collections#lazy-collections
 */

import { Collection, collect } from './Collection.js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type LazySource<T> = (() => Generator<[string, T]>) | T[];

/**
 * ProxiedLazyCollection type - LazyCollection with all Collection methods available via delegation.
 */
export type ProxiedLazyCollection<T> = LazyCollection<T> & {
	// All Collection methods are available via Proxy delegation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in keyof Collection<T>]: Collection<T>[K];
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a value is a Generator (not a generator function).
 */
function isGenerator(value: unknown): value is Generator {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof (value as Generator).next === 'function' &&
		typeof (value as Generator)[Symbol.iterator] === 'function'
	);
}

/**
 * Normalize source to a generator function that yields [key, value] pairs.
 */
function normalizeSource<T>(source: Iterable<T> | (() => Generator<T>) | undefined): LazySource<T> {
	if (source === undefined || source === null) {
		return [];
	}

	if (Array.isArray(source)) {
		return source;
	}

	if (typeof source === 'function') {
		// Wrap the generator function to yield [key, value] pairs
		return function* () {
			let index = 0;
			for (const value of source()) {
				yield [String(index++), value] as [string, T];
			}
		};
	}

	// It's an iterable - convert to array
	return [...source];
}

/**
 * Create an iterator from the source.
 */
function* makeIterator<T>(source: LazySource<T>): Generator<[string, T]> {
	if (Array.isArray(source)) {
		for (let i = 0; i < source.length; i++) {
			yield [String(i), source[i]];
		}
	} else {
		yield* source();
	}
}

/**
 * Forward reference to the proxy wrapper.
 * Set after the class is defined to allow lazy methods to return ProxiedLazyCollection.
 */
// Initialized to null, set to wrapLazyWithProxy after class definition
let wrapProxy: <U>(lc: LazyCollection<U>) => ProxiedLazyCollection<U> = null!;

// ═══════════════════════════════════════════════════════════════════════════
// LAZY COLLECTION CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LazyCollection - Memory-efficient collection using generators.
 *
 * Only implements ~12 truly lazy methods. All other methods
 * auto-delegate to Collection via Proxy.
 */
export class LazyCollection<T> implements Iterable<T> {
	/**
	 * The source of items - either an array or a generator function.
	 * Like Laravel's $source property.
	 */
	public source: LazySource<T>;

	constructor(source?: Iterable<T> | (() => Generator<T>)) {
		// Reject raw generators (like Laravel)
		if (isGenerator(source)) {
			throw new Error(
				'Generators should not be passed directly to LazyCollection. ' +
					'Pass a generator function instead: LazyCollection.make(() => myGenerator())',
			);
		}
		this.source = normalizeSource(source);
	}

	// ═══════════════════════════════════════════════════════════════════════
	// ITERATOR PROTOCOL
	// ═══════════════════════════════════════════════════════════════════════

	*[Symbol.iterator](): Generator<T> {
		for (const [, value] of makeIterator(this.source)) {
			yield value;
		}
	}

	/**
	 * Iterate over entries (key-value pairs).
	 */
	*entries(): Generator<[string, T]> {
		yield* makeIterator(this.source);
	}

	// ═══════════════════════════════════════════════════════════════════════
	// STATIC FACTORY METHODS
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Create a new lazy collection from a generator function.
	 */
	static make<U>(source: () => Generator<U>): ProxiedLazyCollection<U> {
		return lazy(new LazyCollection(source));
	}

	/**
	 * Create a lazy collection with a range of numbers.
	 */
	static range(from: number, to: number): ProxiedLazyCollection<number> {
		return lazy(
			new LazyCollection(function* () {
				const step = from <= to ? 1 : -1;
				for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
					yield i;
				}
			}),
		);
	}

	/**
	 * Create a lazy collection by invoking a callback a given number of times.
	 */
	static times<U>(n: number, callback?: (index: number) => U): ProxiedLazyCollection<U | number> {
		return lazy(
			new LazyCollection(function* () {
				for (let i = 1; i <= n; i++) {
					yield callback ? callback(i) : i;
				}
			}),
		);
	}

	/**
	 * Create an empty lazy collection.
	 */
	static empty<U>(): ProxiedLazyCollection<U> {
		return lazy(new LazyCollection<U>([]));
	}

	// ═══════════════════════════════════════════════════════════════════════
	// TRULY LAZY METHODS (~12 methods)
	// These are the only methods that return LazyCollection and maintain laziness
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Map each item using a callback.
	 */
	map<U>(callback: (value: T, key: string) => U): ProxiedLazyCollection<U> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					yield callback(value, key);
				}
			}),
		);
	}

	/**
	 * Filter items using a callback.
	 */
	filter(callback?: (value: T, key: string) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					if (callback ? callback(value, key) : Boolean(value)) {
						yield value;
					}
				}
			}),
		);
	}

	/**
	 * Reject items using a callback (inverse of filter).
	 */
	reject(callback: (value: T, key: string) => boolean): ProxiedLazyCollection<T> {
		return this.filter((value, key) => !callback(value, key));
	}

	/**
	 * Take the first n items.
	 */
	take(limit: number): ProxiedLazyCollection<T> {
		if (limit < 0) {
			// For negative limit, we need to collect and take from end
			// This breaks laziness but matches Laravel behavior
			const all = [...this];
			return wrapProxy(new LazyCollection(all.slice(limit)));
		}

		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				let count = 0;
				for (const [, value] of makeIterator(source)) {
					yield value;
					if (++count >= limit) break;
				}
			}),
		);
	}

	/**
	 * Skip the first n items.
	 */
	skip(count: number): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				let skipped = 0;
				for (const [, value] of makeIterator(source)) {
					if (skipped++ < count) continue;
					yield value;
				}
			}),
		);
	}

	/**
	 * Take items while the callback returns true.
	 */
	takeWhile(callback: (value: T, key: string) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					if (!callback(value, key)) break;
					yield value;
				}
			}),
		);
	}

	/**
	 * Take items until the callback returns true.
	 */
	takeUntil(callback: (value: T, key: string) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					if (callback(value, key)) break;
					yield value;
				}
			}),
		);
	}

	/**
	 * Skip items while the callback returns true.
	 */
	skipWhile(callback: (value: T, key: string) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				let skipping = true;
				for (const [key, value] of makeIterator(source)) {
					if (skipping && callback(value, key)) continue;
					skipping = false;
					yield value;
				}
			}),
		);
	}

	/**
	 * Skip items until the callback returns true.
	 */
	skipUntil(callback: (value: T, key: string) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				let skipping = true;
				for (const [key, value] of makeIterator(source)) {
					if (skipping && !callback(value, key)) continue;
					skipping = false;
					yield value;
				}
			}),
		);
	}

	/**
	 * Map and flatten the result.
	 */
	flatMap<U>(callback: (value: T, key: string) => Iterable<U>): ProxiedLazyCollection<U> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					yield* callback(value, key);
				}
			}),
		);
	}

	/**
	 * Chunk the collection into smaller collections.
	 */
	chunk(size: number): ProxiedLazyCollection<T[]> {
		if (size <= 0) {
			return wrapProxy(new LazyCollection<T[]>([]));
		}

		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				let chunk: T[] = [];
				for (const [, value] of makeIterator(source)) {
					chunk.push(value);
					if (chunk.length === size) {
						yield chunk;
						chunk = [];
					}
				}
				if (chunk.length > 0) {
					yield chunk;
				}
			}),
		);
	}

	/**
	 * Execute a callback on each item (consuming the iterator).
	 */
	each(callback: (value: T, key: string) => unknown): this {
		for (const [key, value] of makeIterator(this.source)) {
			if (callback(value, key) === false) break;
		}
		return this;
	}

	/**
	 * Pass the collection to a callback and return this.
	 */
	tap(callback: (collection: this) => void): this {
		callback(this);
		return this;
	}

	// ═══════════════════════════════════════════════════════════════════════
	// LAZY COLLECTION-SPECIFIC METHODS
	// These methods are unique to LazyCollection (not in Collection)
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Execute a callback on each item lazily (vs eager `each`).
	 * The callback is executed when the item is yielded, not immediately.
	 */
	tapEach(callback: (value: T, key: string) => void): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					callback(value, key);
					yield value;
				}
			}),
		);
	}

	/**
	 * Take items until the specified timeout is reached.
	 */
	takeUntilTimeout(timeout: Date): ProxiedLazyCollection<T> {
		const timeoutMs = timeout.getTime();
		const source = this.source;
		return wrapProxy(
			new LazyCollection(function* () {
				for (const [, value] of makeIterator(source)) {
					if (Date.now() >= timeoutMs) break;
					yield value;
				}
			}),
		);
	}

	/**
	 * Cache enumerated values for re-iteration.
	 * Once an item is yielded, it's stored so subsequent iterations
	 * don't need to re-compute it.
	 */
	remember(): ProxiedLazyCollection<T> {
		const cache: T[] = [];
		let cacheComplete = false;
		const source = this.source;

		return wrapProxy(
			new LazyCollection(function* () {
				// First, yield any cached items
				for (const item of cache) {
					yield item;
				}

				// If cache is complete, we're done
				if (cacheComplete) return;

				// Continue iterating from where we left off
				let index = cache.length;
				for (const [, value] of makeIterator(source)) {
					// Skip items we've already cached
					if (index > 0) {
						index--;
						continue;
					}
					cache.push(value);
					yield value;
				}
				cacheComplete = true;
			}),
		);
	}

	// ═══════════════════════════════════════════════════════════════════════
	// TERMINAL METHODS (materialize to values)
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Convert to an eager Collection.
	 */
	collect(): Collection<T> {
		return collect([...this]);
	}

	/**
	 * Get all items as an array.
	 */
	all(): T[] {
		return [...this];
	}

	/**
	 * Get all items as an array (alias for all).
	 */
	toArray(): T[] {
		return [...this];
	}

	/**
	 * Get the first item.
	 */
	first(callback?: (value: T, key: string) => boolean): T | undefined {
		for (const [key, value] of makeIterator(this.source)) {
			if (!callback || callback(value, key)) {
				return value;
			}
		}
		return undefined;
	}

	/**
	 * Get the last item.
	 * Note: This consumes the entire iterator.
	 */
	last(callback?: (value: T, key: string) => boolean): T | undefined {
		let lastValue: T | undefined;
		for (const [key, value] of makeIterator(this.source)) {
			if (!callback || callback(value, key)) {
				lastValue = value;
			}
		}
		return lastValue;
	}

	/**
	 * Count the items.
	 * Note: This consumes the entire iterator.
	 */
	count(): number {
		let count = 0;
		for (const _ of this) {
			count++;
		}
		return count;
	}

	/**
	 * Check if the collection is empty.
	 */
	isEmpty(): boolean {
		for (const _ of this) {
			return false;
		}
		return true;
	}

	/**
	 * Check if the collection is not empty.
	 */
	isNotEmpty(): boolean {
		return !this.isEmpty();
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// PROXY WRAPPER FOR AUTO-DELEGATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Properties to bypass in the proxy.
 */
const BYPASS_PROPERTIES = new Set<string | symbol>([
	'then',
	'catch',
	'finally',
	'constructor',
	'prototype',
	Symbol.iterator,
	Symbol.toStringTag,
]);

/**
 * Wrap a LazyCollection with a Proxy that auto-delegates unknown methods to Collection.
 */
function wrapLazyWithProxy<T>(lazyCollection: LazyCollection<T>): ProxiedLazyCollection<T> {
	return new Proxy(lazyCollection, {
		get(target, prop: string | symbol, receiver) {
			// Bypass symbols and special properties
			if (typeof prop === 'symbol' || BYPASS_PROPERTIES.has(prop)) {
				return Reflect.get(target, prop, receiver);
			}

			// Return native LazyCollection methods/properties
			if (prop in target) {
				const value = Reflect.get(target, prop, receiver);
				return typeof value === 'function' ? value.bind(target) : value;
			}

			// AUTO-DELEGATE: collect().method()
			// All other methods delegate to Collection
			return (...args: unknown[]) => {
				const collected = target.collect();
				const method = (collected as unknown as Record<string, unknown>)[prop as string];
				if (typeof method === 'function') {
					return method.apply(collected, args);
				}
				return method;
			};
		},
	}) as ProxiedLazyCollection<T>;
}

// Set the forward reference so lazy methods can use the wrapper
wrapProxy = wrapLazyWithProxy;

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new lazy collection.
 *
 * @example
 * ```ts
 * // From array
 * lazy([1, 2, 3]).map(x => x * 2).all();
 *
 * // From generator function
 * lazy(function* () {
 *   yield 1;
 *   yield 2;
 * }).filter(x => x > 1).all();
 *
 * // All Collection methods work via delegation
 * lazy([1, 2, 3]).sum(); // 6
 * ```
 */
export function lazy<T>(source: Iterable<T> | LazyCollection<T> | (() => Generator<T>)): ProxiedLazyCollection<T> {
	if (source instanceof LazyCollection) {
		return wrapLazyWithProxy(source);
	}
	return wrapLazyWithProxy(new LazyCollection(source));
}
