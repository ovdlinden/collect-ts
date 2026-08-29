/**
 * collect-ts Performance Benchmarks
 *
 * Compares:
 * - Raw for loops (baseline — no abstraction overhead)
 * - Native Array methods (browser built-ins)
 * - Collection (eager, fluent API)
 * - LazyCollection (lazy evaluation)
 *
 * Shows both the overhead cost of abstractions AND where lazy evaluation wins.
 */
import { bench, describe } from 'vitest';
import { collect } from '../src/index.js';

// Dataset sizes — lazy benefits emerge at scale
const SIZES = {
	small: 100_000,
	large: 1_000_000,
} as const;

// Generate datasets once (not measured)
const createDataset = (size: number) =>
	Array.from({ length: size }, (_, i) => ({
		id: i,
		value: Math.random(),
		category: i % 10,
	}));

const small = createDataset(SIZES.small);
const large = createDataset(SIZES.large);

// =============================================================================
// Early Termination — take(N) from large dataset
// Lazy: stops after N items. Eager: processes entire array first.
// =============================================================================
describe('Early termination: take(10) from 1M items', () => {
	bench('Raw for loop', () => {
		const result: number[] = [];
		for (let i = 0; i < large.length && result.length < 10; i++) {
			const x = large[i];
			if (x.value > 0.5) {
				result.push(x.value * 2);
			}
		}
		return result;
	});

	bench('Native Array', () => {
		large
			.filter((x) => x.value > 0.5)
			.map((x) => x.value * 2)
			.slice(0, 10);
	});

	bench('Collection (eager)', () => {
		collect(large)
			.filter((x) => x.value > 0.5)
			.map((x) => x.value * 2)
			.take(10)
			.all();
	});

	bench('LazyCollection', () => {
		collect(large)
			.lazy()
			.filter((x) => x.value > 0.5)
			.map((x) => x.value * 2)
			.take(10)
			.all();
	});
});

// =============================================================================
// First match — find first item matching condition
// Lazy: stops at first match. Eager: filters entire array.
// =============================================================================
describe('First match: first() with condition on 1M items', () => {
	bench('Raw for loop', () => {
		for (let i = 0; i < large.length; i++) {
			if (large[i].id === 500) return large[i];
		}
		return undefined;
	});

	bench('Native Array.find', () => {
		large.find((x) => x.id === 500);
	});

	bench('Collection (eager)', () => {
		collect(large).first((x) => x.id === 500);
	});

	bench('LazyCollection', () => {
		collect(large).lazy().first((x) => x.id === 500);
	});
});

// =============================================================================
// Chained transformations — multiple map/filter operations
// Lazy: single pass. Eager: N intermediate arrays.
// =============================================================================
describe('Chained: filter → map → filter → map on 100K items', () => {
	bench('Raw for loop', () => {
		let sum = 0;
		for (let i = 0; i < small.length; i++) {
			const x = small[i];
			if (x.value > 0.2) {
				const doubled = x.value * 2;
				if (doubled > 1) {
					sum += doubled;
				}
			}
		}
		return sum;
	});

	bench('Native Array', () => {
		small
			.filter((x) => x.value > 0.2)
			.map((x) => ({ ...x, doubled: x.value * 2 }))
			.filter((x) => x.doubled > 1)
			.map((x) => x.doubled)
			.reduce((a, b) => a + b, 0);
	});

	bench('Collection (eager)', () => {
		collect(small)
			.filter((x) => x.value > 0.2)
			.map((x) => ({ ...x, doubled: x.value * 2 }))
			.filter((x) => x.doubled > 1)
			.map((x) => x.doubled)
			.sum();
	});

	bench('LazyCollection', () => {
		collect(small)
			.lazy()
			.filter((x) => x.value > 0.2)
			.map((x) => ({ ...x, doubled: x.value * 2 }))
			.filter((x) => x.doubled > 1)
			.map((x) => x.doubled)
			.sum();
	});
});

// =============================================================================
// Full processing — when you need all results (lazy has no advantage)
// Shows that lazy overhead is minimal even when it can't short-circuit.
// =============================================================================
describe('Full processing: map all 100K items (no early exit)', () => {
	bench('Raw for loop', () => {
		const result = new Array(small.length);
		for (let i = 0; i < small.length; i++) {
			result[i] = small[i].value * 2;
		}
		return result;
	});

	bench('Native Array.map', () => {
		small.map((x) => x.value * 2);
	});

	bench('Collection (eager)', () => {
		collect(small)
			.map((x) => x.value * 2)
			.all();
	});

	bench('LazyCollection', () => {
		collect(small)
			.lazy()
			.map((x) => x.value * 2)
			.all();
	});
});

// =============================================================================
// Range generation — lazy shines with generated sequences
// =============================================================================
describe('Range: sum of first 10 from range(1, 1_000_000)', () => {
	bench('Raw for loop', () => {
		let sum = 0;
		for (let i = 1; i <= 10; i++) {
			sum += i;
		}
		return sum;
	});

	bench('Native Array.from + slice', () => {
		Array.from({ length: 1_000_000 }, (_, i) => i + 1)
			.slice(0, 10)
			.reduce((a, b) => a + b, 0);
	});

	bench('Collection (eager)', () => {
		collect(Array.from({ length: 1_000_000 }, (_, i) => i + 1))
			.take(10)
			.sum();
	});

	bench('LazyCollection.range', () => {
		collect.lazy.range(1, 1_000_000).take(10).sum();
	});
});
