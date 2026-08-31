import { afterEach, describe, expect, it, vi } from 'vitest';
import { Collection, collect, isLazyCollection, type ProxiedCollection } from '../src';

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

describe('LazyCollection', () => {
	describe('collect.lazy()', () => {
		it('creates a lazy collection from an array', () => {
			const lc = collect.lazy([1, 2, 3]);
			expect(lc.all()).toEqual([1, 2, 3]);
		});

		it('creates a lazy collection from a generator function', () => {
			const lc = collect.lazy(function* () {
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
			expect(() => collect.lazy(gen() as unknown as Iterable<number>)).toThrow(
				'Generators should not be passed directly',
			);
		});

		it('creates an empty lazy collection', () => {
			const lc = collect.lazy.empty();
			expect(lc.all()).toEqual([]);
		});

		it('handles null input gracefully', () => {
			const lc = collect.lazy(null as unknown as number[]);
			expect(lc.all()).toEqual([]);
		});

		it('handles undefined input gracefully', () => {
			const lc = collect.lazy(undefined as unknown as number[]);
			expect(lc.all()).toEqual([]);
		});

		it('creates from an iterable (Set)', () => {
			const set = new Set([1, 2, 3]);
			const lc = collect.lazy(set);
			expect(lc.all()).toEqual([1, 2, 3]);
		});

		it('creates from a Map (iterable)', () => {
			const map = new Map([
				['a', 1],
				['b', 2],
			]);
			// Map itself is iterable, yielding [key, value] entries
			const lc = collect.lazy(map);
			expect(lc.all()).toEqual([
				['a', 1],
				['b', 2],
			]);
		});
	});

	describe('static factories', () => {
		it('creates from generator function', () => {
			const lc = collect.lazy(function* () {
				yield 'a';
				yield 'b';
			});
			expect(lc.all()).toEqual(['a', 'b']);
		});

		it('collect.lazy.range() creates a range of numbers', () => {
			expect(collect.lazy.range(1, 5).all()).toEqual([1, 2, 3, 4, 5]);
			expect(collect.lazy.range(5, 1).all()).toEqual([5, 4, 3, 2, 1]);
		});

		it('collect.lazy.times() invokes callback n times', () => {
			expect(collect.lazy.times(3).all()).toEqual([1, 2, 3]);
			expect(collect.lazy.times(3, (i) => i * 2).all()).toEqual([2, 4, 6]);
		});
	});

	describe('lazy methods', () => {
		describe('map()', () => {
			it('transforms items lazily', () => {
				const calls: number[] = [];
				const lc = collect.lazy([1, 2, 3]).map((x) => {
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
				const lc = collect.lazy([1, 2, 3, 4]).filter((x) => {
					calls.push(x);
					return x > 2;
				});

				expect(calls).toEqual([]);
				expect(lc.all()).toEqual([3, 4]);
				expect(calls).toEqual([1, 2, 3, 4]);
			});

			it('filters falsy values when no callback provided', () => {
				expect(collect.lazy([0, 1, '', 'hello', null, undefined, false, true]).filter().all()).toEqual([
					1,
					'hello',
					true,
				]);
			});
		});

		describe('reject()', () => {
			it('rejects items matching the callback', () => {
				expect(
					collect
						.lazy([1, 2, 3, 4])
						.reject((x) => x > 2)
						.all(),
				).toEqual([1, 2]);
			});
		});

		describe('take()', () => {
			it('takes the first n items lazily', () => {
				const calls: number[] = [];
				// Use a generator function (not a raw generator)
				const lc = collect
					.lazy(function* () {
						for (let i = 1; i <= 100; i++) {
							calls.push(i);
							yield i;
						}
					})
					.take(3);

				// Before evaluation, nothing has been called
				expect(calls).toEqual([]);

				// Only 3 items should be consumed
				expect(lc.all()).toEqual([1, 2, 3]);
				expect(calls).toEqual([1, 2, 3]);
			});

			it('handles negative take', () => {
				expect(collect.lazy([1, 2, 3, 4, 5]).take(-2).all()).toEqual([4, 5]);
			});
		});

		describe('skip()', () => {
			it('skips the first n items', () => {
				expect(collect.lazy([1, 2, 3, 4, 5]).skip(2).all()).toEqual([3, 4, 5]);
			});
		});

		describe('takeWhile()', () => {
			it('takes items while callback returns true', () => {
				expect(
					collect
						.lazy([1, 2, 3, 4, 5])
						.takeWhile((x) => x < 4)
						.all(),
				).toEqual([1, 2, 3]);
			});
		});

		describe('takeUntil()', () => {
			it('takes items until callback returns true', () => {
				expect(
					collect
						.lazy([1, 2, 3, 4, 5])
						.takeUntil((x) => x > 3)
						.all(),
				).toEqual([1, 2, 3]);
			});
		});

		describe('skipWhile()', () => {
			it('skips items while callback returns true', () => {
				expect(
					collect
						.lazy([1, 2, 3, 4, 5])
						.skipWhile((x) => x < 3)
						.all(),
				).toEqual([3, 4, 5]);
			});
		});

		describe('skipUntil()', () => {
			it('skips items until callback returns true', () => {
				expect(
					collect
						.lazy([1, 2, 3, 4, 5])
						.skipUntil((x) => x >= 3)
						.all(),
				).toEqual([3, 4, 5]);
			});
		});

		describe('flatMap()', () => {
			it('maps and flattens lazily', () => {
				expect(
					collect
						.lazy([1, 2, 3])
						.flatMap((x) => [x, x * 10])
						.all(),
				).toEqual([1, 10, 2, 20, 3, 30]);
			});
		});

		describe('chunk()', () => {
			it('chunks items lazily', () => {
				expect(collect.lazy([1, 2, 3, 4, 5]).chunk(2).all()).toEqual([[1, 2], [3, 4], [5]]);
			});

			it('chunks evenly divisible arrays', () => {
				// When array length is divisible by chunk size, no partial chunk at end
				expect(collect.lazy([1, 2, 3, 4]).chunk(2).all()).toEqual([
					[1, 2],
					[3, 4],
				]);
			});

			it('returns empty for size <= 0', () => {
				expect(collect.lazy([1, 2, 3]).chunk(0).all()).toEqual([]);
			});
		});

		describe('each()', () => {
			it('iterates over items', () => {
				const items: number[] = [];
				collect.lazy([1, 2, 3]).each((x) => items.push(x));
				expect(items).toEqual([1, 2, 3]);
			});

			it('stops when callback returns false', () => {
				const items: number[] = [];
				collect.lazy([1, 2, 3, 4]).each((x) => {
					items.push(x);
					return x < 3 ? undefined : false;
				});
				expect(items).toEqual([1, 2, 3]);
			});
		});

		describe('tap()', () => {
			it('passes collection to callback and returns this', () => {
				let captured: LazyCollection<number> | null = null;
				const lc = collect.lazy([1, 2, 3]).tap((c) => {
					captured = c;
				});
				expect(captured).toBe(lc);
			});
		});
	});

	describe('LazyCollection-specific methods', () => {
		describe('tapEach()', () => {
			it('executes callback lazily on each item', () => {
				const tapped: number[] = [];
				const lc = collect.lazy([1, 2, 3]).tapEach((x) => tapped.push(x));

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
				const lc = collect
					.lazy(function* () {
						for (let i = 1; i <= 3; i++) {
							computeCount++;
							yield i;
						}
					})
					.remember();

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
				const lc = collect
					.lazy(function* () {
						for (let i = 1; i <= 5; i++) {
							computeCount++;
							yield i;
						}
					})
					.remember();

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
				const lc = collect.lazy([1, 2, 3]).takeUntilTimeout(futureDate);
				expect(lc.all()).toEqual([1, 2, 3]);
			});

			it('stops when timeout is reached', () => {
				const pastDate = new Date(Date.now() - 1000); // 1 second in past
				const lc = collect.lazy([1, 2, 3]).takeUntilTimeout(pastDate);
				expect(lc.all()).toEqual([]);
			});
		});

		describe('withHeartbeat()', () => {
			it('calls callback on every item with zero interval', () => {
				let callCount = 0;
				const items = collect
					.lazy([1, 2, 3, 4, 5])
					.withHeartbeat(0, () => callCount++)
					.all();

				expect(items).toEqual([1, 2, 3, 4, 5]);
				expect(callCount).toBe(5); // Zero interval = fires every iteration
			});

			it('does not call callback if interval not reached', () => {
				let callCount = 0;
				const items = collect
					.lazy([1, 2, 3])
					.withHeartbeat(10, () => callCount++) // 10 second interval
					.all();

				expect(items).toEqual([1, 2, 3]);
				expect(callCount).toBe(0); // Too fast to trigger
			});

			it('preserves all items from the source', () => {
				const items = collect
					.lazy([1, 2, 3, 4, 5])
					.withHeartbeat(0, () => {})
					.all();

				expect(items).toEqual([1, 2, 3, 4, 5]);
			});

			it('handles empty collection', () => {
				let callCount = 0;
				const items = collect
					.lazy([])
					.withHeartbeat(0, () => callCount++)
					.all();

				expect(items).toEqual([]);
				expect(callCount).toBe(0);
			});

			it('executes callback lazily', () => {
				let callCount = 0;
				const lc = collect.lazy([1, 2, 3]).withHeartbeat(0, () => callCount++);

				// Not executed yet (lazy)
				expect(callCount).toBe(0);

				// Now execute
				lc.all();
				expect(callCount).toBe(3);
			});

			it('chains with other lazy methods', () => {
				let callCount = 0;
				const items = collect
					.lazy([1, 2, 3, 4, 5])
					.withHeartbeat(0, () => callCount++)
					.filter((x) => x % 2 === 0)
					.map((x) => x * 10)
					.all();

				expect(items).toEqual([20, 40]);
				expect(callCount).toBe(5); // Heartbeat fires for all 5, filter happens after
			});

			it('propagates callback errors', () => {
				const lc = collect.lazy([1, 2, 3]).withHeartbeat(0, () => {
					throw new Error('heartbeat error');
				});

				expect(() => lc.all()).toThrow('heartbeat error');
			});
		});

		describe('throttle()', () => {
			it('returns an AsyncIterable', () => {
				const throttled = collect.lazy([1, 2, 3]).throttle(0.1);
				expect(Symbol.asyncIterator in throttled).toBe(true);
			});

			it('toArray() collects all items', async () => {
				const results = await collect.lazy([1, 2, 3]).throttle(0).toArray();
				expect(results).toEqual([1, 2, 3]);
			});

			it('all() collects all items (alias)', async () => {
				const results = await collect.lazy([1, 2, 3]).throttle(0).all();
				expect(results).toEqual([1, 2, 3]);
			});

			it('delays between items using setTimeout', async () => {
				vi.useFakeTimers();
				const results: number[] = [];

				const promise = (async () => {
					for await (const item of collect.lazy([1, 2, 3]).throttle(0.05)) {
						results.push(item);
					}
				})();

				// First item yields immediately, then setTimeout(50ms) fires
				await vi.advanceTimersByTimeAsync(50);
				await vi.advanceTimersByTimeAsync(50);
				await vi.advanceTimersByTimeAsync(50);
				await promise;

				expect(results).toEqual([1, 2, 3]);
				vi.useRealTimers();
			});

			it('handles zero delay', async () => {
				const results = await collect.lazy([1, 2, 3]).throttle(0).toArray();
				expect(results).toEqual([1, 2, 3]);
			});

			it('handles empty collection', async () => {
				const results = await collect.lazy([]).throttle(0.1).toArray();
				expect(results).toEqual([]);
			});

			it('supports chaining with map()', async () => {
				const results = await collect
					.lazy([1, 2, 3])
					.throttle(0)
					.map((x) => x * 2)
					.toArray();
				expect(results).toEqual([2, 4, 6]);
			});

			it('supports chaining with filter()', async () => {
				const results = await collect
					.lazy([1, 2, 3, 4])
					.throttle(0)
					.filter((x) => x % 2 === 0)
					.toArray();
				expect(results).toEqual([2, 4]);
			});

			it('supports chaining with take()', async () => {
				let count = 0;
				const results = await collect
					.lazy(function* () {
						for (let i = 1; i <= 100; i++) {
							count++;
							yield i;
						}
					})
					.throttle(0)
					.take(3)
					.toArray();

				expect(results).toEqual([1, 2, 3]);
				expect(count).toBe(3); // Should short-circuit
			});

			it('supports chaining with skip()', async () => {
				const results = await collect.lazy([1, 2, 3, 4, 5]).throttle(0).skip(2).toArray();
				expect(results).toEqual([3, 4, 5]);
			});

			it('collect() returns Collection', async () => {
				const collection = await collect.lazy([1, 2, 3]).throttle(0).collect();
				expect(collection).toBeInstanceOf(Collection);
				expect(collection.sum()).toBe(6);
			});

			it('first() returns first item', async () => {
				const result = await collect.lazy([1, 2, 3]).throttle(0).first();
				expect(result).toBe(1);
			});

			it('first() returns first matching item with callback', async () => {
				const result = await collect
					.lazy([1, 2, 3])
					.throttle(0)
					.first((x) => x > 1);
				expect(result).toBe(2);
			});

			it('first() returns undefined for empty collection', async () => {
				const result = await collect.lazy([]).throttle(0).first();
				expect(result).toBeUndefined();
			});

			it('each() iterates with callback', async () => {
				const items: number[] = [];
				await collect
					.lazy([1, 2, 3])
					.throttle(0)
					.each((x) => items.push(x));
				expect(items).toEqual([1, 2, 3]);
			});

			it('each() stops when callback returns false', async () => {
				const items: number[] = [];
				await collect
					.lazy([1, 2, 3, 4, 5])
					.throttle(0)
					.each((x) => {
						items.push(x);
						return x < 3;
					});
				expect(items).toEqual([1, 2, 3]);
			});

			it('count() returns item count', async () => {
				const count = await collect.lazy([1, 2, 3]).throttle(0).count();
				expect(count).toBe(3);
			});

			it('re-throttle changes delay', async () => {
				const throttled = collect.lazy([1, 2, 3]).throttle(1).throttle(0);
				const results = await throttled.toArray();
				expect(results).toEqual([1, 2, 3]);
			});

			it('works with generator functions', async () => {
				const results = await collect
					.lazy(function* () {
						yield 'a';
						yield 'b';
						yield 'c';
					})
					.throttle(0)
					.toArray();
				expect(results).toEqual(['a', 'b', 'c']);
			});
		});
	});

	describe('terminal methods', () => {
		describe('collect()', () => {
			it('converts to eager Collection', () => {
				const collection = collect.lazy([1, 2, 3]).collect();
				expect(collection).toBeInstanceOf(Collection);
				expect(collection.all()).toEqual([1, 2, 3]);
			});
		});

		describe('all() / toArray()', () => {
			it('returns all items as array', () => {
				expect(collect.lazy([1, 2, 3]).all()).toEqual([1, 2, 3]);
				expect(collect.lazy([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
			});
		});

		describe('first()', () => {
			it('returns the first item', () => {
				expect(collect.lazy([1, 2, 3]).first()).toBe(1);
			});

			it('returns first item matching callback', () => {
				expect(collect.lazy([1, 2, 3]).first((x) => x > 1)).toBe(2);
			});

			it('returns undefined for empty collection', () => {
				expect(collect.lazy([]).first()).toBeUndefined();
			});
		});

		describe('last()', () => {
			it('returns the last item', () => {
				expect(collect.lazy([1, 2, 3]).last()).toBe(3);
			});

			it('returns last item matching callback', () => {
				expect(collect.lazy([1, 2, 3, 2]).last((x) => x === 2)).toBe(2);
			});
		});

		describe('count()', () => {
			it('counts items', () => {
				expect(collect.lazy([1, 2, 3]).count()).toBe(3);
			});
		});

		describe('isEmpty() / isNotEmpty()', () => {
			it('checks if empty', () => {
				expect(collect.lazy([]).isEmpty()).toBe(true);
				expect(collect.lazy([1]).isEmpty()).toBe(false);
				expect(collect.lazy([]).isNotEmpty()).toBe(false);
				expect(collect.lazy([1]).isNotEmpty()).toBe(true);
			});
		});
	});

	describe('proxy delegation', () => {
		it('delegates sum() to Collection', () => {
			expect(collect.lazy([1, 2, 3]).sum()).toBe(6);
		});

		it('delegates avg() to Collection', () => {
			expect(collect.lazy([1, 2, 3]).avg()).toBe(2);
		});

		it('delegates min() to Collection', () => {
			expect(collect.lazy([3, 1, 2]).min()).toBe(1);
		});

		it('delegates max() to Collection', () => {
			expect(collect.lazy([3, 1, 2]).max()).toBe(3);
		});

		it('delegates contains() to Collection', () => {
			expect(collect.lazy([1, 2, 3]).contains(2)).toBe(true);
			expect(collect.lazy([1, 2, 3]).contains(5)).toBe(false);
		});

		it('delegates sort() to Collection', () => {
			const result = collect.lazy([3, 1, 2]).sort();
			expect(result.all()).toEqual([1, 2, 3]);
		});

		it('delegates groupBy() to Collection', () => {
			const result = collect
				.lazy([
					{ type: 'a', value: 1 },
					{ type: 'b', value: 2 },
					{ type: 'a', value: 3 },
				])
				.groupBy('type');

			expect(result.keys().all()).toEqual(['a', 'b']);
		});

		it('delegates reduce() to Collection', () => {
			const result = collect.lazy([1, 2, 3]).reduce((acc, val) => acc + val, 0);
			expect(result).toBe(6);
		});

		it('delegates pluck() to Collection', () => {
			const result = collect.lazy([{ name: 'Alice' }, { name: 'Bob' }]).pluck('name');
			expect(result.all()).toEqual(['Alice', 'Bob']);
		});

		it('delegates property access (not just methods) to Collection', () => {
			// The proxy returns a wrapper function for delegation
			// When called, if the Collection property is not a function, it returns the value
			// This tests the `return method` branch when method is not a function
			const lc = collect.lazy([1, 2, 3]);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = (lc as any).nonExistentProperty();
			expect(result).toBeUndefined();
		});
	});

	describe('method chaining', () => {
		it('chains lazy methods', () => {
			const result = collect
				.lazy([1, 2, 3, 4, 5])
				.map((x) => x * 2)
				.filter((x) => x > 4)
				.take(2)
				.all();

			expect(result).toEqual([6, 8]);
		});

		it('chains lazy methods then delegates', () => {
			const result = collect
				.lazy([1, 2, 3, 4, 5])
				.map((x) => x * 2)
				.filter((x) => x > 4)
				.sum();

			expect(result).toBe(6 + 8 + 10); // 24
		});
	});

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

	describe('native aggregate methods', () => {
		describe('sum()', () => {
			it('calculates sum in single pass', () => {
				let consumed = 0;
				const lc = collect.lazy(function* () {
					for (let i = 1; i <= 5; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.sum()).toBe(15);
				expect(consumed).toBe(5); // All items consumed
			});

			it('handles objects with key', () => {
				const lc = collect.lazy([{ val: 1 }, { val: 2 }, { val: 3 }]);
				expect(lc.sum('val')).toBe(6);
			});

			it('handles callback', () => {
				const lc = collect.lazy([{ val: 1 }, { val: 2 }, { val: 3 }]);
				expect(lc.sum((item) => item.val * 2)).toBe(12);
			});

			it('returns 0 for empty collection', () => {
				expect(collect.lazy([]).sum()).toBe(0);
			});

			it('skips non-numeric values', () => {
				const lc = collect.lazy([1, 'two', null, 3, undefined, Number.NaN, 5] as unknown[]);
				expect(lc.sum()).toBe(9); // 1 + 3 + 5
			});

			it('skips NaN values from callback', () => {
				const lc = collect.lazy([{ val: 1 }, { val: 'x' }, { val: 3 }]);
				expect(lc.sum('val')).toBe(4); // 1 + 3, 'x' is skipped
			});
		});

		describe('min()', () => {
			it('finds minimum in single pass', () => {
				expect(collect.lazy([3, 1, 4, 1, 5]).min()).toBe(1);
			});

			it('handles objects with key', () => {
				const lc = collect.lazy([{ val: 5 }, { val: 2 }, { val: 8 }]);
				expect(lc.min('val')).toBe(2);
			});

			it('returns null for empty collection', () => {
				expect(collect.lazy([]).min()).toBeNull();
			});
		});

		describe('max()', () => {
			it('finds maximum in single pass', () => {
				expect(collect.lazy([3, 1, 4, 1, 5]).max()).toBe(5);
			});

			it('handles objects with key', () => {
				const lc = collect.lazy([{ val: 5 }, { val: 2 }, { val: 8 }]);
				expect(lc.max('val')).toBe(8);
			});

			it('returns null for empty collection', () => {
				expect(collect.lazy([]).max()).toBeNull();
			});
		});

		describe('avg() / average()', () => {
			it('calculates average in single pass', () => {
				expect(collect.lazy([1, 2, 3, 4, 5]).avg()).toBe(3);
			});

			it('handles objects with key', () => {
				const lc = collect.lazy([{ val: 10 }, { val: 20 }, { val: 30 }]);
				expect(lc.avg('val')).toBe(20);
			});

			it('average() is alias for avg()', () => {
				expect(collect.lazy([1, 2, 3]).average()).toBe(2);
			});

			it('returns null for empty collection', () => {
				expect(collect.lazy([]).avg()).toBeNull();
			});

			it('skips non-numeric values', () => {
				const lc = collect.lazy([1, 'two', null, 3, undefined, Number.NaN, 5] as unknown[]);
				expect(lc.avg()).toBe(3); // (1 + 3 + 5) / 3
			});
		});

		describe('contains() - short-circuit', () => {
			it('short-circuits on first match', () => {
				let consumed = 0;
				const lc = collect.lazy(function* () {
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
				const lc = collect.lazy(function* () {
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
				const lc = collect.lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.contains((x) => x === 5)).toBe(true);
				expect(consumed).toBe(5);
			});

			it('uses loose equality', () => {
				expect(collect.lazy([1, 2, '3']).contains(3)).toBe(true);
			});

			it('handles key/operator/value form', () => {
				const lc = collect.lazy([{ val: 1 }, { val: 2 }, { val: 3 }]);
				expect(lc.contains('val', 2)).toBe(true);
				expect(lc.contains('val', '>', 2)).toBe(true);
			});
		});

		describe('containsStrict() - short-circuit', () => {
			it('short-circuits on first strict match', () => {
				let consumed = 0;
				const lc = collect.lazy(function* () {
					for (let i = 1; i <= 100; i++) {
						consumed++;
						yield i;
					}
				});
				expect(lc.containsStrict(3)).toBe(true);
				expect(consumed).toBe(3);
			});

			it('uses strict equality', () => {
				expect(collect.lazy([1, 2, '3']).containsStrict(3)).toBe(false);
				expect(collect.lazy([1, 2, '3']).containsStrict('3')).toBe(true);
			});

			it('handles key/value form', () => {
				const lc = collect.lazy([{ val: 1 }, { val: '2' }, { val: 3 }]);
				expect(lc.containsStrict('val', 2)).toBe(false);
				expect(lc.containsStrict('val', '2')).toBe(true);
			});

			it('short-circuits with callback', () => {
				let consumed = 0;
				const lc = collect.lazy(function* () {
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

	describe('iterator protocol', () => {
		it('supports for...of', () => {
			const items: number[] = [];
			for (const item of collect.lazy([1, 2, 3])) {
				items.push(item);
			}
			expect(items).toEqual([1, 2, 3]);
		});

		it('supports spread operator', () => {
			expect([...collect.lazy([1, 2, 3])]).toEqual([1, 2, 3]);
		});

		it('supports entries() for key-value iteration', () => {
			const lc = new LazyCollection(['a', 'b', 'c']);
			const entries: [number, string][] = [];
			for (const entry of lc.entries()) {
				entries.push(entry);
			}
			expect(entries).toEqual([
				[0, 'a'],
				[1, 'b'],
				[2, 'c'],
			]);
		});
	});
});

describe('Collection.macro()', () => {
	it('registers and calls a macro', () => {
		Collection.macro('toUpper', function (this: Collection<string>) {
			return this.map((val) => val.toUpperCase());
		});

		const result = (collect(['hello', 'world']) as any).toUpper().all();
		expect(result).toEqual(['HELLO', 'WORLD']);

		Collection.flushMacros();
	});

	it('passes arguments to macros', () => {
		Collection.macro('multiplyBy', function (this: Collection<number>, factor: number) {
			return this.map((val) => val * factor);
		});

		const result = (collect([1, 2, 3]) as any).multiplyBy(10).all();
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
			return this.map((n: number) => n * 2);
		});

		const result = (collect([1, 2]) as any)
			.double()
			.filter((n: number) => n > 2)
			.all();
		expect(result).toEqual([4]);

		Collection.flushMacros();
	});

	it('macro can return non-Collection values', () => {
		Collection.macro('total', function (this: Collection<number>) {
			return this.sum();
		});

		const result = (collect([1, 2, 3]) as any).total();
		expect(result).toBe(6);

		Collection.flushMacros();
	});
});

import { AsyncLazyCollection, isAsyncLazyCollection, LazyCollection, type ProxiedAsyncLazyCollection } from '../src';

// Augment AsyncCollectionMacros for test macros
declare module '../src' {
	interface AsyncCollectionMacros<_T> {
		double: () => ProxiedAsyncLazyCollection<number>;
		asyncDouble: () => Promise<number[]>;
	}
}

describe('AsyncLazyCollection', () => {
	describe('type predicates', () => {
		it('isLazyCollection identifies LazyCollection instances', () => {
			const lc = collect.lazy([1, 2, 3]);
			const alc = collect.async([1, 2, 3]);

			expect(isLazyCollection(lc)).toBe(true);
			expect(isLazyCollection(alc)).toBe(false);
			expect(isLazyCollection([1, 2, 3])).toBe(false);
			expect(isLazyCollection(null)).toBe(false);
			expect(isLazyCollection(undefined)).toBe(false);
		});

		it('isAsyncLazyCollection identifies AsyncLazyCollection instances', () => {
			const lc = collect.lazy([1, 2, 3]);
			const alc = collect.lazy([1, 2, 3]).throttle(0);

			expect(isAsyncLazyCollection(alc)).toBe(true);
			expect(isAsyncLazyCollection(lc)).toBe(false);
			expect(isAsyncLazyCollection([1, 2, 3])).toBe(false);
			expect(isAsyncLazyCollection(null)).toBe(false);
			expect(isAsyncLazyCollection(undefined)).toBe(false);
		});
	});

	describe('static factory methods', () => {
		it('collect.async.empty() creates empty collection', async () => {
			const alc = collect.async.empty<number>();
			const result = await alc.all();
			expect(result).toEqual([]);
		});

		it('collect.async.range() creates range', async () => {
			const ascending = await collect.async.range(1, 5).all();
			expect(ascending).toEqual([1, 2, 3, 4, 5]);

			const descending = await collect.async.range(5, 1).all();
			expect(descending).toEqual([5, 4, 3, 2, 1]);
		});

		it('collect.async.times() creates repeated values', async () => {
			const withCallback = await collect.async.times(3, (i) => i * 2).all();
			expect(withCallback).toEqual([2, 4, 6]);

			const withoutCallback = await collect.async.times(3).all();
			expect(withoutCallback).toEqual([1, 2, 3]);
		});

		it('collect.async() handles async iterables', async () => {
			async function* asyncGen() {
				yield 1;
				yield 2;
				yield 3;
			}

			const result = await collect.async(asyncGen()).all();
			expect(result).toEqual([1, 2, 3]);
		});
	});

	describe('collect.async() factory', () => {
		it('creates from array', async () => {
			const result = await collect.async([1, 2, 3]).all();
			expect(result).toEqual([1, 2, 3]);
		});

		it('creates from generator function', async () => {
			const result = await collect
				.async(function* () {
					yield 1;
					yield 2;
					yield 3;
				})
				.all();
			expect(result).toEqual([1, 2, 3]);
		});

		it('creates from async generator function', async () => {
			const result = await collect
				.async(async function* () {
					yield 1;
					yield 2;
					yield 3;
				})
				.all();
			expect(result).toEqual([1, 2, 3]);
		});

		it('creates from existing AsyncLazyCollection', async () => {
			const original = collect.lazy([1, 2, 3]).throttle(0);
			const wrapped = collect.async(original);
			expect(await wrapped.all()).toEqual([1, 2, 3]);
		});

		it('creates from AsyncIterable object', async () => {
			const asyncIterable = {
				async *[Symbol.asyncIterator]() {
					yield 1;
					yield 2;
					yield 3;
				},
			};
			const result = await collect.async(asyncIterable).all();
			expect(result).toEqual([1, 2, 3]);
		});
	});

	describe('proxy auto-delegation', () => {
		it('delegates Collection methods asynchronously', async () => {
			// sum() is delegated to Collection
			const sum = await collect.async([1, 2, 3, 4]).sum();
			expect(sum).toBe(10);
		});

		it('returns non-function properties from delegated access', async () => {
			const alc = collect.async([1, 2, 3]);
			// Access a property that doesn't exist on AsyncLazyCollection
			// but resolves to a non-function value on the collected result
			// This tests the "return method" branch for non-function properties
			const result = await (alc as unknown as { nonExistentProp: () => Promise<unknown> }).nonExistentProp();
			expect(result).toBeUndefined();
		});

		it('delegates where() to Collection', async () => {
			const items = [
				{ name: 'a', active: true },
				{ name: 'b', active: false },
				{ name: 'c', active: true },
			];
			// Note: Delegated methods return Promises, so we need to await each step
			// or use collect() first and chain from there
			const filtered = await collect.async(items).where('active', true);
			const result = filtered.pluck('name').all();
			expect(result).toEqual(['a', 'c']);
		});

		it('delegates groupBy() to Collection', async () => {
			const items = [
				{ type: 'a', value: 1 },
				{ type: 'b', value: 2 },
				{ type: 'a', value: 3 },
			];
			const grouped = await collect.async(items).groupBy('type');
			expect(grouped.get('a')?.all()).toEqual([
				{ type: 'a', value: 1 },
				{ type: 'a', value: 3 },
			]);
		});
	});

	describe('trait methods', () => {
		it('tap() passes collection to callback and returns this', async () => {
			let tapped: AsyncLazyCollection<number> | null = null;
			const result = await collect
				.async([1, 2, 3])
				.tap((alc) => {
					tapped = alc;
				})
				.all();

			expect(result).toEqual([1, 2, 3]);
			expect(tapped).toBeInstanceOf(AsyncLazyCollection);
		});

		it('pipe() passes collection to callback and returns result', async () => {
			const result = collect.async([1, 2, 3]).pipe((alc) => alc.count());
			expect(await result).toBe(3);
		});

		it('when() applies callback if condition is truthy', async () => {
			const truthy = await collect
				.async([1, 2, 3])
				.when(true, (alc) => alc.map((x) => x * 2))
				.all();
			expect(truthy).toEqual([2, 4, 6]);

			const falsy = await collect
				.async([1, 2, 3])
				.when(false, (alc) => alc.map((x) => x * 2))
				.all();
			expect(falsy).toEqual([1, 2, 3]);
		});

		it('unless() applies callback if condition is falsy', async () => {
			const falsy = await collect
				.async([1, 2, 3])
				.unless(false, (alc) => alc.map((x) => x * 2))
				.all();
			expect(falsy).toEqual([2, 4, 6]);

			const truthy = await collect
				.async([1, 2, 3])
				.unless(true, (alc) => alc.map((x) => x * 2))
				.all();
			expect(truthy).toEqual([1, 2, 3]);
		});

		it('when() with callback condition', async () => {
			const result = await collect
				.async([1, 2, 3])
				.when(
					() => true,
					(alc) => alc.map((x) => x * 2),
				)
				.all();
			expect(result).toEqual([2, 4, 6]);
		});
	});

	describe('macro system', () => {
		afterEach(() => {
			AsyncLazyCollection.flushMacros();
		});

		it('registers and calls macros', async () => {
			AsyncLazyCollection.macro('double', function (this: AsyncLazyCollection<number>) {
				return this.map((x) => x * 2);
			});

			const result = await collect.async([1, 2, 3]).double().all();
			expect(result).toEqual([2, 4, 6]);
		});

		it('hasMacro returns correct state', () => {
			expect(AsyncLazyCollection.hasMacro('test')).toBe(false);
			AsyncLazyCollection.macro('test', () => {});
			expect(AsyncLazyCollection.hasMacro('test')).toBe(true);
		});

		it('getMacro returns the registered function', () => {
			const fn = () => 'test';
			AsyncLazyCollection.macro('myMacro', fn);
			expect(AsyncLazyCollection.getMacro('myMacro')).toBe(fn);
		});

		it('flushMacros clears all macros', () => {
			AsyncLazyCollection.macro('test1', () => {});
			AsyncLazyCollection.macro('test2', () => {});
			expect(AsyncLazyCollection.hasMacro('test1')).toBe(true);
			expect(AsyncLazyCollection.hasMacro('test2')).toBe(true);

			AsyncLazyCollection.flushMacros();
			expect(AsyncLazyCollection.hasMacro('test1')).toBe(false);
			expect(AsyncLazyCollection.hasMacro('test2')).toBe(false);
		});

		it('macro takes precedence over Collection delegation', async () => {
			// Define a macro with same name as a Collection method
			AsyncLazyCollection.macro('sum', function (this: AsyncLazyCollection<number>) {
				return Promise.resolve(999);
			});

			const result = await collect.async([1, 2, 3]).sum();
			expect(result).toBe(999); // Macro should override
		});
	});

	describe('method chaining', () => {
		it('chains map, filter, and take', async () => {
			const result = await collect
				.async([1, 2, 3, 4, 5])
				.map((x) => x * 2)
				.filter((x) => x > 4)
				.take(2)
				.all();

			expect(result).toEqual([6, 8]);
		});

		it('chains filter and skip', async () => {
			const result = await collect
				.async([1, 2, 3, 4, 5])
				.filter((x) => x > 2)
				.skip(1)
				.all();

			expect(result).toEqual([4, 5]);
		});

		it('chains with throttle', async () => {
			const result = await collect
				.async([1, 2, 3])
				.throttle(0)
				.map((x) => x * 10)
				.all();

			expect(result).toEqual([10, 20, 30]);
		});
	});
});

describe('Deferred consumption: collect(source).lazy()', () => {
	describe('array sources', () => {
		it('collect([...]).lazy() works', () => {
			const c = collect([1, 2, 3]);
			const lazy = c.lazy();
			expect(lazy.filter((x) => x > 1).all()).toEqual([2, 3]);
		});

		it('arrays can be used both eagerly and lazily', () => {
			const c = collect([1, 2, 3]);
			const lazy = c.lazy();
			expect(lazy.all()).toEqual([1, 2, 3]);
			expect(c.filter((x) => x > 1).all()).toEqual([2, 3]);
		});
	});

	describe('iterable sources', () => {
		it('collect(iterable) defers consumption until needed', () => {
			let consumed = false;
			const iterable = {
				*[Symbol.iterator]() {
					consumed = true;
					yield 1;
					yield 2;
					yield 3;
				},
			};

			const c = collect(iterable);
			expect(consumed).toBe(false);

			const values = c.all();
			expect(consumed).toBe(true);
			expect(values).toEqual([1, 2, 3]);
		});

		it('collect(iterable).lazy() transfers ownership', () => {
			let consumed = false;
			const iterable = {
				*[Symbol.iterator]() {
					consumed = true;
					yield 1;
					yield 2;
					yield 3;
				},
			};

			const c = collect(iterable);
			const lazy = c.lazy();
			expect(consumed).toBe(false);

			expect(lazy.all()).toEqual([1, 2, 3]);
			expect(consumed).toBe(true);
		});

		it('collect(iterable).filter() consumes eagerly', () => {
			let consumed = false;
			const iterable: Iterable<number> = {
				*[Symbol.iterator]() {
					consumed = true;
					yield 1;
					yield 2;
					yield 3;
				},
			};

			const c = collect(iterable);
			const filtered = c.filter((x) => x > 1);
			expect(consumed).toBe(true);
			expect(filtered.all()).toEqual([2, 3]);
		});
	});

	describe('generator function sources', () => {
		it('collect(() => generator).lazy() transfers ownership', () => {
			let count = 0;
			function* gen() {
				count++;
				yield 1;
				yield 2;
				yield 3;
			}

			const c = collect(() => gen());
			expect(count).toBe(0);

			const lazy = c.lazy();
			expect(count).toBe(0);

			expect(lazy.all()).toEqual([1, 2, 3]);
			expect(count).toBe(1);
		});

		it('collect(() => generator).all() consumes the generator', () => {
			let count = 0;
			function* gen() {
				count++;
				yield 1;
				yield 2;
				yield 3;
			}

			const c = collect(() => gen());
			expect(count).toBe(0);

			const values = c.all();
			expect(count).toBe(1);
			expect(values).toEqual([1, 2, 3]);
		});
	});

	describe('ownership transfer edge cases', () => {
		it('calling lazy() twice on generator-backed collection throws', () => {
			const c = collect(function* () {
				yield 1;
				yield 2;
			});
			c.lazy();
			expect(() => c.lazy()).toThrow('source was already consumed or transferred');
		});

		it('calling eager operation after lazy() on generator-backed collection throws', () => {
			const c = collect(function* () {
				yield 1;
				yield 2;
			});
			c.lazy();
			expect(() => c.filter((x) => x > 0)).toThrow('source was transferred to lazy()');
		});

		it('arrays allow both lazy() and eager operations', () => {
			const c = collect([1, 2, 3]);
			c.lazy();
			expect(c.filter((x) => x > 1).all()).toEqual([2, 3]);
		});
	});
});
