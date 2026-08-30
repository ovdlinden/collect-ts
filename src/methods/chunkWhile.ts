/**
 * chunkWhile/collapseWithKeys methods - advanced chunking.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `chunkWhile` method breaks the collection into multiple, smaller collections
 * based on the evaluation of the given callback.
 *
 * @param callback - Function that returns true to continue the current chunk
 * @returns Collection of collections
 *
 * @example Group consecutive ascending numbers:
 * collect([1, 2, 3, 5, 6, 10])
 *     .chunkWhile((value, key, chunk) =>
 *         chunk.last() === value - 1
 *     )
 *     .toArray()
 * // → [[1, 2, 3], [5, 6], [10]]
 *
 * @example Group by first letter:
 * collect(['apple', 'apricot', 'banana', 'berry'])
 *     .chunkWhile((value, key, chunk) =>
 *         chunk.first()?.[0] === value[0]
 *     )
 *     .toArray()
 * // → [['apple', 'apricot'], ['banana', 'berry']]
 *
 * @see {@link chunk} - Fixed-size chunks
 * @see {@link groupBy} - Group by key/callback
 *
 * @category Grouping
 */
export const chunkWhileMethod: MethodDefinition<'chunkWhile'> = {
	name: 'chunkWhile',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		callback: (value: T, key: string, chunk: CoreCollection<T, CK>) => boolean,
	): CoreCollection<CoreCollection<T, CK>, 'array'> {
		const items = this.getItems();
		const entries = Object.entries(items);

		if (entries.length === 0) {
			return this.newInstance([]) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
		}

		const chunks: CoreCollection<T, CK>[] = [];
		let currentChunk: Record<string, T> = {};

		for (const [key, value] of entries) {
			const currentCollection = this.newInstance(currentChunk, true) as CoreCollection<T, CK>;
			const chunkIsEmpty = Object.keys(currentChunk).length === 0;

			if (chunkIsEmpty || callback(value, key, currentCollection)) {
				currentChunk[key] = value;
			} else {
				chunks.push(this.newInstance(currentChunk, true) as CoreCollection<T, CK>);
				currentChunk = { [key]: value };
			}
		}

		chunks.push(this.newInstance(currentChunk, true) as CoreCollection<T, CK>);
		return this.newInstance(chunks) as unknown as CoreCollection<CoreCollection<T, CK>, 'array'>;
	},
};

/**
 * The `collapseWithKeys` method collapses a collection of arrays into a single, flat
 * collection while preserving the original keys.
 *
 * @returns Flattened collection with preserved keys
 *
 * @example
 * collect({
 *   a: { x: 1 },
 *   b: { y: 2 },
 * })
 *   .collapseWithKeys()
 *   .all()
 * // → { x: 1, y: 2 }
 *
 * @see {@link collapse} - Collapse without preserving keys
 * @see {@link flatten} - Flatten nested structures
 *
 * @category Transforming
 */
export const collapseWithKeysMethod: MethodDefinition<'collapseWithKeys'> = {
	name: 'collapseWithKeys',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): CoreCollection<unknown, 'assoc'> {
		const items = this.getItems();
		const result: Record<string, unknown> = {};

		for (const value of Object.values(items)) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				Object.assign(result, value);
			}
		}

		return this.newInstance(result, true) as unknown as CoreCollection<unknown, 'assoc'>;
	},
};

export default chunkWhileMethod;
