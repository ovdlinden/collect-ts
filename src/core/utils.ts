/**
 * Core utility functions for Collection operations.
 * These are internal helpers used by methods.
 */

import type { ValueRetriever, WhereOperator } from './types.js';

/**
 * Get a value from a nested object using dot notation.
 *
 * @param target - The object to retrieve from
 * @param key - Dot-notation key (e.g., 'user.address.city')
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * dataGet({ user: { name: 'Taylor' } }, 'user.name')
 * // → 'Taylor'
 */
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

/**
 * Check if a value is callable (a function).
 */
export function useAsCallable(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === 'function';
}

/**
 * Create a retriever function from a key string or callback.
 * Used for pluck, groupBy, sortBy, etc.
 *
 * @param keyOrCallback - A string key, dot-notation path, or callback
 * @returns A function that retrieves the value from an item
 */
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

/**
 * Create a where filter function from key/operator/value.
 * Supports Laravel's loose comparison operators.
 *
 * @param key - Property key or callback function
 * @param operator - Comparison operator (defaults to '=')
 * @param value - Value to compare against
 * @returns Predicate function for filtering
 */
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

/**
 * Convert a value to a group key string.
 * Used by groupBy to normalize keys consistently.
 *
 * @param value - The value to convert to a key
 * @returns String representation suitable for object keys
 */
export function toGroupKey(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value === true) return '1';
	if (value === false) return '0';
	if (value == null) return '';
	return String(value);
}
