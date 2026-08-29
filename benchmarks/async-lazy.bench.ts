/**
 * Async LazyCollection Benchmarks
 *
 * Shows where async lazy evaluation wins:
 * - Paginated API streams with early termination
 * - Async generators that can short-circuit
 */
import { bench, describe } from 'vitest';
import { collect } from '../src/index.js';

async function* paginatedAPI(pages: number, pageSize: number) {
	for (let page = 0; page < pages; page++) {
		const items = Array.from({ length: pageSize }, (_, i) => ({
			id: page * pageSize + i,
			value: Math.random(),
		}));
		yield* items;
	}
}

async function* asyncNumbers(count: number) {
	for (let i = 0; i < count; i++) {
		yield i;
	}
}

describe('Async early termination: take(10) from paginated stream', () => {
	bench('collect.async + take', async () => {
		await collect
			.async(paginatedAPI(100, 1000))
			.filter((x) => x.value > 0.5)
			.take(10)
			.all();
	});

	bench('manual async iteration', async () => {
		const result: { id: number; value: number }[] = [];
		for await (const item of paginatedAPI(100, 1000)) {
			if (item.value > 0.5) {
				result.push(item);
				if (result.length >= 10) break;
			}
		}
		return result;
	});
});

describe('Async first match: first() on async generator', () => {
	bench('collect.async + first', async () => {
		await collect
			.async(asyncNumbers(100_000))
			.filter((x) => x > 500)
			.first();
	});

	bench('manual async iteration', async () => {
		for await (const x of asyncNumbers(100_000)) {
			if (x > 500) return x;
		}
		return undefined;
	});
});

describe('Async chained: filter → map → take on async stream', () => {
	bench('collect.async', async () => {
		await collect
			.async(asyncNumbers(10_000))
			.filter((x) => x % 2 === 0)
			.map((x) => x * 2)
			.take(100)
			.all();
	});

	bench('manual async iteration', async () => {
		const result: number[] = [];
		for await (const x of asyncNumbers(10_000)) {
			if (x % 2 === 0) {
				result.push(x * 2);
				if (result.length >= 100) break;
			}
		}
		return result;
	});
});

describe('Async range: collect.async.range vs manual', () => {
	bench('collect.async.range', async () => {
		await collect.async.range(1, 1_000_000).take(10).sum();
	});

	bench('manual async range', async () => {
		let sum = 0;
		let count = 0;
		for (let i = 1; i <= 1_000_000 && count < 10; i++) {
			sum += i;
			count++;
		}
		return sum;
	});
});
