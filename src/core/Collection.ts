/**
 * Minimal Collection class - the core state container.
 * Methods are attached via createCollection() or imported from methods/.
 *
 * This file should stay small (~500 lines). All methods go in src/methods/.
 */

import { allOpsCompilable, type ExecutionMode, type Operation, runPipeline } from './pipeline.js';
import {
	COLLECTION_BRAND,
	type CollectInput,
	type CollectionKind,
	type CollectionLike,
	isPlainObject,
} from './types.js';

/** Shared macro registry for Collection */
const collectionMacros: Map<string, (...args: unknown[]) => unknown> = new Map();

/**
 * Core Collection class with minimal functionality.
 * Methods are attached dynamically via createCollection() or prototype extension.
 */
export class CoreCollection<T, CK extends CollectionKind = 'array'> implements CollectionLike<T> {
	readonly [COLLECTION_BRAND] = true as const;

	protected _items: Record<string, T> | null = null;
	protected _lazyItems = false;
	protected _isAssociative: boolean;
	protected _nextNumericKey: number | null = null;

	#arrayItems: T[] | null = null;
	#source: Iterable<T> | (() => Generator<T>) | null = null;
	#sourceTransferred = false;
	#ops: Operation[] = [];

	constructor(items: CollectInput<T> | CoreCollection<T, CollectionKind> = [], isAssociative?: boolean) {
		if (items instanceof CoreCollection) {
			this._copyFrom(items);
		} else if (Array.isArray(items) && isAssociative !== true) {
			this.#arrayItems = items;
			this._lazyItems = true;
		} else if (Array.isArray(items)) {
			this._items = Object.fromEntries(items.map((v, i) => [String(i), v]));
			this.#arrayItems = null;
		} else if (typeof items === 'function') {
			this.#source = items as () => Generator<T>;
		} else if (typeof items === 'object' && items !== null && Symbol.iterator in items) {
			this.#source = items as Iterable<T>;
		} else if (isPlainObject<T>(items)) {
			this._items = { ...items };
			this.#arrayItems = null;
		} else {
			this._items = {};
			this.#arrayItems = null;
		}

		if (isAssociative !== undefined) {
			this._isAssociative = isAssociative;
		} else if (items instanceof CoreCollection) {
			this._isAssociative = items._isAssociative;
		} else if (Array.isArray(items)) {
			this._isAssociative = false;
		} else if (this.#source !== null) {
			this._isAssociative = false;
		} else {
			this._isAssociative = true;
		}
	}

