/**
 * Tests for pipeline execution semantics.
 *
 * Verifies that deferred operations execute correctly and that
 * the collection maintains immutability.
 */
import { describe, expect, it } from 'vitest';
import { collect } from '../src';

describe('Pipeline execution', () => {
	describe('Deferred where()', () => {
		it('executes filter on all()', () => {
			const items = [{ status: 'active' }, { status: 'inactive' }, { status: 'active' }];
			const result = collect(items).where('status', 'active').all();
			expect(result).toHaveLength(2);
			expect(result.every((x) => x.status === 'active')).toBe(true);
		});

		it('supports chained where() calls', () => {
			const items = [
				{ status: 'active', type: 'A' },
				{ status: 'active', type: 'B' },
				{ status: 'inactive', type: 'A' },
			];
			const result = collect(items).where('status', 'active').where('type', 'A').all();
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ status: 'active', type: 'A' });
		});

		it('supports all operators', () => {
			const items = [{ age: 20 }, { age: 25 }, { age: 30 }, { age: 35 }];
			const c = collect(items);

			expect(c.where('age', '=', 25).all()).toHaveLength(1);
			expect(c.where('age', '==', 25).all()).toHaveLength(1);
			expect(c.where('age', '!=', 25).all()).toHaveLength(3);
			expect(c.where('age', '<>', 25).all()).toHaveLength(3);
			expect(c.where('age', '>', 25).all()).toHaveLength(2);
			expect(c.where('age', '>=', 25).all()).toHaveLength(3);
			expect(c.where('age', '<', 25).all()).toHaveLength(1);
			expect(c.where('age', '<=', 25).all()).toHaveLength(2);
		});

		it('falls back for dot notation', () => {
			const items = [{ user: { name: 'Alice' } }, { user: { name: 'Bob' } }];
			const result = collect(items).where('user.name', 'Alice').all();
			expect(result).toHaveLength(1);
			expect(result[0].user.name).toBe('Alice');
		});
	});

	describe('Deferred whereIn/whereNotIn', () => {
		it('executes strict whereIn with Set lookup', () => {
			const items = [{ type: 'A' }, { type: 'B' }, { type: 'C' }];
			const result = collect(items).whereIn('type', ['A', 'B'], true).all();
			expect(result).toHaveLength(2);
		});

		it('executes strict whereNotIn with Set lookup', () => {
			const items = [{ type: 'A' }, { type: 'B' }, { type: 'C' }];
			const result = collect(items).whereNotIn('type', ['A'], true).all();
			expect(result).toHaveLength(2);
			expect(result.every((x) => x.type !== 'A')).toBe(true);
		});
	});

	describe('Deferred take/skip', () => {
		it('executes take on terminal', () => {
			const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
			const result = collect(items).take(5).all();
			expect(result).toHaveLength(5);
			expect(result[0].id).toBe(0);
			expect(result[4].id).toBe(4);
		});

		it('executes skip on terminal', () => {
			const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
			const result = collect(items).skip(95).all();
			expect(result).toHaveLength(5);
			expect(result[0].id).toBe(95);
		});

		it('combines take and skip', () => {
			const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
			const result = collect(items).skip(10).take(5).all();
			expect(result).toHaveLength(5);
			expect(result[0].id).toBe(10);
			expect(result[4].id).toBe(14);
		});
	});

	describe('Deferred sortBy', () => {
		it('executes sort on terminal', () => {
			const items = [{ val: 3 }, { val: 1 }, { val: 2 }];
			const result = collect(items).sortBy('val').all();
			expect(result.map((x) => x.val)).toEqual([1, 2, 3]);
		});

		it('executes descending sort', () => {
			const items = [{ val: 1 }, { val: 3 }, { val: 2 }];
			const result = collect(items).sortByDesc('val').all();
			expect(result.map((x) => x.val)).toEqual([3, 2, 1]);
		});

		it('combines filter and sort', () => {
			const items = [
				{ status: 'active', val: 3 },
				{ status: 'inactive', val: 1 },
				{ status: 'active', val: 2 },
			];
			const result = collect(items).where('status', 'active').sortBy('val').all();
			expect(result).toHaveLength(2);
			expect(result.map((x) => x.val)).toEqual([2, 3]);
		});
	});

	describe('Terminal methods', () => {
		it('first() executes pipeline', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const result = collect(items).where('val', '>', 1).first();
			expect(result?.val).toBe(2);
		});

		it('last() executes pipeline', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const result = collect(items).where('val', '<', 3).last();
			expect(result?.val).toBe(2);
		});

		it('count() executes pipeline', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const count = collect(items).where('val', '>', 1).count();
			expect(count).toBe(2);
		});

		it('sum() executes pipeline', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const sum = collect(items).where('val', '>', 1).sum('val');
			expect(sum).toBe(5);
		});

		it('avg() executes pipeline', () => {
			const items = [{ val: 2 }, { val: 4 }, { val: 6 }];
			const avg = collect(items).where('val', '<=', 4).avg('val');
			expect(avg).toBe(3);
		});

		it('min() executes pipeline', () => {
			const items = [{ val: 5 }, { val: 3 }, { val: 8 }];
			const min = collect(items).where('val', '<', 8).min('val');
			expect(min).toBe(3);
		});

		it('max() executes pipeline', () => {
			const items = [{ val: 5 }, { val: 3 }, { val: 8 }];
			const max = collect(items).where('val', '>', 3).max('val');
			expect(max).toBe(8);
		});
	});

	describe('Immutability', () => {
		it('original collection unchanged after where()', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const original = collect(items);
			const filtered = original.where('val', '>', 1);

			expect(original.count()).toBe(3);
			expect(filtered.count()).toBe(2);
		});

		it('original collection unchanged after multiple operations', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const original = collect(items);

			const a = original.where('val', 1);
			const b = original.where('val', 2);
			const c = original.where('val', 3);

			expect(a.count()).toBe(1);
			expect(b.count()).toBe(1);
			expect(c.count()).toBe(1);
			expect(original.count()).toBe(3);
		});

		it('chained operations create independent pipelines', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const base = collect(items).where('val', '>', 1);

			const branch1 = base.take(1);
			const branch2 = base.skip(1);

			expect(branch1.count()).toBe(1);
			expect(branch1.first()?.val).toBe(2);

			expect(branch2.count()).toBe(1);
			expect(branch2.first()?.val).toBe(3);
		});
	});

	describe('Non-deferred methods materialize', () => {
		it('pluck() materializes pending operations', () => {
			const items = [
				{ name: 'a', val: 1 },
				{ name: 'b', val: 2 },
			];
			const names = collect(items).where('val', '>', 1).pluck('name').all();
			expect(names).toEqual(['b']);
		});

		it('map() materializes pending operations', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const doubled = collect(items)
				.where('val', '>', 1)
				.map((x) => x.val * 2)
				.all();
			expect(doubled).toEqual([4, 6]);
		});

		it('filter() materializes pending operations', () => {
			const items = [{ val: 1 }, { val: 2 }, { val: 3 }];
			const result = collect(items)
				.where('val', '>', 1)
				.filter((x) => x.val < 3)
				.all();
			expect(result).toEqual([{ val: 2 }]);
		});

		it('values() materializes pending operations', () => {
			const items = [{ val: 3 }, { val: 1 }, { val: 2 }];
			const sorted = collect(items).sortBy('val').values().all();
			expect(sorted.map((x) => x.val)).toEqual([1, 2, 3]);
		});
	});

	describe('Mode selection (_explain)', () => {
		it('chooses compiled mode for key-based filters', () => {
			const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, status: 'active' }));
			const c = collect(items).where('status', 'active');
			const explain = c._explain('first');

			expect(explain.source).toBe('array');
			expect(explain.allCompilable).toBe(true);
			expect(explain.mode).toBe('compiled');
		});

		it('callback filter() materializes immediately (no pending ops)', () => {
			// Currently, filter(callback) materializes immediately rather than deferring
			// This is expected behavior - callbacks don't participate in the deferred pipeline yet
			const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
			const c = collect(items).filter((x) => x.id > 500);
			const explain = c._explain('first');

			// No ops pending because filter() already executed
			expect(explain.ops).toHaveLength(0);
			expect(explain.mode).toBe('eager'); // No ops = direct access
		});

		it('chooses eager mode for small arrays with all()', () => {
			const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
			const c = collect(items).where('id', '>', 50);
			const explain = c._explain('all');

			// Small array + all terminal = eager is acceptable
			expect(explain.sourceSize).toBe(100);
			expect(explain.mode).toBe('eager');
		});

		it('tracks operations in explain output', () => {
			const items = [{ id: 1 }, { id: 2 }];
			const c = collect(items).where('id', '>', 0).take(1);
			const explain = c._explain();

			expect(explain.ops).toHaveLength(2);
			expect(explain.ops[0]).toMatchObject({ type: 'filter', key: 'id' });
			expect(explain.ops[1]).toMatchObject({ type: 'take', n: 1 });
		});
	});

	describe('Short-circuit execution', () => {
		it('first() stops at first match in compiled mode', () => {
			// Use a large array to verify short-circuit
			const items = Array.from({ length: 100000 }, (_, i) => ({ id: i, status: i === 5 ? 'found' : 'other' }));
			const result = collect(items).where('status', 'found').first();

			expect(result).toEqual({ id: 5, status: 'found' });
		});

		it('first() returns undefined when no match', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			const result = collect(items).where('id', '>', 100).first();

			expect(result).toBeUndefined();
		});

		it('first() respects take() limit', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			const result = collect(items).take(1).first();

			expect(result).toEqual({ id: 1 });
		});

		it('first() respects skip()', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			const result = collect(items).skip(1).first();

			expect(result).toEqual({ id: 2 });
		});
	});
});
