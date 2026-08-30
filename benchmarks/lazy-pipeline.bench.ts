/**
 * Benchmarks for lazy pipeline execution.
 *
 * Measures the performance of deferred operations vs eager execution.
 */
import { bench, describe } from 'vitest';
import { collect } from '../src';
import { STABLE_BENCH } from './bench-options';

const items = Array.from({ length: 100_000 }, (_, i) => ({
	id: i,
	status: i % 3 === 0 ? 'active' : 'inactive',
	type: ['A', 'B', 'C'][i % 3],
	value: Math.random() * 100,
}));

describe('Pipeline vs Native (100K items)', () => {
	bench(
		'native: filter',
		() => {
			items.filter((x) => x.status === 'active');
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().all()',
		() => {
			collect(items).where('status', 'active').all();
		},
		STABLE_BENCH,
	);

	bench(
		'native: filter + map',
		() => {
			items.filter((x) => x.status === 'active').map((x) => x.id);
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().pluck().all()',
		() => {
			collect(items).where('status', 'active').pluck('id').all();
		},
		STABLE_BENCH,
	);

	bench(
		'native: filter + filter',
		() => {
			items.filter((x) => x.status === 'active').filter((x) => x.type === 'A');
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().where().all()',
		() => {
			collect(items).where('status', 'active').where('type', 'A').all();
		},
		STABLE_BENCH,
	);
});

describe('Chained operations (100K items)', () => {
	bench(
		'native: filter + slice + sort',
		() => {
			const filtered = items.filter((x) => x.status === 'active');
			const sliced = filtered.slice(0, 100);
			[...sliced].sort((a, b) => a.value - b.value);
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().take().sortBy().all()',
		() => {
			collect(items).where('status', 'active').take(100).sortBy('value').all();
		},
		STABLE_BENCH,
	);

	bench(
		'native: filter + skip + filter',
		() => {
			items
				.filter((x) => x.status === 'active')
				.slice(10)
				.filter((x) => x.type === 'B');
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().skip().where().all()',
		() => {
			collect(items).where('status', 'active').skip(10).where('type', 'B').all();
		},
		STABLE_BENCH,
	);
});

describe('whereIn optimization', () => {
	const lookupValues = ['active', 'pending', 'processing'];

	bench(
		'native: filter + includes',
		() => {
			items.filter((x) => lookupValues.includes(x.status));
		},
		STABLE_BENCH,
	);

	bench(
		'native: filter + Set.has',
		() => {
			const set = new Set(lookupValues);
			items.filter((x) => set.has(x.status));
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: whereIn() strict',
		() => {
			collect(items).whereIn('status', lookupValues, true).all();
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: whereIn() loose',
		() => {
			collect(items).whereIn('status', lookupValues).all();
		},
		STABLE_BENCH,
	);
});

describe('Terminal methods', () => {
	bench(
		'native: filter + length',
		() => {
			items.filter((x) => x.status === 'active').length;
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().count()',
		() => {
			collect(items).where('status', 'active').count();
		},
		STABLE_BENCH,
	);

	bench(
		'native: filter + reduce (sum)',
		() => {
			items.filter((x) => x.status === 'active').reduce((acc, x) => acc + x.value, 0);
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().sum()',
		() => {
			collect(items).where('status', 'active').sum('value');
		},
		STABLE_BENCH,
	);

	bench(
		'native: filter[0]',
		() => {
			items.filter((x) => x.status === 'active')[0];
		},
		STABLE_BENCH,
	);

	bench(
		'Collection: where().first()',
		() => {
			collect(items).where('status', 'active').first();
		},
		STABLE_BENCH,
	);
});
