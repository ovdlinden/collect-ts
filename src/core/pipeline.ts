/**
 * Pipeline execution system for deferred operations.
 * Enables lazy evaluation and optimized execution paths.
 */

import { arrayFilterByKey, arrayFilterBySetKey, arrayMapByKey } from '../arrayUtils.js';
import type { WhereOperator } from './types.js';

/** @internal Execution mode for deferred pipeline */
export type ExecutionMode = 'compiled' | 'iterator' | 'eager';

/** @internal Deferred operation descriptor with compilability flag */
export type Operation =
	// Key-based filter (compilable to for-loop condition)
	| { type: 'filter'; key: string; value: unknown; operator: string; compilable: true }
	// Callback-based filter (requires iterator)
	| { type: 'filterCallback'; callback: (item: unknown, index: number) => boolean; compilable: false }
	// Set-based filter (compilable with Set.has)
	| { type: 'filterSet'; key: string; values: Set<unknown>; include: boolean; compilable: true }
	// Key-based map/pluck (compilable)
	| { type: 'map'; key: string; compilable: true }
	// Callback-based map (requires iterator)
	| { type: 'mapCallback'; callback: (item: unknown, index: number) => unknown; compilable: false }
	// Take first n items (compilable with early break)
	| { type: 'take'; n: number; compilable: true }
	// Skip first n items (compilable with counter)
	| { type: 'skip'; n: number; compilable: true }
	// Key-based sort (materializing - flushes pipeline)
	| { type: 'sort'; key: string; descending: boolean; compilable: true }
	// Complex operations (always iterator)
	| { type: 'complex'; name: string; args: unknown[]; compilable: false };

/**
 * Run pipeline operations sequentially on a source array.
 * This is the eager execution path.
 *
 * @param ops - Array of operations to apply
 * @param source - Source array to process
 * @param limit - Optional limit on result count
 * @returns Processed array
 */
export function runPipeline<T>(ops: Operation[], source: T[], limit?: number): T[] {
	let result: unknown[] = source;

	for (const op of ops) {
		switch (op.type) {
			case 'filter':
				result = arrayFilterByKey(result as T[], op.key as keyof T, op.value, op.operator as WhereOperator | '===');
				break;
			case 'filterCallback':
				result = result.filter((item, i) => op.callback(item, i));
				break;
			case 'map':
				result = arrayMapByKey(result as T[], op.key as keyof T);
				break;
			case 'mapCallback':
				result = result.map((item, i) => op.callback(item, i));
				break;
			case 'filterSet':
				result = arrayFilterBySetKey(result as T[], op.key as keyof T, op.values, op.include);
				break;
			case 'take':
				if (result.length > op.n) result = result.slice(0, op.n);
				break;
			case 'skip':
				if (op.n > 0) result = result.slice(op.n);
				break;
			case 'sort': {
				const k = op.key as keyof T;
				const desc = op.descending;
				result = [...result].sort((a, b) => {
					const av = (a as T)[k];
					const bv = (b as T)[k];
					const cmp = av < bv ? -1 : av > bv ? 1 : 0;
					return desc ? -cmp : cmp;
				});
				break;
			}
		}
	}

	if (limit !== undefined && result.length > limit) {
		result = result.slice(0, limit);
	}

	return result as T[];
}

/**
 * Check if all operations are compilable (key-based).
 */
export function allOpsCompilable(ops: Operation[]): boolean {
	return ops.every((op) => op.compilable);
}

/**
 * Choose optimal execution mode based on source and operations.
 *
 * @param hasArraySource - Whether source is an array (not iterator)
 * @param ops - Pending operations
 * @param terminal - Terminal operation name
 * @param sourceLength - Length of source array (if known)
 * @returns Optimal execution mode
 */
export function chooseExecutionMode(
	hasArraySource: boolean,
	ops: Operation[],
	terminal: string,
	sourceLength?: number,
): ExecutionMode {
	// Must use iterator for non-array sources
	if (!hasArraySource) return 'iterator';

	// No ops? Direct access (eager)
	if (ops.length === 0) return 'eager';

	// Any non-compilable op? Use iterator
	if (!allOpsCompilable(ops)) return 'iterator';

	// All ops are compilable (key-based)
	// Small source + full terminal? Eager is acceptable
	if (sourceLength !== undefined && sourceLength < 1000 && terminal === 'all') return 'eager';

	// Compiled loop for key-based ops (fastest path)
	return 'compiled';
}
