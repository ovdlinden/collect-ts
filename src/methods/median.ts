/**
 * median/mode methods - statistical operations.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';
import { dataGet } from '../core/utils.js';

/**
 * The `median` method returns the median value of a given key.
 * The median is the middle value when all values are sorted in order.
 * For collections with an even number of items, it returns the average of the two middle values.
 *
 * @param key - Property key to extract values from (optional for numeric arrays)
 * @returns The median value, or null if the collection is empty
 *
 * @example
 * collect([1, 3, 3, 6, 7, 8, 9])
 *     .median()
 * // → 6
 *
 * @example With even count (average of middle two):
 * collect([1, 2, 3, 4])
 *     .median()
 * // → 2.5
 *
 * @example With a key:
 * collect([
 *   { score: 80 },
 *   { score: 90 },
 *   { score: 85 },
 * ])
 *   .median('score')
 * // → 85
 *
 * @see {@link avg} - Get the mean (average)
 * @see {@link mode} - Get most frequent value
 *
 * @category Aggregating
 */
export const medianMethod: MethodDefinition<'median'> = {
	name: 'median',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: string): number | null {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) return null;

		const values: number[] = [];
		for (const item of items) {
			const value = key ? Number(dataGet(item, key)) : Number(item);
			if (!Number.isNaN(value)) {
				values.push(value);
			}
		}

		if (values.length === 0) return null;

		values.sort((a, b) => a - b);
		const mid = Math.floor(values.length / 2);

		if (values.length % 2 === 0) {
			return (values[mid - 1] + values[mid]) / 2;
		}

		return values[mid];
	},
};

/**
 * The `mode` method returns the mode value of a given key.
 * The mode is the value that appears most often. If multiple values appear
 * with the same frequency, all of them are returned.
 *
 * @param key - Property key to extract values from (optional for numeric arrays)
 * @returns Array of mode values, or null if the collection is empty
 *
 * @example
 * collect([1, 2, 2, 3, 3, 3, 4])
 *     .mode()
 * // → [3]
 *
 * @example Multiple modes:
 * collect([1, 1, 2, 2, 3])
 *     .mode()
 * // → [1, 2]
 *
 * @example With a key:
 * collect([
 *   { size: 'S' },
 *   { size: 'M' },
 *   { size: 'M' },
 *   { size: 'L' },
 * ])
 *   .mode('size')
 * // → ['M']
 *
 * @see {@link median} - Get the middle value
 * @see {@link avg} - Get the mean (average)
 *
 * @category Aggregating
 */
export const modeMethod: MethodDefinition<'mode'> = {
	name: 'mode',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, key?: string): unknown[] | null {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (items.length === 0) return null;

		const counts = new Map<unknown, number>();
		let maxCount = 0;

		for (const item of items) {
			const value = key ? dataGet(item, key) : item;
			const count = (counts.get(value) || 0) + 1;
			counts.set(value, count);
			if (count > maxCount) maxCount = count;
		}

		const modes: unknown[] = [];
		for (const [value, count] of counts) {
			if (count === maxCount) {
				modes.push(value);
			}
		}

		return modes;
	},
};

export default medianMethod;
