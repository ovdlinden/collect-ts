/**
 * @see https://laravel.com/docs/collections#lazy-collections
 */

import {
	Collection,
	dataGet,
	operatorForWhere,
	useAsCallable,
	type ValueRetriever,
	valueRetriever,
	type WhereOperator,
} from './Collection.js';

export type GeneratorFactory<T> = () => Generator<[number, T]>;

type LazySource<T> = GeneratorFactory<T> | T[];

export type ProxiedLazyCollection<T> = LazyCollection<T> & {
	[K in keyof Collection<T>]: Collection<T>[K];
};

export type ProxiedAsyncLazyCollection<T> = AsyncLazyCollection<T> &
	AsyncCollectionMacros<T> & {
		[K in keyof Collection<T>]: Collection<T>[K] extends (...args: infer A) => infer R
			? (...args: A) => Promise<R>
			: Promise<Collection<T>[K]>;
	};

function isGenerator(value: unknown): value is Generator {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof (value as Generator).next === 'function' &&
		typeof (value as Generator)[Symbol.iterator] === 'function'
	);
}

export function isLazyCollection<T = unknown>(value: unknown): value is LazyCollection<T> {
	return value instanceof LazyCollection;
}

export function isAsyncLazyCollection<T = unknown>(value: unknown): value is AsyncLazyCollection<T> {
	return value instanceof AsyncLazyCollection;
}

function normalizeSource<T>(source: Iterable<T> | (() => Generator<T>) | undefined): LazySource<T> {
	if (source === undefined || source === null) {
		return [];
	}

	if (Array.isArray(source)) {
		return source;
	}

	if (typeof source === 'function') {
		return function* () {
			let index = 0;
			for (const value of source()) {
				yield [index++, value] as [number, T];
			}
		};
	}

	return [...source];
}

function* makeIterator<T>(source: LazySource<T>): Generator<[number, T]> {
	if (Array.isArray(source)) {
		for (let i = 0; i < source.length; i++) {
			yield [i, source[i]];
		}
	} else {
		yield* source();
	}
}

function wrap<U>(lc: LazyCollection<U>): ProxiedLazyCollection<U> {
	return wrapLazyWithProxy(lc);
}

function wrapAsync<U>(alc: AsyncLazyCollection<U>): ProxiedAsyncLazyCollection<U> {
	return wrapAsyncLazyWithProxy(alc);
}

export class LazyCollection<T> implements Iterable<T> {
	public source: LazySource<T>;

	constructor(source?: Iterable<T> | (() => Generator<T>)) {
		if (isGenerator(source)) {
			throw new Error(
				'Generators should not be passed directly to LazyCollection. ' +
					'Pass a generator function instead: LazyCollection.make(() => myGenerator())',
			);
		}
		this.source = normalizeSource(source);
	}

	*[Symbol.iterator](): Generator<T> {
		for (const [, value] of makeIterator(this.source)) {
			yield value;
		}
	}

	*entries(): Generator<[number, T]> {
		yield* makeIterator(this.source);
	}

	static make<U>(source: () => Generator<U>): ProxiedLazyCollection<U> {
		return lazy(new LazyCollection(source));
	}

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

	static times<U>(n: number, callback?: (index: number) => U): ProxiedLazyCollection<U | number> {
		return lazy(
			new LazyCollection(function* () {
				for (let i = 1; i <= n; i++) {
					yield callback ? callback(i) : i;
				}
			}),
		);
	}

	static empty<U>(): ProxiedLazyCollection<U> {
		return lazy(new LazyCollection<U>([]));
	}

