import { describe, expect, it } from 'vitest';
import { CoreCollection, createCollection } from '../src/core/index.js';
import filterMethod from '../src/methods/filter.js';
import mapMethod from '../src/methods/map.js';
import groupByMethod from '../src/methods/groupBy.js';
import firstMethod from '../src/methods/first.js';
import reduceMethod from '../src/methods/reduce.js';

describe('CoreCollection', () => {
	describe('basic operations', () => {
		it('creates from array', () => {
			const c = new CoreCollection([1, 2, 3]);
			expect(c.all()).toEqual([1, 2, 3]);
			expect(c.count()).toBe(3);
		});

		it('creates from object', () => {
			const c = new CoreCollection({ a: 1, b: 2 });
			expect(c.all()).toEqual({ a: 1, b: 2 });
			expect(c.isAssociative).toBe(true);
		});

		it('is iterable', () => {
			const c = new CoreCollection([1, 2, 3]);
			expect([...c]).toEqual([1, 2, 3]);
		});

		it('converts to JSON', () => {
			const c = new CoreCollection([1, 2, 3]);
			expect(c.toJson()).toBe('[1,2,3]');
		});

		it('checks empty state', () => {
			expect(new CoreCollection([]).isEmpty()).toBe(true);
			expect(new CoreCollection([1]).isEmpty()).toBe(false);
			expect(new CoreCollection([]).isNotEmpty()).toBe(false);
			expect(new CoreCollection([1]).isNotEmpty()).toBe(true);
		});
	});
});

describe('createCollection', () => {
	it('creates collect function with specified methods', () => {
		const collect = createCollection([filterMethod, mapMethod]);
		const result = collect([1, 2, 3, 4, 5])
			.filter((x: number) => x > 2)
			.map((x: number) => x * 2);
		expect(result.all()).toEqual([6, 8, 10]);
	});

	it('chains multiple methods', () => {
		const collect = createCollection([filterMethod, mapMethod, reduceMethod]);
		const result = collect([1, 2, 3, 4, 5])
			.filter((x: number) => x > 2)
			.map((x: number) => x * 2)
			.reduce((sum: number, x: number) => sum + x, 0);
		expect(result).toBe(24);
	});

	it('supports groupBy', () => {
		const collect = createCollection([groupByMethod]);
		const users = [
			{ name: 'John', role: 'admin' },
			{ name: 'Jane', role: 'user' },
			{ name: 'Bob', role: 'admin' },
		];
		const result = collect(users).groupBy('role');
		expect(result.all().admin.count()).toBe(2);
		expect(result.all().user.count()).toBe(1);
	});

	it('supports first', () => {
		const collect = createCollection([firstMethod, filterMethod]);
		const result = collect([1, 2, 3, 4, 5])
			.filter((x: number) => x > 2)
			.first();
		expect(result).toBe(3);
	});
});

describe('standalone functions', () => {
	it('filter works on plain arrays', async () => {
		const { filter } = await import('../src/fn/index.js');
		const result = filter([1, 2, 3, 4, 5], (x) => x > 2);
		expect(result).toEqual([3, 4, 5]);
	});

	it('map works on plain arrays', async () => {
		const { map } = await import('../src/fn/index.js');
		const result = map([1, 2, 3], (x) => x * 2);
		expect(result).toEqual([2, 4, 6]);
	});

	it('groupBy works on plain arrays', async () => {
		const { groupBy } = await import('../src/fn/index.js');
		const users = [
			{ name: 'John', role: 'admin' },
			{ name: 'Jane', role: 'user' },
			{ name: 'Bob', role: 'admin' },
		];
		const result = groupBy(users, 'role');
		expect(result.admin.length).toBe(2);
		expect(result.user.length).toBe(1);
	});

	it('first works on plain arrays', async () => {
		const { first } = await import('../src/fn/index.js');
		expect(first([1, 2, 3])).toBe(1);
		expect(first([1, 2, 3], (x) => x > 1)).toBe(2);
	});

	it('reduce works on plain arrays', async () => {
		const { reduce } = await import('../src/fn/index.js');
		const result = reduce([1, 2, 3], (sum, x) => sum + x, 0);
		expect(result).toBe(6);
	});
});
