/**
 * collect-ts Performance Benchmarks
 *
 * Compares:
 * - Raw for loops (baseline — no abstraction overhead)
 * - Native Array methods (browser built-ins)
 * - Native Generator pipelines (hand-rolled function* chains)
 * - Collection (eager, fluent API)
 * - LazyCollection (lazy evaluation)
 *
 * Shows both the overhead cost of abstractions AND where lazy evaluation wins.
 * The Native Generator comparison answers: "What's the overhead vs hand-rolling my own?"
 */
import { bench, describe } from 'vitest';
import { collect } from '../src/index.js';
import { STABLE_BENCH } from './bench-options.js';

// =============================================================================
// Native Generator Utilities — fair comparison against LazyCollection
// These are the hand-rolled equivalents developers might write themselves.
// =============================================================================

function* nativeGeneratorFilter<T>(source: Iterable<T>, predicate: (item: T) => boolean): Generator<T> {
	for (const item of source) {
		if (predicate(item)) yield item;
	}
}

function* nativeGeneratorMap<T, U>(source: Iterable<T>, transform: (item: T) => U): Generator<U> {
	for (const item of source) {
		yield transform(item);
	}
}

function* nativeGeneratorTake<T>(source: Iterable<T>, limit: number): Generator<T> {
	let count = 0;
	for (const item of source) {
		if (count++ >= limit) return;
		yield item;
	}
}

function* nativeGeneratorRange(start: number, end: number): Generator<number> {
	for (let i = start; i <= end; i++) {
		yield i;
	}
}

function nativeGeneratorFirst<T>(source: Iterable<T>, predicate: (item: T) => boolean): T | undefined {
	for (const item of source) {
		if (predicate(item)) return item;
	}
	return undefined;
}

function nativeGeneratorSum(source: Iterable<number>): number {
	let sum = 0;
	for (const value of source) {
		sum += value;
	}
	return sum;
}

function nativeGeneratorToArray<T>(source: Iterable<T>): T[] {
	return [...source];
}

// =============================================================================

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
	}, STABLE_BENCH);

	bench('Native Array', () => {
		large
			.filter((x) => x.value > 0.5)
			.map((x) => x.value * 2)
			.slice(0, 10);
	}, STABLE_BENCH);

	bench('Native Generator', () => {
		const filtered = nativeGeneratorFilter(large, (x) => x.value > 0.5);
		const mapped = nativeGeneratorMap(filtered, (x) => x.value * 2);
		const taken = nativeGeneratorTake(mapped, 10);
		return nativeGeneratorToArray(taken);
	}, STABLE_BENCH);

	bench('Collection (eager)', () => {
		collect(large)
			.filter((x) => x.value > 0.5)
			.map((x) => x.value * 2)
			.take(10)
			.all();
	}, STABLE_BENCH);

	bench('LazyCollection', () => {
		collect(large)
			.lazy()
			.filter((x) => x.value > 0.5)
			.map((x) => x.value * 2)
			.take(10)
			.all();
	}, STABLE_BENCH);
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
	}, STABLE_BENCH);

	bench('Native Array.find', () => {
		large.find((x) => x.id === 500);
	}, STABLE_BENCH);

	bench('Native Generator', () => {
		return nativeGeneratorFirst(large, (x) => x.id === 500);
	}, STABLE_BENCH);

	bench('Collection (eager)', () => {
		collect(large).first((x) => x.id === 500);
	}, STABLE_BENCH);

	bench('LazyCollection', () => {
		collect(large).lazy().first((x) => x.id === 500);
	}, STABLE_BENCH);

	bench('Collection.lazyFirst', () => {
		collect(large).lazyFirst((x) => x.id === 500);
	}, STABLE_BENCH);

	bench('collect.first (static)', () => {
		collect.first(large, (x) => x.id === 500);
	}, STABLE_BENCH);
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
	}, STABLE_BENCH);

	bench('Native Array', () => {
		small
			.filter((x) => x.value > 0.2)
			.map((x) => x.value * 2)
			.filter((x) => x > 1)
			.reduce((a, b) => a + b, 0);
	}, STABLE_BENCH);

	bench('Native Generator', () => {
		const step1 = nativeGeneratorFilter(small, (x) => x.value > 0.2);
		const step2 = nativeGeneratorMap(step1, (x) => x.value * 2);
		const step3 = nativeGeneratorFilter(step2, (x) => x > 1);
		return nativeGeneratorSum(step3);
	}, STABLE_BENCH);

	bench('Collection (eager)', () => {
		collect(small)
			.filter((x) => x.value > 0.2)
			.map((x) => x.value * 2)
			.filter((x) => x > 1)
			.sum();
	}, STABLE_BENCH);

	bench('LazyCollection', () => {
		collect(small)
			.lazy()
			.filter((x) => x.value > 0.2)
			.map((x) => x.value * 2)
			.filter((x) => x > 1)
			.sum();
	}, STABLE_BENCH);
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
	}, STABLE_BENCH);

	bench('Native Array.map', () => {
		small.map((x) => x.value * 2);
	}, STABLE_BENCH);

	bench('Native Generator', () => {
		const mapped = nativeGeneratorMap(small, (x) => x.value * 2);
		return nativeGeneratorToArray(mapped);
	}, STABLE_BENCH);

	bench('Collection (eager)', () => {
		collect(small)
			.map((x) => x.value * 2)
			.all();
	}, STABLE_BENCH);

	bench('LazyCollection', () => {
		collect(small)
			.lazy()
			.map((x) => x.value * 2)
			.all();
	}, STABLE_BENCH);

	bench('collect.map (static)', () => {
		collect.map(small, (x) => x.value * 2);
	}, STABLE_BENCH);
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
	}, STABLE_BENCH);

	bench('Native Array.from + slice', () => {
		Array.from({ length: 1_000_000 }, (_, i) => i + 1)
			.slice(0, 10)
			.reduce((a, b) => a + b, 0);
	}, STABLE_BENCH);

	bench('Native Generator', () => {
		const range = nativeGeneratorRange(1, 1_000_000);
		const taken = nativeGeneratorTake(range, 10);
		return nativeGeneratorSum(taken);
	}, STABLE_BENCH);

	bench('Collection (eager)', () => {
		collect(Array.from({ length: 1_000_000 }, (_, i) => i + 1))
			.take(10)
			.sum();
	}, STABLE_BENCH);

	bench('LazyCollection.range', () => {
		collect.lazy.range(1, 1_000_000).take(10).sum();
	}, STABLE_BENCH);
});
