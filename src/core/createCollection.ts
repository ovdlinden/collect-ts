/**
 * Factory for creating tree-shakeable Collection instances.
 * Only the methods you pass are included in the bundle.
 *
 * @example
 * import { createCollection } from 'collect-ts/core';
 * import { filter, map, groupBy } from 'collect-ts/fn';
 *
 * const collect = createCollection([filter, map, groupBy]);
 * collect(users).filter(u => u.active).map(u => u.name);
 */

import { CoreCollection } from './Collection.js';
import type { CollectInput, CollectionKind } from './types.js';

/**
 * Method definition for attachment to Collection.
 * Each method module exports one of these.
 */
export interface MethodDefinition<Name extends string = string> {
	/** Method name (used as property key) */
	name: Name;
	/** Whether the method returns a Collection (chainable) or a value (terminal) */
	chainable: boolean;
	/** The method implementation, bound to Collection instance */
	// biome-ignore lint/suspicious/noExplicitAny: method implementations need generic flexibility
	fn: (this: CoreCollection<any, CollectionKind>, ...args: any[]) => any;
}

/**
 * Extract method names from an array of method definitions.
 */
type MethodNames<M extends readonly MethodDefinition[]> = M[number]['name'];

/**
 * Type helper to build Collection type with specific methods.
 * This enables autocomplete for only the methods you import.
 */
type CollectionWithMethods<T, CK extends CollectionKind, M extends readonly MethodDefinition[]> = CoreCollection<
	T,
	CK
> & {
	[K in MethodNames<M>]: M[number] extends { name: K; fn: infer F }
		? F extends (this: CoreCollection<unknown, CollectionKind>, ...args: infer A) => infer R
			? (
					...args: A
				) => R extends CoreCollection<unknown, CollectionKind> ? CollectionWithMethods<T, CK, M> : R
			: never
		: never;
};

/**
 * Create a collect function with only the specified methods.
 * Enables tree-shaking by importing only what you use.
 *
 * @param methods - Array of method definitions to include
 * @returns A collect function that creates Collections with those methods
 *
 * @example Basic usage
 * import { createCollection } from 'collect-ts/core';
 * import filterMethod from 'collect-ts/methods/filter';
 * import mapMethod from 'collect-ts/methods/map';
 *
 * const collect = createCollection([filterMethod, mapMethod]);
 * const result = collect([1, 2, 3]).filter(x => x > 1).map(x => x * 2);
 *
 * @example With SWC plugin (automatic transformation)
 * // This code:
 * import { collect } from 'collect-ts';
 * collect(users).filter().map();
 *
 * // Transforms to:
 * import { createCollection } from 'collect-ts/core';
 * import filterMethod from 'collect-ts/methods/filter';
 * import mapMethod from 'collect-ts/methods/map';
 * const collect = createCollection([filterMethod, mapMethod]);
 * collect(users).filter().map();
 */
export function createCollection<M extends readonly MethodDefinition[]>(
	methods: M,
): <T, CK extends CollectionKind = 'array'>(
	items?: CollectInput<T> | CoreCollection<T, CollectionKind>,
	isAssociative?: boolean,
) => CollectionWithMethods<T, CK, M> {
	// Build a prototype with only the specified methods
	const proto = Object.create(CoreCollection.prototype);

	for (const method of methods) {
		proto[method.name] = method.fn;
	}

	// Override newInstance to preserve the custom prototype
	proto.newInstance = function newInstance<U>(
		this: CoreCollection<unknown, CollectionKind>,
		items: U[] | Record<string, U>,
		isAssociative?: boolean,
	): CoreCollection<U, CollectionKind> {
		const instance = new CoreCollection<U, CollectionKind>(items, isAssociative ?? this.isAssociative);
		Object.setPrototypeOf(instance, proto);
		return instance;
	};

	// Return a collect function that uses the enhanced prototype
	return function collect<T, CK extends CollectionKind = 'array'>(
		items?: CollectInput<T> | CoreCollection<T, CollectionKind>,
		isAssociative?: boolean,
	): CollectionWithMethods<T, CK, M> {
		const instance = new CoreCollection<T, CK>(items, isAssociative);
		Object.setPrototypeOf(instance, proto);
		return instance as CollectionWithMethods<T, CK, M>;
	};
}

/**
 * Extend an existing Collection class with additional methods.
 * Useful for adding methods at runtime without tree-shaking.
 *
 * @param methods - Array of method definitions to add
 */
export function extendCollection(methods: readonly MethodDefinition[]): void {
	for (const method of methods) {
		// biome-ignore lint/suspicious/noExplicitAny: dynamic method attachment
		(CoreCollection.prototype as any)[method.name] = method.fn;
	}
}