	map<U>(callback: (value: T, key: number) => U): ProxiedLazyCollection<U> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					yield callback(value, key);
				}
			}),
		);
	}

	filter(callback?: (value: T, key: number) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					if (callback ? callback(value, key) : Boolean(value)) {
						yield value;
					}
				}
			}),
		);
	}

	reject(callback: (value: T, key: number) => boolean): ProxiedLazyCollection<T> {
		return this.filter((value, key) => !callback(value, key));
	}

	take(limit: number): ProxiedLazyCollection<T> {
		if (limit < 0) {
			return wrap(new LazyCollection([...this].slice(limit)));
		}

		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				let count = 0;
				for (const [, value] of makeIterator(source)) {
					yield value;
					if (++count >= limit) break;
				}
			}),
		);
	}

	skip(count: number): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				let skipped = 0;
				for (const [, value] of makeIterator(source)) {
					if (skipped++ < count) continue;
					yield value;
				}
			}),
		);
	}

	takeWhile(callback: (value: T, key: number) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					if (!callback(value, key)) break;
					yield value;
				}
			}),
		);
	}

	takeUntil(callback: (value: T, key: number) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					if (callback(value, key)) break;
					yield value;
				}
			}),
		);
	}

	skipWhile(callback: (value: T, key: number) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
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

	skipUntil(callback: (value: T, key: number) => boolean): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
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

	flatMap<U>(callback: (value: T, key: number) => Iterable<U>): ProxiedLazyCollection<U> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					yield* callback(value, key);
				}
			}),
		);
	}

	chunk(size: number): ProxiedLazyCollection<T[]> {
		if (size <= 0) {
			return wrap(new LazyCollection<T[]>([]));
		}

		const source = this.source;
		return wrap(
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

	each(callback: (value: T, key: number) => unknown): this {
		for (const [key, value] of makeIterator(this.source)) {
			if (callback(value, key) === false) break;
		}
		return this;
	}

	tap(callback: (collection: this) => void): this {
		callback(this);
		return this;
	}

	tapEach(callback: (value: T, key: number) => void): ProxiedLazyCollection<T> {
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [key, value] of makeIterator(source)) {
					callback(value, key);
					yield value;
				}
			}),
		);
	}

	takeUntilTimeout(timeout: Date): ProxiedLazyCollection<T> {
		const timeoutMs = timeout.getTime();
		const source = this.source;
		return wrap(
			new LazyCollection(function* () {
				for (const [, value] of makeIterator(source)) {
					if (Date.now() >= timeoutMs) break;
					yield value;
				}
			}),
		);
	}

	remember(): ProxiedLazyCollection<T> {
		const cache: T[] = [];
		let iteratorInstance: Generator<[number, T]> | null = null;
		let iteratorExhausted = false;
		const source = this.source;

		return wrap(
			new LazyCollection(function* () {
				if (iteratorInstance === null) {
					iteratorInstance = makeIterator(source);
				}

				let index = 0;
				while (index < cache.length) {
					yield cache[index];
					index++;
				}

				if (iteratorExhausted || !iteratorInstance) return;

				while (true) {
					const result = iteratorInstance.next();
					if (result.done) {
						iteratorExhausted = true;
						break;
					}
					const [, value] = result.value;
					cache.push(value);
					yield value;
				}
			}),
		);
	}

	/** @see https://laravel.com/docs/collections#method-withheartbeat */
	withHeartbeat(intervalSeconds: number, callback: () => void): ProxiedLazyCollection<T> {
		const source = this.source;
		const intervalMs = intervalSeconds * 1000;

		return wrap(
			new LazyCollection(function* () {
				let lastHeartbeat = Date.now();

				for (const [, value] of makeIterator(source)) {
					const now = Date.now();
					if (now - lastHeartbeat >= intervalMs) {
						callback();
						lastHeartbeat = now;
					}
					yield value;
				}
			}),
		);
	}

	/** Async because JS can't block like PHP's sleep(). */
	throttle(seconds: number): ProxiedAsyncLazyCollection<T> {
		return wrapAsync(new AsyncLazyCollection(this.source, seconds * 1000));
	}

	collect(): Collection<T> {
		return new Collection([...this]);
	}

	all(): T[] {
		return [...this];
	}

	toArray(): T[] {
		return [...this];
	}

	first(callback?: (value: T, key: number) => boolean): T | undefined {
		for (const [key, value] of makeIterator(this.source)) {
			if (!callback || callback(value, key)) {
				return value;
			}
		}
		return undefined;
	}

	last(callback?: (value: T, key: number) => boolean): T | undefined {
		let lastValue: T | undefined;
		for (const [key, value] of makeIterator(this.source)) {
			if (!callback || callback(value, key)) {
				lastValue = value;
			}
		}
		return lastValue;
	}

	count(): number {
		let count = 0;
		for (const _ of this) {
			count++;
		}
		return count;
	}

	isEmpty(): boolean {
		for (const _ of this) {
			return false;
		}
		return true;
	}

	isNotEmpty(): boolean {
		return !this.isEmpty();
	}

	sum(keyOrCallback?: ValueRetriever<T, number>): number {
		const retriever = valueRetriever<T, number>(keyOrCallback);
		let total = 0;
		for (const [key, value] of makeIterator(this.source)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num)) {
				total += num;
			}
		}
		return total;
	}

	min(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever<T, number>(keyOrCallback);
		let min: number | null = null;
		for (const [key, value] of makeIterator(this.source)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num) && (min === null || num < min)) {
				min = num;
			}
		}
		return min;
	}

	max(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever<T, number>(keyOrCallback);
		let max: number | null = null;
		for (const [key, value] of makeIterator(this.source)) {
			const num = retriever(value, key);
			if (typeof num === 'number' && !Number.isNaN(num) && (max === null || num > max)) {
				max = num;
			}
		}
		return max;
	}

	avg(keyOrCallback?: ValueRetriever<T, number>): number | null {
		const retriever = valueRetriever<T, number>(keyOrCallback);
		let total = 0;
		let count = 0;
		for (const [key, value] of makeIterator(this.source)) {
			const num = retriever(value, key);
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

	contains(
		keyOrCallback: T | string | ((value: T, key: number) => boolean),
		operator?: WhereOperator | unknown,
		value?: unknown,
	): boolean {
		if (operator === undefined && value === undefined) {
			if (useAsCallable(keyOrCallback)) {
				return this.first(keyOrCallback as (v: T, k: number) => boolean) !== undefined;
			}
			for (const [, val] of makeIterator(this.source)) {
				// biome-ignore lint/suspicious/noDoubleEquals: Laravel uses loose comparison
				if (val == keyOrCallback) {
					return true;
				}
			}
			return false;
		}
		return this.contains(operatorForWhere<T>(keyOrCallback as string, operator, value) as (v: T, k: number) => boolean);
	}

	containsStrict(keyOrValue: T | string | ((value: T, key: number) => boolean), value?: unknown): boolean {
		if (value !== undefined) {
			return this.contains((item) => dataGet(item, keyOrValue as string) === value);
		}
		if (useAsCallable(keyOrValue)) {
			return this.first(keyOrValue as (v: T, k: number) => boolean) !== undefined;
		}
		for (const [, item] of makeIterator(this.source)) {
			if (item === keyOrValue) {
				return true;
			}
		}
		return false;
	}
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extend this interface to add type-safe custom macros to AsyncLazyCollection.
 */
export interface AsyncCollectionMacros<_T> {
	readonly [key: string]: ((...args: never[]) => unknown) | undefined;
}

export class AsyncLazyCollection<T> implements AsyncIterable<T> {
	// biome-ignore lint/suspicious/noExplicitAny: Macros can have any signature
	private static macros: Map<string, (...args: any[]) => any> = new Map();

	public source: LazySource<T>;
	private _asyncSource: AsyncIterable<T> | null;
	private delayMs: number;

	constructor(source: LazySource<T>, delayMs = 0, asyncSource?: AsyncIterable<T>) {
		this.source = source;
		this.delayMs = delayMs;
		this._asyncSource = asyncSource ?? null;
	}

	// biome-ignore lint/suspicious/noExplicitAny: Macros can have any signature
	static macro(name: string, fn: (...args: any[]) => any): void {
		AsyncLazyCollection.macros.set(name, fn);
	}

	static hasMacro(name: string): boolean {
		return AsyncLazyCollection.macros.has(name);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Macros can have any signature
	static getMacro(name: string): ((...args: any[]) => any) | undefined {
		return AsyncLazyCollection.macros.get(name);
	}

	static flushMacros(): void {
		AsyncLazyCollection.macros.clear();
	}

	static empty<U>(): ProxiedAsyncLazyCollection<U> {
		return wrapAsync(new AsyncLazyCollection<U>([], 0));
	}

	static range(from: number, to: number): ProxiedAsyncLazyCollection<number> {
		const source: GeneratorFactory<number> = function* () {
			const step = from <= to ? 1 : -1;
			let index = 0;
			for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
				yield [index++, i];
			}
		};
		return wrapAsync(new AsyncLazyCollection<number>(source, 0));
	}

	static times<U>(n: number, callback?: (index: number) => U): ProxiedAsyncLazyCollection<U | number> {
		const source: GeneratorFactory<U | number> = function* () {
			for (let i = 1; i <= n; i++) {
				yield [i - 1, callback ? callback(i) : i];
			}
		};
		return wrapAsync(new AsyncLazyCollection<U | number>(source, 0));
	}

	static fromAsync<U>(asyncIterable: AsyncIterable<U>): ProxiedAsyncLazyCollection<U> {
		return wrapAsync(new AsyncLazyCollection<U>([], 0, asyncIterable));
	}

	/**
	 * Yields item first, then sleeps remaining time (matching Laravel's behavior).
	 */
	async *[Symbol.asyncIterator](): AsyncGenerator<T> {
		if (this._asyncSource) {
			for await (const value of this._asyncSource) {
				yield value;
			}
			return;
		}
		for (const [, value] of makeIterator(this.source)) {
			const startTime = performance.now();
			yield value;

			if (this.delayMs > 0) {
				const remainingSleep = this.delayMs - (performance.now() - startTime);
				if (remainingSleep > 0) {
					await delay(remainingSleep);
				}
			}
		}
	}

	async toArray(): Promise<T[]> {
		const result: T[] = [];
		for await (const item of this) {
			result.push(item);
		}
		return result;
	}

	async all(): Promise<T[]> {
		return this.toArray();
	}

	async collect(): Promise<Collection<T>> {
		return new Collection(await this.toArray());
	}

	async first(callback?: (value: T, key: number) => boolean): Promise<T | undefined> {
		let index = 0;
		for await (const item of this) {
			if (!callback || callback(item, index)) {
				return item;
			}
			index++;
		}
		return undefined;
	}

	async each(callback: (value: T, key: number) => unknown): Promise<void> {
		let index = 0;
		for await (const item of this) {
			if (callback(item, index++) === false) {
				break;
			}
		}
	}

	async count(): Promise<number> {
		let count = 0;
		for await (const _ of this) {
			count++;
		}
		return count;
	}

	tap(callback?: (self: this) => void): this {
		if (callback) callback(this);
		return this;
	}

	pipe<R>(fn: (self: this) => R): R {
		return fn(this);
	}

	when<V>(
		value: V | ((self: this) => V),
		callback?: (self: this, value: V) => this,
		defaultCallback?: (self: this, value: V) => this,
	): this {
		const resolvedValue = typeof value === 'function' ? (value as (self: this) => V)(this) : value;
		if (resolvedValue) return callback ? callback(this, resolvedValue) : this;
		return defaultCallback ? defaultCallback(this, resolvedValue) : this;
	}

	unless<V>(
		value: V | ((self: this) => V),
		callback?: (self: this, value: V) => this,
		defaultCallback?: (self: this, value: V) => this,
	): this {
		const resolvedValue = typeof value === 'function' ? (value as (self: this) => V)(this) : value;
		if (!resolvedValue) return callback ? callback(this, resolvedValue) : this;
		return defaultCallback ? defaultCallback(this, resolvedValue) : this;
	}

	map<U>(callback: (value: T, key: number) => U): ProxiedAsyncLazyCollection<U> {
		const source = this.source;
		const delayMs = this.delayMs;

		const newSource: GeneratorFactory<U> = function* () {
			let index = 0;
			for (const [, value] of makeIterator(source)) {
				yield [index, callback(value, index)];
				index++;
			}
		};

		return wrapAsync(new AsyncLazyCollection<U>(newSource, delayMs));
	}

	filter(callback?: (value: T, key: number) => boolean): ProxiedAsyncLazyCollection<T> {
		const source = this.source;
		const delayMs = this.delayMs;

		const newSource: GeneratorFactory<T> = function* () {
			let index = 0;
			let newIndex = 0;
			for (const [, value] of makeIterator(source)) {
				if (callback ? callback(value, index) : Boolean(value)) {
					yield [newIndex++, value];
				}
				index++;
			}
		};

		return wrapAsync(new AsyncLazyCollection<T>(newSource, delayMs));
	}

	take(limit: number): ProxiedAsyncLazyCollection<T> {
		const source = this.source;
		const delayMs = this.delayMs;

		const newSource: GeneratorFactory<T> = function* () {
			if (limit <= 0) return;

			let count = 0;
			for (const [, value] of makeIterator(source)) {
				yield [count, value];
				if (++count >= limit) break;
			}
		};

		return wrapAsync(new AsyncLazyCollection<T>(newSource, delayMs));
	}

	skip(count: number): ProxiedAsyncLazyCollection<T> {
		const source = this.source;
		const delayMs = this.delayMs;

		const newSource: GeneratorFactory<T> = function* () {
			let skipped = 0;
			let newIndex = 0;
			for (const [, value] of makeIterator(source)) {
				if (skipped++ < count) continue;
				yield [newIndex++, value];
			}
		};

		return wrapAsync(new AsyncLazyCollection<T>(newSource, delayMs));
	}

	throttle(seconds: number): ProxiedAsyncLazyCollection<T> {
		return wrapAsync(new AsyncLazyCollection(this.source, seconds * 1000));
	}
}

const BYPASS_PROPERTIES = new Set<string | symbol>([
	'then',
	'catch',
	'finally',
	'constructor',
	'prototype',
	Symbol.iterator,
	Symbol.asyncIterator,
	Symbol.toStringTag,
]);

function wrapLazyWithProxy<T>(lazyCollection: LazyCollection<T>): ProxiedLazyCollection<T> {
	return new Proxy(lazyCollection, {
		get(target, prop: string | symbol, receiver) {
			if (typeof prop === 'symbol' || BYPASS_PROPERTIES.has(prop)) {
				return Reflect.get(target, prop, receiver);
			}

			if (prop in target) {
				const value = Reflect.get(target, prop, receiver);
				return typeof value === 'function' ? value.bind(target) : value;
			}

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

function wrapAsyncLazyWithProxy<T>(asyncLazyCollection: AsyncLazyCollection<T>): ProxiedAsyncLazyCollection<T> {
	return new Proxy(asyncLazyCollection, {
		get(target, prop: string | symbol, receiver) {
			if (typeof prop === 'symbol' || BYPASS_PROPERTIES.has(prop)) {
				return Reflect.get(target, prop, receiver);
			}

			if (prop in target) {
				const value = Reflect.get(target, prop, receiver);
				return typeof value === 'function' ? value.bind(target) : value;
			}

			const macro = AsyncLazyCollection.getMacro(prop as string);
			if (macro) {
				return (...args: unknown[]) => macro.apply(target, args);
			}

			return async (...args: unknown[]) => {
				const collected = await target.collect();
				const method = (collected as unknown as Record<string, unknown>)[prop as string];
				if (typeof method === 'function') {
					return method.apply(collected, args);
				}
				return method;
			};
		},
	}) as ProxiedAsyncLazyCollection<T>;
}

export function lazy<T>(source: Iterable<T> | LazyCollection<T> | (() => Generator<T>)): ProxiedLazyCollection<T> {
	if (source instanceof LazyCollection) {
		return wrapLazyWithProxy(source);
	}
	return wrapLazyWithProxy(new LazyCollection(source));
}

export function asyncLazy<T>(
	source: Iterable<T> | AsyncIterable<T> | AsyncLazyCollection<T> | (() => Generator<T>) | (() => AsyncGenerator<T>),
): ProxiedAsyncLazyCollection<T> {
	if (source instanceof AsyncLazyCollection) {
		return wrapAsync(source);
	}

	if (typeof source === 'function') {
		const result = source();
		if (Symbol.asyncIterator in result) {
			return AsyncLazyCollection.fromAsync(result as AsyncIterable<T>);
		}
		// Sync generator — wrap in indexed generator factory
		const gen = result as Generator<T>;
		const genSource: GeneratorFactory<T> = function* () {
			let index = 0;
			for (const value of gen) {
				yield [index++, value];
			}
		};
		return wrapAsync(new AsyncLazyCollection<T>(genSource, 0));
	}

	if (typeof source === 'object' && source !== null && Symbol.asyncIterator in source) {
		return AsyncLazyCollection.fromAsync(source as AsyncIterable<T>);
	}

	return wrapAsync(new AsyncLazyCollection<T>([...(source as Iterable<T>)], 0));
}
