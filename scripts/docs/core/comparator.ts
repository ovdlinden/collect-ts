/**
 * Baseline Comparator
 * Simple comparison of baseline file vs fetched content.
 * Pure functions - no I/O, no console output.
 */

import type { BaselineStatus } from './types.js';

/**
 * Check if baseline matches current content
 * Simple string comparison - git handles the heavy lifting
 */
export function compareBaseline(baseline: string | null, current: string): BaselineStatus & { content: string } {
	const upToDate = baseline !== null && baseline === current;
	return {
		exists: baseline !== null,
		upToDate,
		baselinePath: 'scripts/docs/baseline/laravel-collections.md',
		content: current,
	};
}
