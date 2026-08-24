/**
 * Fast array utilities for Collection performance optimization.
 *
 * These helpers eliminate V8 callback overhead by using inline for-loops
 * with direct property access instead of native array methods with callbacks.
 *
 * @internal Not exported from index.ts
 */

import type { WhereOperator } from './Collection.js';

/**
 * Fast array filter by key with operator comparison.
 */
export function arrayFilterByKey<T, K extends keyof T>(
	items: readonly T[],
	key: K,
	value: unknown,
	operator: WhereOperator | '===' = '==',
): T[] {
	const result: T[] = [];
	const len = items.length;

	for (let i = 0; i < len; i++) {
		const item = items[i];
		const itemValue = item[key];
		let matches = false;

		switch (operator) {
			case '===':
				matches = itemValue === value;
				break;
			case '!=':
			case '<>':
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				matches = itemValue != value;
				break;
			case '>':
				matches = (itemValue as number) > (value as number);
				break;
			case '<':
				matches = (itemValue as number) < (value as number);
				break;
			case '>=':
				matches = (itemValue as number) >= (value as number);
				break;
			case '<=':
				matches = (itemValue as number) <= (value as number);
				break;
			default:
				// '=', '==', or unknown operators default to loose equality
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				matches = itemValue == value;
				break;
		}

		if (matches) result.push(item);
	}

	return result;
}

/**
 * Fast array filter by Set membership.
 */
export function arrayFilterBySet<T>(items: readonly T[], set: Set<unknown>, include: boolean): T[] {
	const result: T[] = [];
	const len = items.length;

	for (let i = 0; i < len; i++) {
		const item = items[i];
		if (set.has(item) === include) {
			result.push(item);
		}
	}

	return result;
}

/**
 * Fast array map by key (pluck pattern).
 */
export function arrayMapByKey<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
	const len = items.length;
	const result: T[K][] = new Array(len);

	for (let i = 0; i < len; i++) {
		result[i] = items[i][key];
	}

	return result;
}

/**
 * Fast array find by key with operator comparison.
 */
export function arrayFindByKey<T, K extends keyof T>(
	items: readonly T[],
	key: K,
	value: unknown,
	operator: WhereOperator | '===' = '==',
): T | undefined {
	const len = items.length;

	for (let i = 0; i < len; i++) {
		const item = items[i];
		const itemValue = item[key];
		let matches = false;

		switch (operator) {
			case '===':
				matches = itemValue === value;
				break;
			case '!=':
			case '<>':
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				matches = itemValue != value;
				break;
			case '>':
				matches = (itemValue as number) > (value as number);
				break;
			case '<':
				matches = (itemValue as number) < (value as number);
				break;
			case '>=':
				matches = (itemValue as number) >= (value as number);
				break;
			case '<=':
				matches = (itemValue as number) <= (value as number);
				break;
			default:
				// '=', '==', or unknown operators default to loose equality
				// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
				matches = itemValue == value;
				break;
		}

		if (matches) return item;
	}

	return undefined;
}

/**
 * Fast array contains check (loose equality).
 */
export function arrayContains<T>(items: readonly T[], value: unknown): boolean {
	const len = items.length;

	for (let i = 0; i < len; i++) {
		// biome-ignore lint/suspicious/noDoubleEquals: loose comparison by design
		if (items[i] == value) return true;
	}

	return false;
}

/**
 * Fast array groupBy with direct key access.
 * Returns a Map with pre-allocated arrays for each group.
 */
export function arrayGroupByKey<T, K extends keyof T>(items: readonly T[], key: K): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	const len = items.length;

	for (let i = 0; i < len; i++) {
		const item = items[i];
		let groupKey = item[key] as unknown;

		if (typeof groupKey === 'boolean') {
			groupKey = groupKey ? '1' : '0';
		} else if (groupKey === null || groupKey === undefined) {
			groupKey = '';
		} else {
			groupKey = String(groupKey);
		}

		let group = groups.get(groupKey as string);
		if (!group) {
			group = [];
			groups.set(groupKey as string, group);
		}
		group.push(item);
	}

	return groups;
}
