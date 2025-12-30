/**
 * LazyCollection Tests
 *
 * Tests for lazy evaluation, generator-based collection operations,
 * and auto-delegation to Collection via Proxy.
 */

import { describe, expect, it } from 'vitest';
import { Collection, LazyCollection, lazy, collect, type ProxiedCollection } from '../src';

// Augment CollectionMacros for test macros (must use _T to match base interface)
declare module '../src' {
	interface CollectionMacros<_T> {
		toUpper: _T extends string ? () => ProxiedCollection<string> : never;
		multiplyBy: _T extends number ? (factor: number) => ProxiedCollection<number> : never;
		double: _T extends number ? () => ProxiedCollection<number> : never;
		total: _T extends number ? () => number : never;
		customMethod: () => ProxiedCollection<_T>;
	}
}

// =============================================================================
// BASIC TESTS
// =============================================================================

describe('LazyCollection', () => {
	describe('lazy()', () => {
		it('creates a lazy collection from an array', () => {
			const lc = lazy([1, 2, 3]);
			expect(lc.all()).toEqual([1, 2, 3]);
		});

		it('creates a lazy collection from a generator function', () => {
			const lc = lazy(function* () {
				yield 1;
				yield 2;
				yield 3;
			});
			expect(lc.all()).toEqual([1, 2, 3]);
		});

		it('rejects raw generators with an error', () => {
			function* gen() {
				yield 1;
			}
			expect(() => lazy(gen() as unknown as Iterable<number>)).toThrow(
				'Generators should not be passed directly',
			);
		});

		it('creates an empty lazy collection', () => {
			const lc = LazyCollection.empty();
			expect(lc.all()).toEqual([]);
		});

		it('handles null input gracefully', () => {
			const lc = lazy(null as unknown as number[]);
			expect(lc.all()).toEqual([]);
		});

		it('handles undefined input gracefully', () => {
			const lc = lazy(undefined as unknown as number[]);
			expect(lc.all()).toEqual([]);
		});

		it('creates from an iterable (Set)', () => {
			const set = new Set([1, 2, 3]);
			const lc = lazy(set);
			expect(lc.all()).toEqual([1, 2, 3]);
		});

		it('creates from a Map (iterable)', () => {
			const map = new Map([
				['a', 1],
				['b', 2],
			]);
			// Map itself is iterable, yielding [key, value] entries
			const lc = lazy(map);
			expect(lc.all()).toEqual([
				['a', 1],
				['b', 2],
			]);
		});
	});

	describe('static factories', () => {
		it('LazyCollection.make() creates from generator function', () => {
			const lc = LazyCollection.make(function* () {
				yield 'a';
				yield 'b';
			});
			expect(lc.all()).toEqual(['a', 'b']);
		});

		it('LazyCollection.range() creates a range of numbers', () => {
			expect(LazyCollection.range(1, 5).all()).toEqual([1, 2, 3, 4, 5]);
			expect(LazyCollection.range(5, 1).all()).toEqual([5, 4, 3, 2, 1]);
		});

		it('LazyCollection.times() invokes callback n times', () => {
			expect(LazyCollection.times(3).all()).toEqual([1, 2, 3]);
			expect(LazyCollection.times(3, (i) => i * 2).all()).toEqual([2, 4, 6]);
		});
	});

	// =============================================================================
	// LAZY METHODS
	// =============================================================================

	describe('lazy methods', () => {
		describe('map()', () => {
			it('transforms items lazily', () => {
				const calls: number[] = [];
				const lc = lazy([1, 2, 3]).map((x) => {
					calls.push(x);
					return x * 2;
				});

				// Not evaluated yet
				expect(calls).toEqual([]);

				// Now evaluate
				expect(lc.all()).toEqual([2, 4, 6]);
				expect(calls).toEqual([1, 2, 3]);
			});
		});

		describe('filter()', () => {
			it('filters items lazily', () => {
				const calls: number[] = [];
				const lc = lazy([1, 2, 3, 4]).filter((x) => {
					calls.push(x);
					return x > 2;
				});

				expect(calls).toEqual([]);
				expect(lc.all()).toEqual([3, 4]);
				expect(calls).toEqual([1, 2, 3, 4]);
			});

			it('filters falsy values when no callback provided', () => {
				expect(lazy([0, 1, '', 'hello', null, undefined, false, true]).filter().all()).toEqual([
					1,
					'hello',
					true,
				]);
			});
		});

		describe('reject()', () => {
			it('rejects items matching the callback', () => {
				expect(
					lazy([1, 2, 3, 4])
						.reject((x) => x > 2)
						.all(),
				).toEqual([1, 2]);
			});
		});

		describe('take()', () => {
			it('takes the first n items lazily', () => {
				const calls: number[] = [];
				// Use a generator function (not a raw generator)
				const lc = lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						calls.push(i);
						yield i;
					}
				}).take(3);

				// Before evaluation, nothing has been called
				expect(calls).toEqual([]);

				// Only 3 items should be consumed
				expect(lc.all()).toEqual([1, 2, 3]);
				expect(calls).toEqual([1, 2, 3]);
			});

			it('handles negative take', () => {
				expect(lazy([1, 2, 3, 4, 5]).take(-2).all()).toEqual([4, 5]);
			});
		});

		describe('skip()', () => {
			it('skips the first n items', () => {
				expect(lazy([1, 2, 3, 4, 5]).skip(2).all()).toEqual([3, 4, 5]);
			});
		});

		describe('takeWhile()', () => {
			it('takes items while callback returns true', () => {
				expect(
					lazy([1, 2, 3, 4, 5])
						.takeWhile((x) => x < 4)
						.all(),
				).toEqual([1, 2, 3]);
			});
		});

		describe('takeUntil()', () => {
			it('takes items until callback returns true', () => {
				expect(
					lazy([1, 2, 3, 4, 5])
						.takeUntil((x) => x > 3)
						.all(),
				).toEqual([1, 2, 3]);
			});
		});

		describe('skipWhile()', () => {
			it('skips items while callback returns true', () => {
				expect(
					lazy([1, 2, 3, 4, 5])
						.skipWhile((x) => x < 3)
						.all(),
				).toEqual([3, 4, 5]);
			});
		});

		describe('skipUntil()', () => {
			it('skips items until callback returns true', () => {
				expect(
					lazy([1, 2, 3, 4, 5])
						.skipUntil((x) => x >= 3)
						.all(),
				).toEqual([3, 4, 5]);
			});
		});

		describe('flatMap()', () => {
			it('maps and flattens lazily', () => {
				expect(
					lazy([1, 2, 3])
						.flatMap((x) => [x, x * 10])
						.all(),
				).toEqual([1, 10, 2, 20, 3, 30]);
			});
		});

		describe('chunk()', () => {
			it('chunks items lazily', () => {
				expect(lazy([1, 2, 3, 4, 5]).chunk(2).all()).toEqual([[1, 2], [3, 4], [5]]);
			});

			it('chunks evenly divisible arrays', () => {
				// When array length is divisible by chunk size, no partial chunk at end
				expect(lazy([1, 2, 3, 4]).chunk(2).all()).toEqual([[1, 2], [3, 4]]);
			});

			it('returns empty for size <= 0', () => {
				expect(lazy([1, 2, 3]).chunk(0).all()).toEqual([]);
			});
		});

		describe('each()', () => {
			it('iterates over items', () => {
				const items: number[] = [];
				lazy([1, 2, 3]).each((x) => items.push(x));
				expect(items).toEqual([1, 2, 3]);
			});

			it('stops when callback returns false', () => {
				const items: number[] = [];
				lazy([1, 2, 3, 4]).each((x) => {
					items.push(x);
					return x < 3 ? undefined : false;
				});
				expect(items).toEqual([1, 2, 3]);
			});
		});

		describe('tap()', () => {
			it('passes collection to callback and returns this', () => {
				let captured: LazyCollection<number> | null = null;
				const lc = lazy([1, 2, 3]).tap((c) => {
					captured = c;
				});
				expect(captured).toBe(lc);
			});
		});
	});

	// =============================================================================
	// LAZY COLLECTION-SPECIFIC METHODS
	// =============================================================================

	describe('LazyCollection-specific methods', () => {
		describe('tapEach()', () => {
			it('executes callback lazily on each item', () => {
				const tapped: number[] = [];
				const lc = lazy([1, 2, 3]).tapEach((x) => tapped.push(x));

				// Not executed yet
				expect(tapped).toEqual([]);

				// Now execute
				lc.all();
				expect(tapped).toEqual([1, 2, 3]);
			});
		});

		describe('remember()', () => {
			it('caches yielded values for re-iteration', () => {
				let computeCount = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 3; i++) {
						computeCount++;
						yield i;
					}
				}).remember();

				// First iteration
				expect(lc.all()).toEqual([1, 2, 3]);
				expect(computeCount).toBe(3);

				// Second iteration should use cache
				expect(lc.all()).toEqual([1, 2, 3]);
				// Count stays the same because values are cached
				expect(computeCount).toBe(3);
			});

			it('uses cache on re-iteration after partial consumption', () => {
				let computeCount = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 5; i++) {
						computeCount++;
						yield i;
					}
				}).remember();

				// Partial iteration - consume 2 items using take()
				expect(lc.take(2).all()).toEqual([1, 2]);
				expect(computeCount).toBe(2);

				// Full iteration - yields cached values first (no re-computation),
				// then continues from where the persistent iterator left off.
				expect(lc.all()).toEqual([1, 2, 3, 4, 5]);
				// 2 from first take() + 3 more to complete (iterator persists position)
				expect(computeCount).toBe(5);
			});
		});

		describe('takeUntilTimeout()', () => {
			it('takes items until timeout', () => {
				const futureDate = new Date(Date.now() + 1000); // 1 second in future
				const lc = lazy([1, 2, 3]).takeUntilTimeout(futureDate);
				expect(lc.all()).toEqual([1, 2, 3]);
			});

			it('stops when timeout is reached', () => {
				const pastDate = new Date(Date.now() - 1000); // 1 second in past
				const lc = lazy([1, 2, 3]).takeUntilTimeout(pastDate);
				expect(lc.all()).toEqual([]);
			});
		});
	});

	// =============================================================================
	// TERMINAL METHODS
	// =============================================================================

	describe('terminal methods', () => {
		describe('collect()', () => {
			it('converts to eager Collection', () => {
				const collection = lazy([1, 2, 3]).collect();
				expect(collection).toBeInstanceOf(Collection);
				expect(collection.all()).toEqual([1, 2, 3]);
			});
		});

		describe('all() / toArray()', () => {
			it('returns all items as array', () => {
				expect(lazy([1, 2, 3]).all()).toEqual([1, 2, 3]);
				expect(lazy([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
			});
		});

		describe('first()', () => {
			it('returns the first item', () => {
				expect(lazy([1, 2, 3]).first()).toBe(1);
			});

			it('returns first item matching callback', () => {
				expect(lazy([1, 2, 3]).first((x) => x > 1)).toBe(2);
			});

			it('returns undefined for empty collection', () => {
				expect(lazy([]).first()).toBeUndefined();
			});
		});

		describe('last()', () => {
			it('returns the last item', () => {
				expect(lazy([1, 2, 3]).last()).toBe(3);
			});

			it('returns last item matching callback', () => {
				expect(lazy([1, 2, 3, 2]).last((x) => x === 2)).toBe(2);
			});
		});

		describe('count()', () => {
			it('counts items', () => {
				expect(lazy([1, 2, 3]).count()).toBe(3);
			});
		});

		describe('isEmpty() / isNotEmpty()', () => {
			it('checks if empty', () => {
				expect(lazy([]).isEmpty()).toBe(true);
				expect(lazy([1]).isEmpty()).toBe(false);
				expect(lazy([]).isNotEmpty()).toBe(false);
				expect(lazy([1]).isNotEmpty()).toBe(true);
			});
		});
	});

	// =============================================================================
	// PROXY DELEGATION
	// =============================================================================

	describe('proxy delegation', () => {
		it('delegates sum() to Collection', () => {
			expect(lazy([1, 2, 3]).sum()).toBe(6);
		});

		it('delegates avg() to Collection', () => {
			expect(lazy([1, 2, 3]).avg()).toBe(2);
		});

		it('delegates min() to Collection', () => {
			expect(lazy([3, 1, 2]).min()).toBe(1);
		});

		it('delegates max() to Collection', () => {
			expect(lazy([3, 1, 2]).max()).toBe(3);
		});

		it('delegates contains() to Collection', () => {
			expect(lazy([1, 2, 3]).contains(2)).toBe(true);
			expect(lazy([1, 2, 3]).contains(5)).toBe(false);
		});

		it('delegates sort() to Collection', () => {
			const result = lazy([3, 1, 2]).sort();
			expect(result.all()).toEqual([1, 2, 3]);
		});

		it('delegates groupBy() to Collection', () => {
			const result = lazy([
				{ type: 'a', value: 1 },
				{ type: 'b', value: 2 },
				{ type: 'a', value: 3 },
			]).groupBy('type');

			expect(result.keys().all()).toEqual(['a', 'b']);
		});

		it('delegates reduce() to Collection', () => {
			const result = lazy([1, 2, 3]).reduce((acc, val) => acc + val, 0);
			expect(result).toBe(6);
		});

		it('delegates pluck() to Collection', () => {
			const result = lazy([{ name: 'Alice' }, { name: 'Bob' }]).pluck('name');
			expect(result.all()).toEqual(['Alice', 'Bob']);
		});

		it('delegates property access (not just methods) to Collection', () => {
			// The proxy returns a wrapper function for delegation
			// When called, if the Collection property is not a function, it returns the value
			// This tests the `return method` branch when method is not a function
			const lc = lazy([1, 2, 3]);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = (lc as any).nonExistentProperty();
			expect(result).toBeUndefined();
		});
	});

	// =============================================================================
	// CHAINING
	// =============================================================================

	describe('method chaining', () => {
		it('chains lazy methods', () => {
			const result = lazy([1, 2, 3, 4, 5])
				.map((x) => x * 2)
				.filter((x) => x > 4)
				.take(2)
				.all();

			expect(result).toEqual([6, 8]);
		});

		it('chains lazy methods then delegates', () => {
			const result = lazy([1, 2, 3, 4, 5])
				.map((x) => x * 2)
				.filter((x) => x > 4)
				.sum();

			expect(result).toBe(6 + 8 + 10); // 24
		});
	});

	// =============================================================================
	// INTEGRATION: Collection.lazy()
	// =============================================================================

	describe('Collection.lazy()', () => {
		it('converts Collection to LazyCollection', () => {
			const lc = collect([1, 2, 3]).lazy();
			expect(lc.all()).toEqual([1, 2, 3]);
		});

		it('lazy collection from Collection can chain', () => {
			const result = collect([1, 2, 3, 4, 5])
				.lazy()
				.map((x) => x * 2)
				.take(3)
				.all();

			expect(result).toEqual([2, 4, 6]);
		});
	});

	// =============================================================================
	// NATIVE AGGREGATE METHODS (single-pass, short-circuit)
	// =============================================================================

	describe('native aggregate methods', () => {
		describe('sum()', () => {
			it('calculates sum in single pass', () => {
				let consumed = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 5; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.sum()).toBe(15);
				expect(consumed).toBe(5); // All items consumed
			});

			it('handles objects with key', () => {
				const lc = lazy([{ val: 1 }, { val: 2 }, { val: 3 }]);
				expect(lc.sum('val')).toBe(6);
			});

			it('handles callback', () => {
				const lc = lazy([{ val: 1 }, { val: 2 }, { val: 3 }]);
				expect(lc.sum((item) => item.val * 2)).toBe(12);
			});

			it('returns 0 for empty collection', () => {
				expect(lazy([]).sum()).toBe(0);
			});

			it('skips non-numeric values', () => {
				const lc = lazy([1, 'two', null, 3, undefined, NaN, 5] as unknown[]);
				expect(lc.sum()).toBe(9); // 1 + 3 + 5
			});

			it('skips NaN values from callback', () => {
				const lc = lazy([{ val: 1 }, { val: 'x' }, { val: 3 }]);
				expect(lc.sum('val')).toBe(4); // 1 + 3, 'x' is skipped
			});
		});

		describe('min()', () => {
			it('finds minimum in single pass', () => {
				expect(lazy([3, 1, 4, 1, 5]).min()).toBe(1);
			});

			it('handles objects with key', () => {
				const lc = lazy([{ val: 5 }, { val: 2 }, { val: 8 }]);
				expect(lc.min('val')).toBe(2);
			});

			it('returns null for empty collection', () => {
				expect(lazy([]).min()).toBeNull();
			});
		});

		describe('max()', () => {
			it('finds maximum in single pass', () => {
				expect(lazy([3, 1, 4, 1, 5]).max()).toBe(5);
			});

			it('handles objects with key', () => {
				const lc = lazy([{ val: 5 }, { val: 2 }, { val: 8 }]);
				expect(lc.max('val')).toBe(8);
			});

			it('returns null for empty collection', () => {
				expect(lazy([]).max()).toBeNull();
			});
		});

		describe('avg() / average()', () => {
			it('calculates average in single pass', () => {
				expect(lazy([1, 2, 3, 4, 5]).avg()).toBe(3);
			});

			it('handles objects with key', () => {
				const lc = lazy([{ val: 10 }, { val: 20 }, { val: 30 }]);
				expect(lc.avg('val')).toBe(20);
			});

			it('average() is alias for avg()', () => {
				expect(lazy([1, 2, 3]).average()).toBe(2);
			});

			it('returns null for empty collection', () => {
				expect(lazy([]).avg()).toBeNull();
			});

			it('skips non-numeric values', () => {
				const lc = lazy([1, 'two', null, 3, undefined, NaN, 5] as unknown[]);
				expect(lc.avg()).toBe(3); // (1 + 3 + 5) / 3
			});
		});

		describe('contains() - short-circuit', () => {
			it('short-circuits on first match', () => {
				let consumed = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.contains(3)).toBe(true);
				expect(consumed).toBe(3); // Only consumed up to match!
			});

			it('consumes all when not found', () => {
				let consumed = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 5; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.contains(10)).toBe(false);
				expect(consumed).toBe(5);
			});

			it('short-circuits with callback', () => {
				let consumed = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.contains((x) => x === 5)).toBe(true);
				expect(consumed).toBe(5);
			});

			it('uses loose equality', () => {
				expect(lazy([1, 2, '3']).contains(3)).toBe(true);
			});

			it('handles key/operator/value form', () => {
				const lc = lazy([{ val: 1 }, { val: 2 }, { val: 3 }]);
				expect(lc.contains('val', 2)).toBe(true);
				expect(lc.contains('val', '>', 2)).toBe(true);
			});
		});

		describe('containsStrict() - short-circuit', () => {
			it('short-circuits on first strict match', () => {
				let consumed = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.containsStrict(3)).toBe(true);
				expect(consumed).toBe(3);
			});

			it('uses strict equality', () => {
				expect(lazy([1, 2, '3']).containsStrict(3)).toBe(false);
				expect(lazy([1, 2, '3']).containsStrict('3')).toBe(true);
			});

			it('handles key/value form', () => {
				const lc = lazy([{ val: 1 }, { val: '2' }, { val: 3 }]);
				expect(lc.containsStrict('val', 2)).toBe(false);
				expect(lc.containsStrict('val', '2')).toBe(true);
			});

			it('short-circuits with callback', () => {
				let consumed = 0;
				const lc = lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.containsStrict((x) => x === 5)).toBe(true);
				expect(consumed).toBe(5);
			});
		});
	});

	// =============================================================================
	// ITERATOR PROTOCOL
	// =============================================================================

	describe('iterator protocol', () => {
		it('supports for...of', () => {
			const items: number[] = [];
			for (const item of lazy([1, 2, 3])) {
				items.push(item);
			}
			expect(items).toEqual([1, 2, 3]);
		});

		it('supports spread operator', () => {
			expect([...lazy([1, 2, 3])]).toEqual([1, 2, 3]);
		});

		it('supports entries() for key-value iteration', () => {
			const lc = new LazyCollection(['a', 'b', 'c']);
			const entries: [string, string][] = [];
			for (const entry of lc.entries()) {
				entries.push(entry);
			}
			expect(entries).toEqual([
				['0', 'a'],
				['1', 'b'],
				['2', 'c'],
			]);
		});
	});
});

