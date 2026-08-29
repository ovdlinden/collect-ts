/**
 * collect-ts vs Native JavaScript
 *
 * Compares the actual APIs a developer would use:
 * - Native: items.reduce(), items.filter(), items.map()
 * - collect-ts: collect(items).sum(), collect(items).where(), etc.
 */

import { bench, describe } from 'vitest';
import { collect } from '../src/index.js';
import { STABLE_BENCH } from './bench-options.js';

const generate = (n: number) =>
	Array.from({ length: n }, (_, i) => ({
		id: i,
		value: Math.random() * 100,
		category: `cat-${i % 50}`,
		active: i % 3 !== 0,
	}));

const datasets = {
	'10K': generate(10_000),
	'100K': generate(100_000),
	'1M': generate(1_000_000),
} as const;

type Size = keyof typeof datasets;
const sizes: Size[] = ['10K', '100K', '1M'];

for (const size of sizes) {
	const data = datasets[size];
	const midId = data.length / 2;

	describe(`sum @ ${size}`, () => {
		bench('native: items.reduce((a,x) => a + x.value, 0)', () => {
			data.reduce((a, x) => a + x.value, 0);
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).sum("value")', () => {
			collect(data).sum('value');
		}, STABLE_BENCH);
	});

	describe(`avg @ ${size}`, () => {
		bench('native: items.reduce() / items.length', () => {
			data.reduce((a, x) => a + x.value, 0) / data.length;
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).avg("value")', () => {
			collect(data).avg('value');
		}, STABLE_BENCH);
	});

	describe(`filter @ ${size}`, () => {
		bench('native: items.filter(x => x.active)', () => {
			data.filter((x) => x.active);
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).where("active", true)', () => {
			collect(data).where('active', true).all();
		}, STABLE_BENCH);
	});

	describe(`pluck @ ${size}`, () => {
		bench('native: items.map(x => x.value)', () => {
			data.map((x) => x.value);
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).pluck("value")', () => {
			collect(data).pluck('value').all();
		}, STABLE_BENCH);
	});

	describe(`unique @ ${size}`, () => {
		bench('native: [...new Set(items.map(x => x.category))]', () => {
			[...new Set(data.map((x) => x.category))];
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).unique("category")', () => {
			collect(data).unique('category').all();
		}, STABLE_BENCH);
	});

	describe(`groupBy @ ${size}`, () => {
		bench('native: items.reduce((acc, x) => ...)', () => {
			data.reduce(
				(acc, x) => {
					// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic groupBy
					(acc[x.category] ??= []).push(x);
					return acc;
				},
				{} as Record<string, typeof data>,
			);
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).groupBy("category")', () => {
			collect(data).groupBy('category').all();
		}, STABLE_BENCH);
	});

	describe(`find @ ${size}`, () => {
		bench(`native: items.find(x => x.id === ${midId})`, () => {
			data.find((x) => x.id === midId);
		}, STABLE_BENCH);

		bench(`collect-ts: collect(items).firstWhere("id", ${midId})`, () => {
			collect(data).firstWhere('id', midId);
		}, STABLE_BENCH);
	});

	describe(`chained: filter → pluck → sum @ ${size}`, () => {
		bench('native: items.filter().map().reduce()', () => {
			data
				.filter((x) => x.active)
				.map((x) => x.value)
				.reduce((a, b) => a + b, 0);
		}, STABLE_BENCH);

		bench('collect-ts: collect(items).where().pluck().sum()', () => {
			collect(data).where('active', true).pluck('value').sum();
		}, STABLE_BENCH);
	});
}