	/** Copy state from another collection (for clone/extend) */
	protected _copyFrom(source: CoreCollection<T, CollectionKind>): void {
		let copied = false;
		try {
			this._items = source._items ? { ...source._items } : null;
			this.#arrayItems = source.#arrayItems ? [...source.#arrayItems] : null;
			this._lazyItems = source._lazyItems;
			this.#source = source.#source;
			this.#sourceTransferred = source.#sourceTransferred;
			copied = true;
		} catch {
			// Proxied or subclassed - use public API
		}
		if (!copied) {
			const all = source.all();
			if (Array.isArray(all)) {
				this.#arrayItems = [...all];
				this._lazyItems = true;
			} else {
				this._items = { ...all };
				this.#arrayItems = null;
			}
		}
	}

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
			this.#arrayItems = [...this._iterateSource(source)];
			this._items = Object.fromEntries(this.#arrayItems.map((v, i) => [String(i), v]));
			this._lazyItems = false;
			return this._items;
		}
		this._items = {};
		return this._items;
	}

	protected set items(value: Record<string, T>) {
		this._items = value;
		this._lazyItems = false;
	}

	private *_iterateSource(source: Iterable<T> | (() => Generator<T>)): Generator<T> {
		if (typeof source === 'function') {
			yield* source();
		} else {
			yield* source;
		}
	}

	// === State Accessors (for methods) ===

	/** Get the raw array if this is array-backed, null otherwise */
	getArrayItems(): T[] | null {
		if (this.#ops.length > 0) {
			return this._execute();
		}
		return this.#arrayItems;
	}

	/** Get the raw record representation */
	getItems(): Record<string, T> {
		return this.items;
	}

	/** Whether this collection is associative (object) vs array-backed */
	get isAssociative(): boolean {
		return this._isAssociative;
	}

	/** Check if this is array-backed (not associative) */
	isArrayBacked(): boolean {
		return this.#arrayItems !== null;
	}

	/** Check if there are pending pipeline operations */
	hasPendingOps(): boolean {
		return this.#ops.length > 0;
	}

	// === Instance Creation ===

	/** Create a new collection instance with the same kind settings */
	newInstance<U>(items: U[] | Record<string, U>, isAssociative?: boolean): CoreCollection<U, CK> {
		return new CoreCollection<U, CK>(items, isAssociative ?? this._isAssociative);
	}

	// === Macro System ===

	static macro(name: string, fn: (...args: unknown[]) => unknown): void {
		collectionMacros.set(name, fn);
	}

	static hasMacro(name: string): boolean {
		return collectionMacros.has(name);
	}

	static flushMacros(): void {
		collectionMacros.clear();
	}

	static getMacro(name: string): ((...args: unknown[]) => unknown) | undefined {
		return collectionMacros.get(name);
	}

	// === Pipeline System ===

	/** Add a deferred operation (creates new collection for immutability) */
	protected _extend(op: Operation): CoreCollection<T, CK> {
		const fork = new CoreCollection<T, CK>(this.#arrayItems ?? [], this._isAssociative);
		fork.#ops = [...this.#ops, op];
		return fork;
	}

	/** Execute pending operations */
	protected _execute(limit?: number): T[] {
		const source = this.#arrayItems ?? Object.values(this._items ?? {});
		if (this.#ops.length === 0) {
			return limit !== undefined && limit < source.length ? source.slice(0, limit) : source;
		}
		return runPipeline(this.#ops, source, limit);
	}

	/** Choose optimal execution mode */
	protected _chooseMode(terminal: string): ExecutionMode {
		if (!this.#arrayItems) return 'iterator';
		if (this.#ops.length === 0) return 'eager';
		if (!allOpsCompilable(this.#ops)) return 'iterator';
		if (this.#arrayItems.length < 1000 && terminal === 'all') return 'eager';
		return 'compiled';
	}

	/** Ensure source is consumed and return array if available */
	protected ensureConsumed(): T[] | null {
		if (this.#source !== null) {
			const source = this.#source;
			this.#source = null;
			this.#arrayItems = [...this._iterateSource(source)];
			this._lazyItems = true;
		}
		return this.#arrayItems;
	}

	/** Invalidate cached array items (after mutation) */
	protected invalidateArrayItems(): void {
		void this.items;
		this.#arrayItems = null;
	}

	/** Get next numeric key for push operations */
	protected getNextNumericKey(): number {
		if (this._nextNumericKey === null) {
			const numericKeys = Object.keys(this.items)
				.map(Number)
				.filter((n) => !Number.isNaN(n));
			this._nextNumericKey = numericKeys.length > 0 ? Math.max(...numericKeys) + 1 : 0;
		}
		return this._nextNumericKey;
	}

	/** Invalidate next numeric key cache */
	protected invalidateNextNumericKey(): void {
		this._nextNumericKey = null;
	}

	// === Terminal Methods (always available) ===

	/**
	 * Return the underlying array or object represented by the collection.
	 */
	all(): CK extends 'array' ? T[] : Record<string, T> {
		if (this.#ops.length > 0 && this.#arrayItems) {
			const result = this._execute();
			return result as CK extends 'array' ? T[] : Record<string, T>;
		}
		const arr = this.ensureConsumed();
		if (arr) {
			return [...arr] as CK extends 'array' ? T[] : Record<string, T>;
		}
		return (this._isAssociative ? { ...this.items } : Object.values(this.items)) as CK extends 'array'
			? T[]
			: Record<string, T>;
	}

	/**
	 * Return the collection as a plain array.
	 */
	toArray(): T[] {
		if (this.#ops.length > 0 && this.#arrayItems) {
			return this._execute();
		}
		const arr = this.ensureConsumed();
		if (arr) {
			return [...arr];
		}
		return Object.values(this.items);
	}

	/**
	 * Return the total number of items in the collection.
	 */
	count(): number {
		if (this.#ops.length > 0 && this.#arrayItems) {
			return this._execute().length;
		}
		const arr = this.ensureConsumed();
		if (arr) {
			return arr.length;
		}
		return Object.keys(this.items).length;
	}

	/**
	 * Determine if the collection is empty.
	 */
	isEmpty(): boolean {
		return this.count() === 0;
	}

	/**
	 * Determine if the collection is not empty.
	 */
	isNotEmpty(): boolean {
		return this.count() > 0;
	}

	/**
	 * Make the collection iterable.
	 */
	*[Symbol.iterator](): Iterator<T> {
		if (this.#ops.length > 0 && this.#arrayItems) {
			yield* this._execute();
			return;
		}
		const arr = this.ensureConsumed();
		if (arr) {
			yield* arr;
		} else {
			yield* Object.values(this.items);
		}
	}

	/**
	 * Convert to JSON string.
	 */
	toJson(spaces?: number): string {
		return JSON.stringify(this.all(), null, spaces);
	}
}

export { collectionMacros };
