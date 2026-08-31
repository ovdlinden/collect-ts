import { describe, expect, it } from 'vitest';

export function createBehavioralTests(
	name: string,
	factory: (items: unknown[]) => unknown,
	extractAll: (c: unknown) => unknown[],
) {
	describe(`${name}: Shared Behavioral Contract`, () => {
		describe('Return Value Contract', () => {
			it('before() returns null when not found', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).before(99)).toBeNull();
			});

			it('before() returns previous item when found', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).before(2)).toBe(1);
			});

			it('after() returns null when not found', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).after(99)).toBeNull();
			});

			it('after() returns next item when found', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).after(2)).toBe(3);
			});

			it('pop() returns null on empty collection', () => {
				const c = factory([]);
				expect((c as any).pop()).toBeNull();
			});

			it('pop() returns last item on non-empty collection', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).pop()).toBe(3);
			});

			it('shift() returns null on empty collection', () => {
				const c = factory([]);
				expect((c as any).shift()).toBeNull();
			});

			it('shift() returns first item on non-empty collection', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).shift()).toBe(1);
			});

			it('percentage() returns null on empty collection', () => {
				const c = factory([]);
				expect((c as any).percentage((x: number) => x > 0)).toBeNull();
			});

			it('percentage() returns correct value on non-empty collection', () => {
				const c = factory([1, 2, 3, 4]);
				expect((c as any).percentage((x: number) => x > 2)).toBe(50);
			});
		});

		describe('Error Contract', () => {
			it('random() throws on empty collection', () => {
				const c = factory([]);
				expect(() => (c as any).random()).toThrow();
			});

			it('random() returns item on non-empty collection', () => {
				const c = factory([1, 2, 3]);
				const result = (c as any).random();
				expect([1, 2, 3]).toContain(result);
			});

			it('firstOrFail() throws when not found', () => {
				const c = factory([1, 2, 3]);
				expect(() => (c as any).firstOrFail((x: number) => x > 100)).toThrow();
			});

			it('firstOrFail() returns first matching item', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).firstOrFail((x: number) => x > 1)).toBe(2);
			});

			it('sole() throws when no items match', () => {
				const c = factory([1, 2, 3]);
				expect(() => (c as any).sole((x: number) => x > 100)).toThrow();
			});

			it('sole() throws when multiple items match', () => {
				const c = factory([1, 2, 3]);
				expect(() => (c as any).sole((x: number) => x > 1)).toThrow();
			});

			it('sole() returns the only matching item', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).sole((x: number) => x === 2)).toBe(2);
			});
		});

		describe('Value-or-Callback Contract', () => {
			it('reject() accepts value for comparison', () => {
				const c = factory([1, 2, 3, 2]);
				const result = extractAll((c as any).reject(2));
				expect(result).toEqual([1, 3]);
			});

			it('reject() accepts callback', () => {
				const c = factory([1, 2, 3]);
				const result = extractAll((c as any).reject((x: number) => x > 1));
				expect(result).toEqual([1]);
			});

			it('filter() without callback removes falsy values', () => {
				const c = factory([0, 1, false, 2, '', 3, null, undefined] as any[]);
				const result = extractAll((c as any).filter());
				expect(result).toEqual([1, 2, 3]);
			});

			it('filter() with callback filters by predicate', () => {
				const c = factory([1, 2, 3, 4]);
				const result = extractAll((c as any).filter((x: number) => x % 2 === 0));
				expect(result).toEqual([2, 4]);
			});

			it('first() without callback returns first item', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).first()).toBe(1);
			});

			it('first() with callback returns first matching item', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).first((x: number) => x > 1)).toBe(2);
			});

			it('last() without callback returns last item', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).last()).toBe(3);
			});

			it('last() with callback returns last matching item', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).last((x: number) => x < 3)).toBe(2);
			});
		});

		describe('Core Transformations', () => {
			it('map() transforms all items', () => {
				const c = factory([1, 2, 3]);
				const result = extractAll((c as any).map((x: number) => x * 2));
				expect(result).toEqual([2, 4, 6]);
			});

			it('flatMap() flattens result', () => {
				const c = factory([1, 2]);
				const result = extractAll((c as any).flatMap((x: number) => [x, x * 10]));
				expect(result).toEqual([1, 10, 2, 20]);
			});

			it('flatten() flattens nested arrays', () => {
				const c = factory([
					[1, 2],
					[3, [4, 5]],
				]);
				const result = extractAll((c as any).flatten(1));
				expect(result).toEqual([1, 2, 3, [4, 5]]);
			});

			it('flatten(Infinity) deeply flattens', () => {
				const c = factory([[1, [2, [3]]]]);
				const result = extractAll((c as any).flatten(Number.POSITIVE_INFINITY));
				expect(result).toEqual([1, 2, 3]);
			});

			it('chunk() splits into sized groups', () => {
				const c = factory([1, 2, 3, 4, 5]);
				const result = (c as any).chunk(2);
				expect(extractAll(result.get(0))).toEqual([1, 2]);
				expect(extractAll(result.get(1))).toEqual([3, 4]);
				expect(extractAll(result.get(2))).toEqual([5]);
			});

			it('take() returns first n items', () => {
				const c = factory([1, 2, 3, 4, 5]);
				const result = extractAll((c as any).take(3));
				expect(result).toEqual([1, 2, 3]);
			});

			it('take() with negative returns last n items', () => {
				const c = factory([1, 2, 3, 4, 5]);
				const result = extractAll((c as any).take(-2));
				expect(result).toEqual([4, 5]);
			});

			it('skip() returns items after n', () => {
				const c = factory([1, 2, 3, 4, 5]);
				const result = extractAll((c as any).skip(2));
				expect(result).toEqual([3, 4, 5]);
			});

			it('slice() returns range', () => {
				const c = factory([1, 2, 3, 4, 5]);
				const result = extractAll((c as any).slice(1, 3));
				expect(result).toEqual([2, 3, 4]);
			});

			it('unique() removes duplicates', () => {
				const c = factory([1, 2, 2, 3, 3, 3]);
				const result = extractAll((c as any).unique());
				expect(result).toEqual([1, 2, 3]);
			});

			it('reverse() reverses order', () => {
				const c = factory([1, 2, 3]);
				const result = extractAll((c as any).reverse());
				expect(result).toEqual([3, 2, 1]);
			});

			it('sort() sorts ascending by default', () => {
				const c = factory([3, 1, 2]);
				const result = extractAll((c as any).sort());
				expect(result).toEqual([1, 2, 3]);
			});

			it('sortDesc() sorts descending', () => {
				const c = factory([1, 3, 2]);
				const result = extractAll((c as any).sortDesc());
				expect(result).toEqual([3, 2, 1]);
			});
		});

		describe('Aggregations', () => {
			it('sum() adds numbers', () => {
				const c = factory([1, 2, 3, 4]);
				expect((c as any).sum()).toBe(10);
			});

			it('avg() calculates average', () => {
				const c = factory([1, 2, 3, 4]);
				expect((c as any).avg()).toBe(2.5);
			});

			it('min() returns minimum', () => {
				const c = factory([3, 1, 4, 1, 5]);
				expect((c as any).min()).toBe(1);
			});

			it('max() returns maximum', () => {
				const c = factory([3, 1, 4, 1, 5]);
				expect((c as any).max()).toBe(5);
			});

			it('count() returns length', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).count()).toBe(3);
			});

			it('isEmpty() returns true for empty collection', () => {
				const c = factory([]);
				expect((c as any).isEmpty()).toBe(true);
			});

			it('isEmpty() returns false for non-empty collection', () => {
				const c = factory([1]);
				expect((c as any).isEmpty()).toBe(false);
			});

			it('isNotEmpty() returns false for empty collection', () => {
				const c = factory([]);
				expect((c as any).isNotEmpty()).toBe(false);
			});

			it('isNotEmpty() returns true for non-empty collection', () => {
				const c = factory([1]);
				expect((c as any).isNotEmpty()).toBe(true);
			});

			it('contains() finds value', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).contains(2)).toBe(true);
				expect((c as any).contains(99)).toBe(false);
			});

			it('doesntContain() inverse of contains', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).doesntContain(2)).toBe(false);
				expect((c as any).doesntContain(99)).toBe(true);
			});

			it('every() returns true when all match', () => {
				const c = factory([2, 4, 6]);
				expect((c as any).every((x: number) => x % 2 === 0)).toBe(true);
			});

			it('every() returns false when any fails', () => {
				const c = factory([2, 3, 6]);
				expect((c as any).every((x: number) => x % 2 === 0)).toBe(false);
			});

			it('some() returns true when any matches', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).some((x: number) => x % 2 === 0)).toBe(true);
			});

			it('some() returns false when none match', () => {
				const c = factory([1, 3, 5]);
				expect((c as any).some((x: number) => x % 2 === 0)).toBe(false);
			});
		});

		describe('Search Operations', () => {
			it('search() finds index of value', () => {
				const c = factory(['a', 'b', 'c']);
				const result = (c as any).search('b');
				// ArrayCollection returns number (1), Collection returns string key ("1")
				expect(result === 1 || result === '1').toBe(true);
			});

			it('search() returns false when not found', () => {
				const c = factory(['a', 'b', 'c']);
				expect((c as any).search('z')).toBe(false);
			});

			it('search() with callback finds index', () => {
				const c = factory([1, 2, 3]);
				const result = (c as any).search((x: number) => x > 1);
				// ArrayCollection returns number (1), Collection returns string key ("1")
				expect(result === 1 || result === '1').toBe(true);
			});
		});

		describe('Combination Operations', () => {
			it('merge() combines collections', () => {
				const c = factory([1, 2]);
				const result = extractAll((c as any).merge([3, 4]));
				expect(result).toEqual([1, 2, 3, 4]);
			});

			it('concat() combines collections', () => {
				const c = factory([1, 2]);
				const result = extractAll((c as any).concat([3, 4]));
				expect(result).toEqual([1, 2, 3, 4]);
			});

			it('zip() pairs items', () => {
				const c = factory([1, 2, 3]);
				const result = (c as any).zip(['a', 'b', 'c']);
				// zip returns tuples - ArrayCollection returns [T, U] directly, Collection wraps in Collection
				const first = result.get(0);
				const firstArr = Array.isArray(first) ? first : first.all ? first.all() : first;
				expect(firstArr).toEqual([1, 'a']);
				const second = result.get(1);
				const secondArr = Array.isArray(second) ? second : second.all ? second.all() : second;
				expect(secondArr).toEqual([2, 'b']);
			});

			it('diff() returns items not in other', () => {
				const c = factory([1, 2, 3, 4]);
				const result = extractAll((c as any).diff([2, 4]));
				expect(result).toEqual([1, 3]);
			});

			it('intersect() returns shared items', () => {
				const c = factory([1, 2, 3, 4]);
				const result = extractAll((c as any).intersect([2, 3, 5]));
				expect(result).toEqual([2, 3]);
			});
		});

		describe('Output Operations', () => {
			it('all() returns array', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).all()).toEqual([1, 2, 3]);
			});

			it('toArray() returns array', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).toArray()).toEqual([1, 2, 3]);
			});

			it('toJson() returns JSON string', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).toJson()).toBe('[1,2,3]');
			});

			it('join() concatenates with separator', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).join(', ')).toBe('1, 2, 3');
			});

			it('implode() concatenates values', () => {
				const c = factory([1, 2, 3]);
				expect((c as any).implode('-')).toBe('1-2-3');
			});
		});

		describe('Iteration', () => {
			it('each() iterates all items', () => {
				const c = factory([1, 2, 3]);
				const results: number[] = [];
				(c as any).each((x: number) => results.push(x));
				expect(results).toEqual([1, 2, 3]);
			});

			it('tap() calls callback and returns self', () => {
				const c = factory([1, 2, 3]);
				let called = false;
				const result = (c as any).tap(() => {
					called = true;
				});
				expect(called).toBe(true);
				expect(extractAll(result)).toEqual([1, 2, 3]);
			});

			it('reduce() accumulates values', () => {
				const c = factory([1, 2, 3, 4]);
				const result = (c as any).reduce((acc: number, x: number) => acc + x, 0);
				expect(result).toBe(10);
			});
		});

		describe('Edge Cases', () => {
			it('handles empty collection', () => {
				const c = factory([]);
				expect((c as any).count()).toBe(0);
				expect((c as any).isEmpty()).toBe(true);
				expect((c as any).first()).toBeUndefined();
				expect((c as any).last()).toBeUndefined();
			});

			it('handles single item collection', () => {
				const c = factory([42]);
				expect((c as any).count()).toBe(1);
				expect((c as any).first()).toBe(42);
				expect((c as any).last()).toBe(42);
				expect((c as any).sum()).toBe(42);
			});

			it('handles null and undefined items', () => {
				const c = factory([null, undefined, 1]);
				expect((c as any).count()).toBe(3);
				expect((c as any).filter()).toEqual(factory([1]));
			});
		});
	});
}
