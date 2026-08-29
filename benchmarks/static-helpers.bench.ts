/**
 * Static helpers vs Collection chaining
 *
 * Compares zero-allocation static helpers with the fluent Collection API.
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

const data10k = generate(10_000);
const data100k = generate(100_000);

describe('where @ 10K', () => {
	bench('native: items.filter(x => x.active)', () => {
		data10k.filter((x) => x.active);
	}, STABLE_BENCH);

	bench('collect.where(items, key, value)', () => {
		collect.where(data10k, 'active', true);
	}, STABLE_BENCH);

	bench('collect(items).where(key, value).all()', () => {
		collect(data10k).where('active', true).all();
	}, STABLE_BENCH);
});

describe('pluck @ 10K', () => {
	bench('native: items.map(x => x.value)', () => {
		data10k.map((x) => x.value);
	}, STABLE_BENCH);

	bench('collect.pluck(items, key)', () => {
		collect.pluck(data10k, 'value');
	}, STABLE_BENCH);

	bench('collect(items).pluck(key).all()', () => {
		collect(data10k).pluck('value').all();
	}, STABLE_BENCH);
});

describe('sum @ 10K', () => {
	bench('native: items.reduce((a,x) => a + x.value, 0)', () => {
		data10k.reduce((a, x) => a + x.value, 0);
	}, STABLE_BENCH);

	bench('collect.sum(items, x => x.value)', () => {
		collect.sum(data10k, (x) => x.value);
	}, STABLE_BENCH);

	bench('collect(items).sum("value")', () => {
		collect(data10k).sum('value');
	}, STABLE_BENCH);
});

describe('where @ 100K', () => {
	bench('native: items.filter(x => x.active)', () => {
		data100k.filter((x) => x.active);
	}, STABLE_BENCH);

	bench('collect.where(items, key, value)', () => {
		collect.where(data100k, 'active', true);
	}, STABLE_BENCH);

	bench('collect(items).where(key, value).all()', () => {
		collect(data100k).where('active', true).all();
	}, STABLE_BENCH);
});

describe('groupBy @ 10K', () => {
	bench('native: items.reduce((acc, x) => ...)', () => {
		data10k.reduce(
			(acc, x) => {
				const key = x.category;
				(acc[key] ??= []).push(x);
				return acc;
			},
			{} as Record<string, typeof data10k>,
		);
	}, STABLE_BENCH);

	bench('collect.groupBy(items, key)', () => {
		collect.groupBy(data10k, 'category');
	}, STABLE_BENCH);

	bench('collect(items).groupBy(key).all()', () => {
		collect(data10k).groupBy('category').all();
	}, STABLE_BENCH);
});

describe('unique @ 10K', () => {
	bench('native: [...new Set(items.map(x => x.category))]', () => {
		[...new Set(data10k.map((x) => x.category))];
	}, STABLE_BENCH);

	bench('collect.unique(items.map(x => x.category))', () => {
		collect.unique(data10k.map((x) => x.category));
	}, STABLE_BENCH);

	bench('collect(items).unique("category").all()', () => {
		collect(data10k).unique('category').all();
	}, STABLE_BENCH);
});