// =============================================================================
// MACRO TESTS
// =============================================================================

describe('Collection.macro()', () => {
	it('registers and calls a macro', () => {
		Collection.macro('toUpper', function (this: Collection<string>) {
			return this.map((val) => val.toUpperCase());
		});

		const result = collect(['hello', 'world']).toUpper().all();
		expect(result).toEqual(['HELLO', 'WORLD']);

		Collection.flushMacros();
	});

	it('passes arguments to macros', () => {
		Collection.macro('multiplyBy', function (this: Collection<number>, factor: number) {
			return this.map((val) => val * factor);
		});

		const result = collect([1, 2, 3]).multiplyBy(10).all();
		expect(result).toEqual([10, 20, 30]);

		Collection.flushMacros();
	});

	it('hasMacro returns correct state', () => {
		expect(Collection.hasMacro('custom')).toBe(false);
		Collection.macro('custom', () => {});
		expect(Collection.hasMacro('custom')).toBe(true);
		Collection.flushMacros();
		expect(Collection.hasMacro('custom')).toBe(false);
	});

	it('macro results are wrapped for chaining', () => {
		Collection.macro('double', function (this: Collection<number>) {
			return this.map((n) => n * 2);
		});

		const result = collect([1, 2]).double().filter((n) => n > 2).all();
		expect(result).toEqual([4]);

		Collection.flushMacros();
	});

	it('macro can return non-Collection values', () => {
		Collection.macro('total', function (this: Collection<number>) {
			return this.sum();
		});

		const result = collect([1, 2, 3]).total();
		expect(result).toBe(6);

		Collection.flushMacros();
	});
});
