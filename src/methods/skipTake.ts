/**
 * skipUntil/skipWhile/takeUntil/takeWhile methods - conditional iteration.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

function useAsCallable<T>(value: unknown): value is (value: T, key: string) => boolean {
	return typeof value === 'function';
}

/**
 * The `skipUntil` method skips items until the given callback returns true,
 * then returns the remaining items.
 *
 * @param value - Value to match or callback returning true to stop skipping
 * @returns New collection starting from the matched item
 *
 * @example
 * collect([1, 2, 3, 4])
 *     .skipUntil(3)
 *     .all()
 * // → [3, 4]
 *
 * @example With callback:
 * collect([1, 2, 3, 4])
 *     .skipUntil(item => item >= 3)
 *     .all()
 * // → [3, 4]
 *
 * @see {@link skipWhile} - Skip while condition is true
 * @see {@link takeUntil} - Take until condition
 * @see {@link skip} - Skip fixed number
 *
 * @category Filtering
 */
export const skipUntilMethod: MethodDefinition<'skipUntil'> = {
	name: 'skipUntil',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((value: T, key: string) => boolean),
	): CoreCollection<T, CK> {
		const callback = useAsCallable<T>(value) ? value : (v: T) => v === value;
		const arr = this.getArrayItems();

		if (arr !== null) {
			let startIdx = arr.length;
			for (let i = 0; i < arr.length; i++) {
				if (callback(arr[i], String(i))) {
					startIdx = i;
					break;
				}
			}
			return this.newInstance(arr.slice(startIdx)) as CoreCollection<T, CK>;
		}

		let skipping = true;
		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.getItems())) {
			if (skipping && callback(item, key)) {
				skipping = false;
			}
			if (!skipping) {
				result[key] = item;
			}
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `skipWhile` method skips items while the given callback returns true,
 * then returns the remaining items.
 *
 * @param value - Value to match or callback returning true to continue skipping
 * @returns New collection starting after skipped items
 *
 * @example
 * collect([1, 2, 3, 4])
 *     .skipWhile(item => item < 3)
 *     .all()
 * // → [3, 4]
 *
 * @see {@link skipUntil} - Skip until condition is true
 * @see {@link takeWhile} - Take while condition
 * @see {@link skip} - Skip fixed number
 *
 * @category Filtering
 */
export const skipWhileMethod: MethodDefinition<'skipWhile'> = {
	name: 'skipWhile',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((value: T, key: string) => boolean),
	): CoreCollection<T, CK> {
		const callback = useAsCallable<T>(value) ? value : (v: T) => v === value;
		const arr = this.getArrayItems();

		if (arr !== null) {
			let startIdx = arr.length;
			for (let i = 0; i < arr.length; i++) {
				if (!callback(arr[i], String(i))) {
					startIdx = i;
					break;
				}
			}
			return this.newInstance(arr.slice(startIdx)) as CoreCollection<T, CK>;
		}

		let skipping = true;
		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.getItems())) {
			if (skipping && !callback(item, key)) {
				skipping = false;
			}
			if (!skipping) {
				result[key] = item;
			}
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `takeUntil` method returns items until the given callback returns true.
 *
 * @param value - Value to match or callback returning true to stop taking
 * @returns New collection of items before the match
 *
 * @example
 * collect([1, 2, 3, 4])
 *     .takeUntil(3)
 *     .all()
 * // → [1, 2]
 *
 * @example With callback:
 * collect([1, 2, 3, 4])
 *     .takeUntil(item => item >= 3)
 *     .all()
 * // → [1, 2]
 *
 * @see {@link takeWhile} - Take while condition is true
 * @see {@link skipUntil} - Skip until condition
 * @see {@link take} - Take fixed number
 *
 * @category Filtering
 */
export const takeUntilMethod: MethodDefinition<'takeUntil'> = {
	name: 'takeUntil',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((value: T, key: string) => boolean),
	): CoreCollection<T, CK> {
		const callback = useAsCallable<T>(value) ? value : (v: T) => v === value;
		const arr = this.getArrayItems();

		if (arr !== null) {
			const result: T[] = [];
			for (let i = 0; i < arr.length; i++) {
				if (callback(arr[i], String(i))) break;
				result.push(arr[i]);
			}
			return this.newInstance(result) as CoreCollection<T, CK>;
		}

		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.getItems())) {
			if (callback(item, key)) break;
			result[key] = item;
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

/**
 * The `takeWhile` method returns items while the given callback returns true.
 * Once the callback returns false, it stops.
 *
 * @param value - Value to match or callback returning true to continue taking
 * @returns New collection of items while condition was true
 *
 * @example
 * collect([1, 2, 3, 4])
 *     .takeWhile(item => item < 3)
 *     .all()
 * // → [1, 2]
 *
 * @see {@link takeUntil} - Take until condition is true
 * @see {@link skipWhile} - Skip while condition
 * @see {@link take} - Take fixed number
 *
 * @category Filtering
 */
export const takeWhileMethod: MethodDefinition<'takeWhile'> = {
	name: 'takeWhile',
	chainable: true,
	fn<T, CK extends CollectionKind>(
		this: CoreCollection<T, CK>,
		value: T | ((value: T, key: string) => boolean),
	): CoreCollection<T, CK> {
		const callback = useAsCallable<T>(value) ? value : (v: T) => v === value;
		const arr = this.getArrayItems();

		if (arr !== null) {
			const result: T[] = [];
			for (let i = 0; i < arr.length; i++) {
				if (!callback(arr[i], String(i))) break;
				result.push(arr[i]);
			}
			return this.newInstance(result) as CoreCollection<T, CK>;
		}

		const result: Record<string, T> = {};
		for (const [key, item] of Object.entries(this.getItems())) {
			if (!callback(item, key)) break;
			result[key] = item;
		}
		return this.newInstance(result, true) as CoreCollection<T, CK>;
	},
};

export default skipUntilMethod;
