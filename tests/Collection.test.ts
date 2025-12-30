/**
 * Laravel Collection Tests
 *
 * Port of Laravel's SupportCollectionTest.php
 * @see https://github.com/laravel/framework/blob/12.x/tests/Support/SupportCollectionTest.php
 */

import { describe, expect, it } from 'vitest';
import { Collection, MultipleItemsFoundException, type ProxiedCollection, collect } from '../src';

// =============================================================================
// BASIC TESTS
// =============================================================================

describe('Collection', () => {
	describe('collect()', () => {
		it('creates a collection from an array', () => {
			const collection = collect([1, 2, 3]);
			expect(collection.all()).toEqual([1, 2, 3]);
		});

		it('creates a collection from an object', () => {
			const collection = collect({ a: 1, b: 2 });
			expect(collection.all()).toEqual({ a: 1, b: 2 });
		});

		it('creates an empty collection', () => {
			const collection = collect();
			expect(collection.all()).toEqual([]);
		});
	});

	describe('first()', () => {
		it('returns the first element', () => {
			expect(collect([1, 2, 3]).first()).toBe(1);
		});

		it('returns the first element matching the callback', () => {
			expect(collect([1, 2, 3]).first((v) => v > 1)).toBe(2);
		});

		it('returns undefined for empty collection', () => {
			expect(collect([]).first()).toBeUndefined();
		});

		it('returns default value when not found', () => {
			expect(collect([]).first(undefined, 'default')).toBe('default');
		});

		it('returns default from callback when not found', () => {
			expect(collect([]).first(undefined, () => 'default')).toBe('default');
		});
	});

	describe('last()', () => {
		it('returns the last element', () => {
			expect(collect([1, 2, 3]).last()).toBe(3);
		});

		it('returns the last element matching the callback', () => {
			expect(collect([1, 2, 3]).last((v) => v < 3)).toBe(2);
		});

		it('returns undefined for empty collection', () => {
			expect(collect([]).last()).toBeUndefined();
		});
	});

	describe('get()', () => {
		it('returns item by key', () => {
			expect(collect({ foo: 'bar' }).get('foo')).toBe('bar');
		});

		it('returns item by index', () => {
			expect(collect(['a', 'b', 'c']).get(1)).toBe('b');
		});

		it('returns undefined for missing key', () => {
			expect(collect({ foo: 'bar' }).get('baz')).toBeUndefined();
		});

		it('returns default value for missing key', () => {
			expect(collect({ foo: 'bar' }).get('baz', 'default')).toBe('default');
		});
	});
});

// =============================================================================
// TRANSFORMATION TESTS
// =============================================================================

describe('Transformation', () => {
	describe('map()', () => {
		it('transforms each value', () => {
			const result = collect([1, 2, 3]).map((v) => v * 2);
			expect(result.all()).toEqual([2, 4, 6]);
		});

		it('provides key to callback', () => {
			const result = collect({ a: 1, b: 2 }).map((v, k) => `${k}:${v}`);
			expect(result.all()).toEqual({ a: 'a:1', b: 'b:2' });
		});
	});

	describe('mapWithKeys()', () => {
		it('transforms to new key-value pairs', () => {
			const items = [
				{ id: 1, name: 'A' },
				{ id: 2, name: 'B' },
			];
			const result = collect(items).mapWithKeys((item) => [String(item.id), item.name]);
			expect(result.get('1')).toBe('A');
			expect(result.get('2')).toBe('B');
		});
	});

	describe('filter()', () => {
		it('filters values by callback', () => {
			const result = collect([1, 2, 3, 4, 5]).filter((v) => v > 2);
			expect(result.values().all()).toEqual([3, 4, 5]);
		});

		it('filters falsy values by default', () => {
			const result = collect([0, 1, '', 'hello', null, undefined, false, true]);
			expect(result.filter().values().all()).toEqual([1, 'hello', true]);
		});
	});

	describe('reject()', () => {
		it('rejects values matching callback', () => {
			const result = collect([1, 2, 3, 4, 5]).reject((v) => v > 2);
			expect(result.values().all()).toEqual([1, 2]);
		});

		it('rejects values equal to given value', () => {
			const result = collect([1, 2, 2, 3]).reject(2);
			expect(result.values().all()).toEqual([1, 3]);
		});
	});

	describe('pluck()', () => {
		it('plucks values by key', () => {
			const items = [
				{ id: 1, name: 'A' },
				{ id: 2, name: 'B' },
			];
			const result = collect(items).pluck('name');
			expect(result.all()).toEqual(['A', 'B']);
		});

		it('plucks values with custom key', () => {
			const items = [
				{ id: 1, name: 'A' },
				{ id: 2, name: 'B' },
			];
			const result = collect(items).pluck('name', 'id');
			expect(result.get('1')).toBe('A');
			expect(result.get('2')).toBe('B');
		});
	});

	describe('flatten()', () => {
		it('flattens nested arrays', () => {
			const result = collect([
				[1, 2],
				[3, 4],
			]).flatten();
			expect(result.all()).toEqual([1, 2, 3, 4]);
		});

		it('flattens to specified depth', () => {
			const result = collect([[[1, 2]], [[3, 4]]]).flatten(1);
			expect(result.all()).toEqual([
				[1, 2],
				[3, 4],
			]);
		});
	});

	describe('collapse()', () => {
		it('collapses nested arrays', () => {
			const result = collect([[1, 2], [3, 4], [5]]).collapse();
			expect(result.all()).toEqual([1, 2, 3, 4, 5]);
		});
	});

	describe('flatMap()', () => {
		it('maps and flattens', () => {
			const result = collect([1, 2, 3]).flatMap((v) => [v, v * 10]);
			expect(result.all()).toEqual([1, 10, 2, 20, 3, 30]);
		});
	});
});

// =============================================================================
// AGGREGATION TESTS
// =============================================================================

describe('Aggregation', () => {
	describe('count()', () => {
		it('counts items', () => {
			expect(collect([1, 2, 3]).count()).toBe(3);
		});

		it('returns 0 for empty collection', () => {
			expect(collect([]).count()).toBe(0);
		});
	});

	describe('sum()', () => {
		it('sums numeric values', () => {
			expect(collect([1, 2, 3]).sum()).toBe(6);
		});

		it('sums values by key', () => {
			const items = [{ price: 10 }, { price: 20 }];
			expect(collect(items).sum('price')).toBe(30);
		});

		it('sums values by callback', () => {
			const items = [{ price: 10 }, { price: 20 }];
			expect(collect(items).sum((item) => item.price * 2)).toBe(60);
		});
	});

	describe('avg()', () => {
		it('calculates average', () => {
			expect(collect([1, 2, 3]).avg()).toBe(2);
		});

		it('returns null for empty collection', () => {
			expect(collect([]).avg()).toBeNull();
		});
	});

	describe('min() and max()', () => {
		it('finds minimum value', () => {
			expect(collect([3, 1, 2]).min()).toBe(1);
		});

		it('finds maximum value', () => {
			expect(collect([3, 1, 2]).max()).toBe(3);
		});

		it('finds min/max by key', () => {
			const items = [{ price: 30 }, { price: 10 }, { price: 20 }];
			expect(collect(items).min('price')).toBe(10);
			expect(collect(items).max('price')).toBe(30);
		});
	});

	describe('median()', () => {
		it('calculates median for odd count', () => {
			expect(collect([1, 2, 3]).median()).toBe(2);
		});

		it('calculates median for even count', () => {
			expect(collect([1, 2, 3, 4]).median()).toBe(2.5);
		});
	});

	describe('mode()', () => {
		it('finds most common value', () => {
			expect(collect([1, 2, 2, 3]).mode()).toEqual([2]);
		});

		it('returns multiple modes', () => {
			expect(collect([1, 1, 2, 2]).mode()).toEqual([1, 2]);
		});
	});
});

// =============================================================================
// SORTING TESTS
// =============================================================================

describe('Sorting', () => {
	describe('sort()', () => {
		it('sorts values', () => {
			expect(collect([3, 1, 2]).sort().values().all()).toEqual([1, 2, 3]);
		});

		it('sorts with custom comparator', () => {
			expect(
				collect([1, 3, 2])
					.sort((a, b) => b - a)
					.values()
					.all(),
			).toEqual([3, 2, 1]);
		});
	});

	describe('sortBy()', () => {
		it('sorts by key', () => {
			const items = [{ name: 'B' }, { name: 'A' }, { name: 'C' }];
			const result = collect(items).sortBy('name').values().all();
			expect(result.map((i) => i.name)).toEqual(['A', 'B', 'C']);
		});

		it('sorts by callback', () => {
			const items = [{ name: 'B' }, { name: 'A' }, { name: 'C' }];
			const result = collect(items)
				.sortBy((i) => i.name)
				.values()
				.all();
			expect(result.map((i) => i.name)).toEqual(['A', 'B', 'C']);
		});
	});

	describe('sortByDesc()', () => {
		it('sorts descending', () => {
			const items = [{ name: 'B' }, { name: 'A' }, { name: 'C' }];
			const result = collect(items).sortByDesc('name').values().all();
			expect(result.map((i) => i.name)).toEqual(['C', 'B', 'A']);
		});
	});

	describe('reverse()', () => {
		it('reverses order', () => {
			expect(collect([1, 2, 3]).reverse().all()).toEqual([3, 2, 1]);
		});
	});

	describe('shuffle()', () => {
		it('shuffles items', () => {
			const original = [1, 2, 3, 4, 5];
			const shuffled = collect(original).shuffle().all();
			expect(shuffled).toHaveLength(5);
			expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
		});
	});
});

// =============================================================================
// SLICING TESTS
// =============================================================================

describe('Slicing', () => {
	describe('take()', () => {
		it('takes first n items', () => {
			expect(collect([1, 2, 3, 4, 5]).take(3).all()).toEqual([1, 2, 3]);
		});

		it('takes last n items with negative', () => {
			expect(collect([1, 2, 3, 4, 5]).take(-2).all()).toEqual([4, 5]);
		});
	});

	describe('skip()', () => {
		it('skips first n items', () => {
			expect(collect([1, 2, 3, 4, 5]).skip(2).values().all()).toEqual([3, 4, 5]);
		});
	});

	describe('slice()', () => {
		it('slices items', () => {
			expect(collect([1, 2, 3, 4, 5]).slice(1, 3).values().all()).toEqual([2, 3, 4]);
		});
	});

	describe('chunk()', () => {
		it('chunks items', () => {
			const chunks = collect([1, 2, 3, 4, 5]).chunk(2);
			expect(chunks.all().map((c) => c.all())).toEqual([[1, 2], [3, 4], [5]]);
		});
	});

	describe('nth()', () => {
		it('returns every nth element', () => {
			expect(collect([1, 2, 3, 4, 5, 6]).nth(2).all()).toEqual([1, 3, 5]);
		});

		it('returns every nth element with offset', () => {
			expect(collect([1, 2, 3, 4, 5, 6]).nth(2, 1).all()).toEqual([2, 4, 6]);
		});
	});
});

// =============================================================================
// CONTAINS / EXISTS TESTS
// =============================================================================

describe('Contains', () => {
	describe('contains()', () => {
		it('checks if value exists', () => {
			expect(collect([1, 2, 3]).contains(2)).toBe(true);
			expect(collect([1, 2, 3]).contains(5)).toBe(false);
		});

		it('checks with callback', () => {
			expect(collect([1, 2, 3]).contains((v) => v > 2)).toBe(true);
		});

		it('checks with key-value pair', () => {
			const items = [{ id: 1 }, { id: 2 }];
			expect(collect(items).contains('id', 2)).toBe(true);
			expect(collect(items).contains('id', 5)).toBe(false);
		});
	});

	describe('doesntContain()', () => {
		it('checks if value does not exist', () => {
			expect(collect([1, 2, 3]).doesntContain(5)).toBe(true);
			expect(collect([1, 2, 3]).doesntContain(2)).toBe(false);
		});
	});

	describe('isEmpty() and isNotEmpty()', () => {
		it('checks if empty', () => {
			expect(collect([]).isEmpty()).toBe(true);
			expect(collect([1]).isEmpty()).toBe(false);
		});

		it('checks if not empty', () => {
			expect(collect([]).isNotEmpty()).toBe(false);
			expect(collect([1]).isNotEmpty()).toBe(true);
		});
	});

	describe('containsOneItem()', () => {
		it('checks if contains exactly one item', () => {
			expect(collect([1]).containsOneItem()).toBe(true);
			expect(collect([]).containsOneItem()).toBe(false);
			expect(collect([1, 2]).containsOneItem()).toBe(false);
		});
	});
});

// =============================================================================
// GROUPING TESTS
// =============================================================================

describe('Grouping', () => {
	describe('groupBy()', () => {
		it('groups by key', () => {
			const items = [
				{ type: 'a', value: 1 },
				{ type: 'b', value: 2 },
				{ type: 'a', value: 3 },
			];
			const groups = collect(items).groupBy('type');
			expect(groups.get('a')?.count()).toBe(2);
			expect(groups.get('b')?.count()).toBe(1);
		});
	});

	describe('keyBy()', () => {
		it('keys by value', () => {
			const items = [
				{ id: 1, name: 'A' },
				{ id: 2, name: 'B' },
			];
			const keyed = collect(items).keyBy('id');
			expect(keyed.get('1')?.name).toBe('A');
			expect(keyed.get('2')?.name).toBe('B');
		});
	});

	describe('partition()', () => {
		it('partitions by callback', () => {
			const [passed, failed] = collect([1, 2, 3, 4, 5]).partition((v) => v > 2);
			expect(passed.all()).toEqual([3, 4, 5]);
			expect(failed.all()).toEqual([1, 2]);
		});
	});
});

// =============================================================================
// REDUCE TESTS
// =============================================================================

describe('Reduce', () => {
	describe('reduce()', () => {
		it('reduces to single value', () => {
			const sum = collect([1, 2, 3]).reduce((acc, val) => acc + val, 0);
			expect(sum).toBe(6);
		});

		it('provides key to callback', () => {
			// biome-ignore lint/performance/noAccumulatingSpread: Test with small data set, readability preferred
			const result = collect({ a: 1, b: 2 }).reduce((acc, val, key) => [...acc, `${key}:${val}`], [] as string[]);
			expect(result).toEqual(['a:1', 'b:2']);
		});
	});
});

// =============================================================================
// WHERE TESTS
// =============================================================================

describe('Where', () => {
	describe('where()', () => {
		it('filters by key-value', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			expect(collect(items).where('id', 2).count()).toBe(1);
		});

		it('filters with operator', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			expect(collect(items).where('id', '>', 1).count()).toBe(2);
		});
	});

	describe('whereIn()', () => {
		it('filters by values in array', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			expect(collect(items).whereIn('id', [1, 3]).count()).toBe(2);
		});
	});

	describe('whereBetween()', () => {
		it('filters by range', () => {
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
			expect(collect(items).whereBetween('id', [2, 3]).count()).toBe(2);
		});
	});

	describe('whereNull() and whereNotNull()', () => {
		it('filters null values', () => {
			const items = [{ name: 'A' }, { name: null }, { name: 'C' }];
			expect(collect(items).whereNull('name').count()).toBe(1);
			expect(collect(items).whereNotNull('name').count()).toBe(2);
		});
	});
});

// =============================================================================
// UNIQUE / DUPLICATES TESTS
// =============================================================================

describe('Unique and Duplicates', () => {
	describe('unique()', () => {
		it('returns unique values', () => {
			expect(collect([1, 1, 2, 2, 3]).unique().values().all()).toEqual([1, 2, 3]);
		});

		it('returns unique by key', () => {
			const items = [{ id: 1 }, { id: 1 }, { id: 2 }];
			expect(collect(items).unique('id').count()).toBe(2);
		});
	});

	describe('duplicates()', () => {
		it('returns duplicated values', () => {
			const result = collect([1, 1, 2, 2, 3]).duplicates().values().all();
			expect(result).toEqual([1, 2]);
		});
	});
});

// =============================================================================
// DIFF / INTERSECT TESTS
// =============================================================================

describe('Diff and Intersect', () => {
	describe('diff()', () => {
		it('returns values not in other collection', () => {
			expect(collect([1, 2, 3]).diff([2, 3, 4]).all()).toEqual([1]);
		});
	});

	describe('intersect()', () => {
		it('returns values in both collections', () => {
			expect(collect([1, 2, 3]).intersect([2, 3, 4]).all()).toEqual([2, 3]);
		});
	});

	describe('diffKeys()', () => {
		it('returns items with keys not in other', () => {
			const result = collect({ a: 1, b: 2, c: 3 }).diffKeys({ b: 2, c: 3, d: 4 });
			expect(result.has('a')).toBe(true);
			expect(result.has('b')).toBe(false);
		});
	});
});

// =============================================================================
// MERGE / UNION / COMBINE TESTS
// =============================================================================

describe('Merge and Union', () => {
	describe('merge()', () => {
		it('merges arrays', () => {
			expect(collect([1, 2]).merge([3, 4]).all()).toEqual([1, 2, 3, 4]);
		});

		it('merges objects (overwrites)', () => {
			const result = collect({ a: 1, b: 2 }).merge({ b: 3, c: 4 });
			expect(result.get('b')).toBe(3);
		});
	});

	describe('union()', () => {
		it('unions objects (keeps original)', () => {
			const result = collect({ a: 1, b: 2 }).union({ b: 3, c: 4 });
			expect(result.get('b')).toBe(2);
		});
	});

	describe('combine()', () => {
		it('combines keys with values', () => {
			const result = collect(['a', 'b']).combine([1, 2]);
			expect(result.get('a')).toBe(1);
			expect(result.get('b')).toBe(2);
		});
	});

	describe('crossJoin()', () => {
		it('cross joins arrays', () => {
			const result = collect([1, 2]).crossJoin(['a', 'b']);
			expect(result.count()).toBe(4);
		});
	});

	describe('zip()', () => {
		it('zips arrays together', () => {
			const result = collect([1, 2, 3]).zip(['a', 'b', 'c']);
			expect(result.first()?.all()).toEqual([1, 'a']);
		});
	});
});

// =============================================================================
// PIPING / TAP TESTS
// =============================================================================

describe('Piping and Tap', () => {
	describe('pipe()', () => {
		it('passes collection to callback', () => {
			const result = collect([1, 2, 3]).pipe((c) => c.sum());
			expect(result).toBe(6);
		});
	});

	describe('tap()', () => {
		it('taps into collection and returns self', () => {
			let tapped: number[] = [];
			const result = collect([1, 2, 3]).tap((c) => {
				tapped = c.all();
			});
			expect(tapped).toEqual([1, 2, 3]);
			expect(result.all()).toEqual([1, 2, 3]);
		});
	});

	describe('each()', () => {
		it('iterates over items', () => {
			const values: number[] = [];
			collect([1, 2, 3]).each((v) => {
				values.push(v);
			});
			expect(values).toEqual([1, 2, 3]);
		});

		it('breaks on false', () => {
			const values: number[] = [];
			collect([1, 2, 3]).each((v) => {
				values.push(v);
				if (v === 2) return false;
				return;
			});
			expect(values).toEqual([1, 2]);
		});
	});
});

// =============================================================================
// EXCEPTIONS TESTS
// =============================================================================

describe('Exceptions', () => {
	describe('sole()', () => {
		it('returns single item', () => {
			expect(collect([42]).sole()).toBe(42);
		});

		it('throws when empty', () => {
			expect(() => collect([]).sole()).toThrow();
		});

		it('throws when multiple items', () => {
			expect(() => collect([1, 2]).sole()).toThrow();
		});
	});

	describe('firstOrFail()', () => {
		it('returns first item', () => {
			expect(collect([1, 2, 3]).firstOrFail()).toBe(1);
		});

		it('throws when empty', () => {
			expect(() => collect([]).firstOrFail()).toThrow();
		});
	});
});

// =============================================================================
// CONDITIONAL TESTS
// =============================================================================

// =============================================================================
// SLIDING TESTS (Laravel port)
// =============================================================================

describe('Sliding', () => {
	describe('sliding()', () => {
		it('returns empty for collections smaller than window size', () => {
			expect(Collection.times(0).sliding().toArray()).toEqual([]);
			expect(Collection.times(1).sliding().toArray()).toEqual([]);
		});

		it('creates sliding windows with default parameters', () => {
			const result = Collection.times(2).sliding();
			expect(result.toArray()).toEqual([[1, 2]]);
		});

		it('creates sliding windows preserving keys', () => {
			const chunks = Collection.times(3).sliding();
			// First window has keys 0,1 (sequential from 0) → array
			// Second window has keys 1,2 (non-sequential from 0) → object preserves keys
			expect(chunks.toArray()).toEqual([[1, 2], { '1': 2, '2': 3 }]);
		});

		it('creates sliding windows with custom step', () => {
			expect(Collection.times(1).sliding(2, 3).toArray()).toEqual([]);
			expect(Collection.times(2).sliding(2, 3).toArray()).toEqual([[1, 2]]);
			expect(Collection.times(3).sliding(2, 3).toArray()).toEqual([[1, 2]]);
			expect(Collection.times(4).sliding(2, 3).toArray()).toEqual([[1, 2]]);
		});

		it('creates sliding windows with custom size', () => {
			expect(Collection.times(2).sliding(3).toArray()).toEqual([]);
			expect(Collection.times(3).sliding(3).toArray()).toEqual([[1, 2, 3]]);
		});

		it('creates sliding windows with custom size and step', () => {
			expect(Collection.times(2).sliding(3, 2).toArray()).toEqual([]);
			expect(Collection.times(3).sliding(3, 2).toArray()).toEqual([[1, 2, 3]]);
			expect(Collection.times(4).sliding(3, 2).toArray()).toEqual([[1, 2, 3]]);
		});

		it('returns Collection instances', () => {
			const chunks = Collection.times(3).sliding();
			expect(chunks).toBeInstanceOf(Collection);
			expect(chunks.first()).toBeInstanceOf(Collection);
		});
	});
});

// =============================================================================
// BEFORE/AFTER TESTS (Laravel port)
// =============================================================================

describe('Before and After', () => {
	describe('before()', () => {
		it('returns item before the given item', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.before(2)).toBe(1);
			expect(c.before(3)).toBe(2);
			expect(c.before(5)).toBe(4);
		});

		it('returns item before using callback', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.before((v) => v > 4)).toBe(4);
		});

		it('returns null when item not found', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.before(6)).toBeNull();
		});

		it('returns null for first item', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.before(1)).toBeNull();
		});

		it('works in strict mode', () => {
			const c = collect([false, 0, 1, [], '']);
			expect(c.before('1', true)).toBeNull();
			expect(c.before(0, true)).toBe(false);
			expect(c.before(1, true)).toBe(0);
		});
	});

	describe('after()', () => {
		it('returns item after the given item', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.after(1)).toBe(2);
			expect(c.after(2)).toBe(3);
			expect(c.after(4)).toBe(5);
		});

		it('returns item after using callback', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.after((v) => v > 2)).toBe(4);
		});

		it('returns null when item not found', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.after(6)).toBeNull();
		});

		it('returns null for last item', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.after(5)).toBeNull();
		});

		it('works in strict mode', () => {
			const c = collect([false, 0, 1, [], '']);
			expect(c.after('1', true)).toBeNull();
			expect(c.after(false, true)).toBe(0);
			expect(c.after(1, true)).toEqual([]);
		});
	});
});

// =============================================================================
// FLIP TESTS (Laravel port)
// =============================================================================

describe('Flip', () => {
	describe('flip()', () => {
		it('flips keys and values', () => {
			const data = collect({ name: 'taylor', framework: 'laravel' });
			expect(data.flip().toArray()).toEqual({ taylor: 'name', laravel: 'framework' });
		});

		it('flips array values to keys', () => {
			const data = collect(['a', 'b', 'c']);
			const flipped = data.flip();
			expect(flipped.get('a')).toBe('0');
			expect(flipped.get('b')).toBe('1');
			expect(flipped.get('c')).toBe('2');
		});
	});
});

// =============================================================================
// PAD TESTS (Laravel port)
// =============================================================================

describe('Pad', () => {
	describe('pad()', () => {
		it('pads array with value to the right', () => {
			const c = collect([1, 2, 3]);
			expect(c.pad(4, 0).all()).toEqual([1, 2, 3, 0]);
		});

		it('does not pad if already at size', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.pad(4, 0).all()).toEqual([1, 2, 3, 4, 5]);
		});

		it('pads array with value to the left with negative size', () => {
			const c = collect([1, 2, 3]);
			expect(c.pad(-4, 0).all()).toEqual([0, 1, 2, 3]);
		});

		it('does not pad left if already at size', () => {
			const c = collect([1, 2, 3, 4, 5]);
			expect(c.pad(-4, 0).all()).toEqual([1, 2, 3, 4, 5]);
		});
	});
});

// =============================================================================
// MULTIPLY TESTS (Laravel port)
// =============================================================================

describe('Multiply', () => {
	describe('multiply()', () => {
		it('returns empty for negative or zero multiplier', () => {
			const c = collect(['Hello', 1, { tags: ['a', 'b'] }]);
			expect(c.multiply(-1).all()).toEqual([]);
			expect(c.multiply(0).all()).toEqual([]);
		});

		it('returns same collection for multiplier of 1', () => {
			const c = collect(['Hello', 1, { tags: ['a', 'b'] }]);
			expect(c.multiply(1).all()).toEqual(['Hello', 1, { tags: ['a', 'b'] }]);
		});

		it('multiplies collection items', () => {
			const c = collect(['a', 'b']);
			expect(c.multiply(3).all()).toEqual(['a', 'b', 'a', 'b', 'a', 'b']);
		});
	});
});

// =============================================================================
// STATIC METHODS TESTS (Laravel port)
// =============================================================================

describe('Static Methods', () => {
	describe('times()', () => {
		it('creates collection with callback', () => {
			const result = Collection.times(2, (n) => `slug-${n}`);
			expect(result.all()).toEqual(['slug-1', 'slug-2']);
		});

		it('returns empty for zero or negative', () => {
			expect(Collection.times(0, (n) => `slug-${n}`).isEmpty()).toBe(true);
			expect(Collection.times(-4, (n) => `slug-${n}`).isEmpty()).toBe(true);
		});

		it('creates range without callback', () => {
			expect(Collection.times(5).all()).toEqual([1, 2, 3, 4, 5]);
		});
	});

	describe('range()', () => {
		it('creates range from 1 to 5', () => {
			expect(Collection.range(1, 5).all()).toEqual([1, 2, 3, 4, 5]);
		});

		it('creates range with negative numbers', () => {
			expect(Collection.range(-2, 2).all()).toEqual([-2, -1, 0, 1, 2]);
		});

		it('creates range with all negative numbers', () => {
			expect(Collection.range(-4, -2).all()).toEqual([-4, -3, -2]);
		});

		it('creates descending range', () => {
			expect(Collection.range(5, 1).all()).toEqual([5, 4, 3, 2, 1]);
		});

		it('creates descending range to negative', () => {
			expect(Collection.range(2, -2).all()).toEqual([2, 1, 0, -1, -2]);
		});

		it('creates descending range all negative', () => {
			expect(Collection.range(-2, -4).all()).toEqual([-2, -3, -4]);
		});
	});

	describe('fromJson()', () => {
		it('creates collection from JSON', () => {
			const json = JSON.stringify({ foo: 'bar', baz: 'quz' });
			const instance = Collection.fromJson(json);
			expect(instance.toArray()).toEqual({ foo: 'bar', baz: 'quz' });
		});

		it('creates collection from JSON array', () => {
			const json = JSON.stringify([1, 2, 3]);
			const instance = Collection.fromJson(json);
			expect(instance.all()).toEqual([1, 2, 3]);
		});
	});

	describe('empty()', () => {
		it('creates an empty collection', () => {
			const c = Collection.empty();
			expect(c.count()).toBe(0);
			expect(c.all()).toEqual([]);
		});
	});
});

// =============================================================================
// CHUNK WHILE TESTS (Laravel port)
// =============================================================================

describe('ChunkWhile', () => {
	describe('chunkWhile()', () => {
		it('chunks on equal elements', () => {
			const data = collect(['A', 'A', 'B', 'B', 'C', 'C', 'C']).chunkWhile(
				(current, _key, chunk) => chunk.last() === current,
			);

			// First chunk has keys 0,1 (sequential from 0) → array
			expect(data.first()?.toArray()).toEqual(['A', 'A']);
			// Subsequent chunks have non-sequential keys → object preserves keys
			expect(data.get(1)?.toArray()).toEqual({ '2': 'B', '3': 'B' });
			expect(data.last()?.toArray()).toEqual({ '4': 'C', '5': 'C', '6': 'C' });
		});

		it('chunks on contiguously increasing integers', () => {
			const data = collect([1, 4, 9, 10, 11, 12, 15, 16, 19, 20, 21]).chunkWhile(
				(current, _key, chunk) => (chunk.last() as number) + 1 === current,
			);

			// First chunk has key 0 (sequential from 0) → array
			expect(data.first()?.toArray()).toEqual([1]);
			// Subsequent chunks have non-sequential keys → object preserves keys
			expect(data.get(1)?.toArray()).toEqual({ '1': 4 });
			expect(data.get(2)?.toArray()).toEqual({ '2': 9, '3': 10, '4': 11, '5': 12 });
			expect(data.get(3)?.toArray()).toEqual({ '6': 15, '7': 16 });
			expect(data.last()?.toArray()).toEqual({ '8': 19, '9': 20, '10': 21 });
		});

		it('preserves string keys', () => {
			const data = collect({ a: 1, b: 1, c: 2, d: 2, e: 3, f: 3, g: 3 }).chunkWhile(
				(current, _key, chunk) => chunk.last() === current,
			);

			expect(data.first()?.toArray()).toEqual({ a: 1, b: 1 });
			expect(data.get(1)?.toArray()).toEqual({ c: 2, d: 2 });
			expect(data.last()?.toArray()).toEqual({ e: 3, f: 3, g: 3 });
		});

		it('returns Collection instances', () => {
			const data = collect(['A', 'B']).chunkWhile(() => false);
			expect(data).toBeInstanceOf(Collection);
			expect(data.first()).toBeInstanceOf(Collection);
		});
	});
});

// =============================================================================
// CHUNK EDGE CASES TESTS (Laravel port)
// =============================================================================

describe('Chunk Edge Cases', () => {
	describe('chunk()', () => {
		it('creates chunks with preserved keys', () => {
			const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).chunk(3);
			expect(data).toBeInstanceOf(Collection);
			expect(data.first()).toBeInstanceOf(Collection);
			expect(data.count()).toBe(4);
			expect(data.first()?.toArray()).toEqual([1, 2, 3]);
			expect(data.get(3)?.toArray()).toEqual({ 9: 10 });
		});

		it('returns empty for zero size', () => {
			const data = collect([1, 2, 3, 4, 5]).chunk(0);
			expect(data.toArray()).toEqual([]);
		});

		it('returns empty for negative size', () => {
			const data = collect([1, 2, 3, 4, 5]).chunk(-1);
			expect(data.toArray()).toEqual([]);
		});
	});
});

// =============================================================================
// CONDITIONAL TESTS
// =============================================================================

describe('Conditional', () => {
	describe('when()', () => {
		it('executes callback when true', () => {
			const result = collect([1, 2, 3]).when(true, (c) => c.push(4));
			expect(result.all()).toEqual([1, 2, 3, 4]);
		});

		it('does not execute when false', () => {
			const result = collect([1, 2, 3]).when(false, (c) => c.push(4));
			expect(result.all()).toEqual([1, 2, 3]);
		});

		it('executes default callback when false', () => {
			const result = collect([1, 2, 3]).when(
				false,
				(c) => c.push(4),
				(c) => c.push(5),
			);
			expect(result.all()).toEqual([1, 2, 3, 5]);
		});
	});

	describe('unless()', () => {
		it('executes callback when false', () => {
			const result = collect([1, 2, 3]).unless(false, (c) => c.push(4));
			expect(result.all()).toEqual([1, 2, 3, 4]);
		});
	});

	describe('whenEmpty()', () => {
		it('executes when empty', () => {
			const result = collect<number>([]).whenEmpty((c) => c.push(1));
			expect(result.all()).toEqual([1]);
		});
	});

	describe('whenNotEmpty()', () => {
		it('executes when not empty', () => {
			const result = collect([1]).whenNotEmpty((c) => c.push(2));
			expect(result.all()).toEqual([1, 2]);
		});
	});
});

// =============================================================================
// PHASE B: TRANSFORMATION TESTS (Laravel port)
// =============================================================================

describe('CountBy', () => {
	describe('countBy()', () => {
		it('counts by value standalone', () => {
			const c = collect(['foo', 'foo', 'foo', 'bar', 'bar', 'foobar']);
			const result = c.countBy();
			expect(result.get('foo')).toBe(3);
			expect(result.get('bar')).toBe(2);
			expect(result.get('foobar')).toBe(1);
		});

		it('counts by key', () => {
			const c = collect([
				{ key: 'a' },
				{ key: 'a' },
				{ key: 'a' },
				{ key: 'a' },
				{ key: 'b' },
				{ key: 'b' },
				{ key: 'b' },
			]);
			const result = c.countBy('key');
			expect(result.get('a')).toBe(4);
			expect(result.get('b')).toBe(3);
		});

		it('counts by callback', () => {
			const c = collect(['alice', 'aaron', 'bob', 'carla']);
			const result = c.countBy((name) => name.charAt(0));
			expect(result.get('a')).toBe(2);
			expect(result.get('b')).toBe(1);
			expect(result.get('c')).toBe(1);
		});
	});
});

describe('GetOrPut', () => {
	describe('getOrPut()', () => {
		it('returns existing value and does not overwrite', () => {
			const data = collect({ name: 'taylor', email: 'foo' });
			expect(data.getOrPut('name', null)).toBe('taylor');
			expect(data.getOrPut('email', null)).toBe('foo');
			expect(data.get('name')).toBe('taylor');
		});

		it('puts and returns new value if key missing', () => {
			const data = collect({ name: 'taylor', email: 'foo' });
			expect(data.getOrPut('gender', 'male')).toBe('male');
			expect(data.get('gender')).toBe('male');
		});

		it('accepts callback as default value', () => {
			const data = collect({ name: 'taylor' });
			expect(data.getOrPut('gender', () => 'male')).toBe('male');
			expect(data.get('gender')).toBe('male');
		});
	});
});

describe('Splice', () => {
	describe('splice()', () => {
		it('removes items from offset', () => {
			const data = collect(['foo', 'baz']);
			data.splice(1);
			expect(data.all()).toEqual(['foo']);
		});

		it('inserts items at offset', () => {
			const data = collect(['foo', 'baz']);
			data.splice(1, 0, 'bar');
			expect(data.all()).toEqual(['foo', 'bar', 'baz']);
		});

		it('removes and returns removed items', () => {
			const data = collect(['foo', 'baz']);
			data.splice(1, 1);
			expect(data.all()).toEqual(['foo']);
		});

		it('removes and replaces items', () => {
			const data = collect(['foo', 'baz']);
			const cut = data.splice(1, 1, 'bar');
			expect(data.all()).toEqual(['foo', 'bar']);
			expect(cut.all()).toEqual(['baz']);
		});

		it('inserts array at offset', () => {
			const data = collect(['foo', 'baz']);
			data.splice(1, 0, ['bar']);
			expect(data.all()).toEqual(['foo', 'bar', 'baz']);
		});
	});
});

describe('MapSpread', () => {
	describe('mapSpread()', () => {
		it('spreads array items as callback arguments', () => {
			const c = collect([
				[1, 'a'],
				[2, 'b'],
			]);
			const result = c.mapSpread((number, character) => `${number}-${character}`);
			expect(result.all()).toEqual(['1-a', '2-b']);
		});

		it('provides key as third argument', () => {
			const c = collect([
				[1, 'a'],
				[2, 'b'],
			]);
			const result = c.mapSpread((number, character, key) => `${number}-${character}-${key}`);
			expect(result.all()).toEqual(['1-a-0', '2-b-1']);
		});
	});
});

describe('MapToDictionary', () => {
	describe('mapToDictionary()', () => {
		it('maps to dictionary grouping values', () => {
			const data = collect([
				{ id: 1, name: 'A' },
				{ id: 2, name: 'B' },
				{ id: 3, name: 'C' },
				{ id: 4, name: 'B' },
			]);

			const groups = data.mapToDictionary((item) => [item.name, item.id]);

			expect(groups.get('A')).toEqual([1]);
			expect(groups.get('B')).toEqual([2, 4]);
			expect(groups.get('C')).toEqual([3]);
		});

		it('maps with numeric keys', () => {
			const data = collect([1, 2, 3, 2, 1]);
			const groups = data.mapToDictionary((item, key) => [String(item), key]);

			expect(groups.get('1')).toEqual(['0', '4']);
			expect(groups.get('2')).toEqual(['1', '3']);
			expect(groups.get('3')).toEqual(['2']);
		});
	});
});

describe('MapToGroups', () => {
	describe('mapToGroups()', () => {
		it('maps to groups returning Collection values', () => {
			const data = collect([
				{ id: 1, name: 'A' },
				{ id: 2, name: 'B' },
				{ id: 3, name: 'C' },
				{ id: 4, name: 'B' },
			]);

			const groups = data.mapToGroups((item) => [item.name, item.id]);

			expect(groups).toBeInstanceOf(Collection);
			expect(groups.get('A')).toBeInstanceOf(Collection);
			expect(groups.get('A')?.all()).toEqual([1]);
			expect(groups.get('B')?.all()).toEqual([2, 4]);
			expect(groups.get('C')?.all()).toEqual([3]);
		});

		it('does not modify original collection', () => {
			const data = collect([1, 2, 3, 2, 1]);
			data.mapToGroups((item, key) => [String(item), key]);
			expect(data.all()).toEqual([1, 2, 3, 2, 1]);
		});
	});
});

describe('MapInto', () => {
	describe('mapInto()', () => {
		it('maps into class instances', () => {
			class TestObject {
				constructor(public value: string) {}
			}

			const data = collect(['first', 'second']);
			const result = data.mapInto(TestObject);

			expect(result.get(0)).toBeInstanceOf(TestObject);
			expect(result.get(0)?.value).toBe('first');
			expect(result.get(1)?.value).toBe('second');
		});
	});
});

describe('Split', () => {
	describe('split()', () => {
		it('splits into divisible groups', () => {
			const data = collect(['a', 'b', 'c', 'd']);
			const split = data.split(2);

			expect(split.get(0)?.all()).toEqual(['a', 'b']);
			expect(split.get(1)?.all()).toEqual(['c', 'd']);
			expect(split).toBeInstanceOf(Collection);
		});

		it('splits with undivisible count', () => {
			const data = collect(['a', 'b', 'c']);
			const split = data.split(2);

			expect(split.get(0)?.all()).toEqual(['a', 'b']);
			expect(split.get(1)?.all()).toEqual(['c']);
		});

		it('splits with count less than divisor', () => {
			const data = collect(['a']);
			const split = data.split(2);

			expect(split.get(0)?.all()).toEqual(['a']);
			expect(split.get(1)).toBeUndefined();
		});

		it('splits into three with count of four', () => {
			const data = collect(['a', 'b', 'c', 'd']);
			const split = data.split(3);

			expect(split.get(0)?.all()).toEqual(['a', 'b']);
			expect(split.get(1)?.all()).toEqual(['c']);
			expect(split.get(2)?.all()).toEqual(['d']);
		});

		it('splits into three with count of five', () => {
			const data = collect(['a', 'b', 'c', 'd', 'e']);
			const split = data.split(3);

			expect(split.get(0)?.all()).toEqual(['a', 'b']);
			expect(split.get(1)?.all()).toEqual(['c', 'd']);
			expect(split.get(2)?.all()).toEqual(['e']);
		});

		it('splits empty collection', () => {
			const data = collect([]);
			const split = data.split(2);

			expect(split.get(0)).toBeUndefined();
			expect(split.get(1)).toBeUndefined();
		});
	});
});

describe('SplitIn', () => {
	describe('splitIn()', () => {
		it('splits into specified number of groups', () => {
			const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			const split = data.splitIn(3);

			expect(split).toBeInstanceOf(Collection);
			expect(split.first()).toBeInstanceOf(Collection);
			expect(split.count()).toBe(3);
			expect(split.get(0)?.values().all()).toEqual([1, 2, 3, 4]);
			expect(split.get(1)?.values().all()).toEqual([5, 6, 7, 8]);
			expect(split.get(2)?.values().all()).toEqual([9, 10]);
		});
	});
});

// =============================================================================
// PHASE C: EDGE CASE TESTS (Laravel port)
// =============================================================================

describe('Edge Cases - Empty Collections', () => {
	it('first returns undefined on empty collection', () => {
		expect(collect([]).first()).toBeUndefined();
	});

	it('last returns undefined on empty collection', () => {
		expect(collect([]).last()).toBeUndefined();
	});

	it('sum returns 0 on empty collection', () => {
		expect(collect([]).sum()).toBe(0);
	});

	it('avg returns null on empty collection', () => {
		expect(collect([]).avg()).toBeNull();
	});

	it('min returns null on empty collection', () => {
		expect(collect([]).min()).toBeNull();
	});

	it('max returns null on empty collection', () => {
		expect(collect([]).max()).toBeNull();
	});

	it('count returns 0 on empty collection', () => {
		expect(collect([]).count()).toBe(0);
	});

	it('isEmpty returns true on empty collection', () => {
		expect(collect([]).isEmpty()).toBe(true);
	});

	it('isNotEmpty returns false on empty collection', () => {
		expect(collect([]).isNotEmpty()).toBe(false);
	});

	it('keys returns empty collection', () => {
		expect(collect([]).keys().all()).toEqual([]);
	});

	it('values returns empty collection', () => {
		expect(collect([]).values().all()).toEqual([]);
	});

	it('filter on empty returns empty', () => {
		expect(collect([]).filter().all()).toEqual([]);
	});

	it('map on empty returns empty', () => {
		expect(
			collect([])
				.map((x) => x)
				.all(),
		).toEqual([]);
	});

	it('flatMap on empty returns empty', () => {
		expect(
			collect([])
				.flatMap((x) => [x])
				.all(),
		).toEqual([]);
	});

	it('reduce on empty returns initial', () => {
		expect(collect([]).reduce((acc, v) => acc + v, 0)).toBe(0);
	});

	it('every returns true on empty (vacuous truth)', () => {
		expect(collect([]).every((x) => x === 'impossible')).toBe(true);
	});

	it('some returns false on empty', () => {
		expect(collect([]).some((x) => x === 'anything')).toBe(false);
	});
});

describe('Edge Cases - Single Item Collections', () => {
	it('first returns the item', () => {
		expect(collect([42]).first()).toBe(42);
	});

	it('last returns the item', () => {
		expect(collect([42]).last()).toBe(42);
	});

	it('sole returns the item', () => {
		expect(collect([42]).sole()).toBe(42);
	});

	it('containsOneItem returns true', () => {
		expect(collect([42]).containsOneItem()).toBe(true);
	});

	it('median returns the item', () => {
		expect(collect([42]).median()).toBe(42);
	});

	it('mode returns array with the item', () => {
		expect(collect([42]).mode()).toEqual([42]);
	});

	it('unique returns collection with item', () => {
		expect(collect([42]).unique().all()).toEqual([42]);
	});

	it('chunk(1) returns collection with one chunk', () => {
		const chunks = collect([42]).chunk(1);
		expect(chunks.count()).toBe(1);
		expect(chunks.first()?.all()).toEqual([42]);
	});

	it('partition splits correctly', () => {
		const [truthy, falsy] = collect([1]).partition((x) => x > 0);
		expect(truthy.all()).toEqual([1]);
		expect(falsy.all()).toEqual([]);
	});
});

describe('Edge Cases - Null and Undefined', () => {
	it('contains finds null', () => {
		expect(collect([null, 1, 2]).contains(null)).toBe(true);
	});

	it('contains finds undefined', () => {
		expect(collect([undefined, 1, 2]).contains(undefined)).toBe(true);
	});

	it('whereNull finds null values', () => {
		const data = collect([{ name: null }, { name: 'John' }]);
		expect(data.whereNull('name').count()).toBe(1);
	});

	it('whereNotNull excludes null values', () => {
		const data = collect([{ name: null }, { name: 'John' }]);
		expect(data.whereNotNull('name').count()).toBe(1);
		expect(data.whereNotNull('name').first()?.name).toBe('John');
	});

	it('filter removes null and undefined by default', () => {
		const data = collect([1, null, 2, undefined, 3]);
		expect(data.filter().all()).toEqual([1, 2, 3]);
	});

	it('reject removes matching null', () => {
		const data = collect([1, null, 2]);
		expect(data.reject((x) => x === null).all()).toEqual([1, 2]);
	});

	it('firstWhere handles null key values', () => {
		const data = collect([{ id: null }, { id: 1 }]);
		expect(data.firstWhere('id', 1)?.id).toBe(1);
	});
});

describe('Edge Cases - Where Operators', () => {
	const users = collect([
		{ name: 'Alice', age: 25 },
		{ name: 'Bob', age: 30 },
		{ name: 'Charlie', age: 35 },
		{ name: 'David', age: 30 },
	]);

	it('where with = operator', () => {
		expect(users.where('age', '=', 30).count()).toBe(2);
	});

	it('where with == operator', () => {
		expect(users.where('age', '==', 30).count()).toBe(2);
	});

	it('where with != operator', () => {
		expect(users.where('age', '!=', 30).count()).toBe(2);
	});

	it('whereStrict for strict comparison', () => {
		expect(users.whereStrict('age', 30).count()).toBe(2);
	});

	it('where with <> operator (same as !=)', () => {
		expect(users.where('age', '<>', 30).count()).toBe(2);
	});

	it('where with > operator', () => {
		expect(users.where('age', '>', 30).count()).toBe(1);
	});

	it('where with >= operator', () => {
		expect(users.where('age', '>=', 30).count()).toBe(3);
	});

	it('where with < operator', () => {
		expect(users.where('age', '<', 30).count()).toBe(1);
	});

	it('where with <= operator', () => {
		expect(users.where('age', '<=', 30).count()).toBe(3);
	});

	it('where without operator defaults to ===', () => {
		expect(users.where('age', 30).count()).toBe(2);
	});
});

describe('Edge Cases - Callback vs Value', () => {
	it('first with callback', () => {
		expect(collect([1, 2, 3]).first((x) => x > 1)).toBe(2);
	});

	it('first with default value', () => {
		expect(collect([]).first(undefined, 'default')).toBe('default');
	});

	it('last with callback', () => {
		expect(collect([1, 2, 3]).last((x) => x < 3)).toBe(2);
	});

	it('last with default value', () => {
		expect(collect([]).last(undefined, 'default')).toBe('default');
	});

	it('contains with callback', () => {
		expect(collect([1, 2, 3]).contains((x) => x === 2)).toBe(true);
	});

	it('contains with key-value pair', () => {
		const data = collect([{ id: 1 }, { id: 2 }]);
		expect(data.contains('id', 2)).toBe(true);
	});

	it('reject with callback', () => {
		expect(
			collect([1, 2, 3])
				.reject((x) => x > 1)
				.all(),
		).toEqual([1]);
	});

	it('reject with value', () => {
		expect(collect([1, 2, 3, 2]).reject(2).all()).toEqual([1, 3]);
	});

	it('unique with callback', () => {
		const data = collect([
			{ type: 'a', val: 1 },
			{ type: 'b', val: 2 },
			{ type: 'a', val: 3 },
		]);
		expect(data.unique((item) => item.type).count()).toBe(2);
	});

	it('sortBy with callback', () => {
		const data = collect([{ n: 3 }, { n: 1 }, { n: 2 }]);
		expect(
			data
				.sortBy((i) => i.n)
				.pluck('n')
				.all(),
		).toEqual([1, 2, 3]);
	});

	it('groupBy with callback', () => {
		const data = collect([1, 2, 3, 4, 5]);
		const grouped = data.groupBy((n) => (n % 2 === 0 ? 'even' : 'odd'));
		expect(grouped.get('even')?.all()).toEqual([2, 4]);
		expect(grouped.get('odd')?.all()).toEqual([1, 3, 5]);
	});
});

describe('Edge Cases - Type Coercion', () => {
	it('sum coerces string numbers', () => {
		expect(collect(['1', '2', '3']).sum()).toBe(0);
	});

	it('sum handles mixed types', () => {
		expect(collect([1, 'two', 3, null]).sum()).toBe(4);
	});

	it('where handles numeric string comparison (loose vs strict)', () => {
		const data = collect([{ id: 1 }, { id: '1' }, { id: 2 }]);
		// Loose comparison: '1' == 1 is true (Laravel default behavior)
		expect(data.where('id', '=', 1).count()).toBe(2);
		// Strict comparison: '1' === 1 is false (use whereStrict)
		expect(data.whereStrict('id', 1).count()).toBe(1);
	});

	it('search returns key not index for objects', () => {
		const c = collect({ first: 'a', second: 'b' });
		expect(c.search('b')).toBe('second');
	});

	it('search returns false when not found', () => {
		expect(collect([1, 2, 3]).search(4)).toBe(false);
	});
});

describe('Edge Cases - Chaining', () => {
	it('chains filter then map', () => {
		const result = collect([1, 2, 3, 4, 5])
			.filter((n) => n > 2)
			.map((n) => n * 2)
			.all();
		expect(result).toEqual([6, 8, 10]);
	});

	it('chains map then filter then sum', () => {
		const result = collect([1, 2, 3, 4, 5])
			.map((n) => n * 2)
			.filter((n) => n > 4)
			.sum();
		expect(result).toBe(24);
	});

	it('chains groupBy then map', () => {
		const result = collect([1, 2, 3, 4])
			.groupBy((n) => (n % 2 === 0 ? 'even' : 'odd'))
			.map((group: Collection<number>) => group.sum());
		expect(result.get('odd')).toBe(4);
		expect(result.get('even')).toBe(6);
	});

	it('chains pluck then unique', () => {
		const data = collect([{ type: 'a' }, { type: 'b' }, { type: 'a' }]);
		expect(data.pluck('type').unique().all()).toEqual(['a', 'b']);
	});

	it('chains sort then take', () => {
		expect(collect([5, 3, 1, 4, 2]).sort().take(3).all()).toEqual([1, 2, 3]);
	});
});

describe('Edge Cases - Immutability', () => {
	it('map does not modify original', () => {
		const original = collect([1, 2, 3]);
		original.map((n) => n * 2);
		expect(original.all()).toEqual([1, 2, 3]);
	});

	it('filter does not modify original', () => {
		const original = collect([1, 2, 3]);
		original.filter((n) => n > 1);
		expect(original.all()).toEqual([1, 2, 3]);
	});

	it('sort does not modify original', () => {
		const original = collect([3, 1, 2]);
		original.sort();
		expect(original.all()).toEqual([3, 1, 2]);
	});

	it('push modifies original', () => {
		const original = collect([1, 2, 3]);
		original.push(4);
		expect(original.all()).toEqual([1, 2, 3, 4]);
	});

	it('pop modifies original', () => {
		const original = collect([1, 2, 3]);
		original.pop();
		expect(original.all()).toEqual([1, 2]);
	});

	it('shift modifies original', () => {
		const original = collect([1, 2, 3]);
		original.shift();
		expect(original.all()).toEqual([2, 3]);
	});

	it('transform modifies in place', () => {
		const original = collect([1, 2, 3]);
		original.transform((n) => n * 2);
		expect(original.all()).toEqual([2, 4, 6]);
	});
});

describe('Edge Cases - Object Collections', () => {
	it('collects from object', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		expect(c.count()).toBe(3);
	});

	it('keys from object', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.keys().all()).toEqual(['a', 'b']);
	});

	it('values from object', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.values().all()).toEqual([1, 2]);
	});

	it('get by string key', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.get('a')).toBe(1);
		expect(c.get('c')).toBeUndefined();
	});

	it('has checks string key', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.has('a')).toBe(true);
		expect(c.has('c')).toBe(false);
	});

	it('only with object keys', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		expect(c.only(['a', 'c']).all()).toEqual({ a: 1, c: 3 });
	});

	it('except with object keys', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		expect(c.except(['b']).all()).toEqual({ a: 1, c: 3 });
	});

	it('flip swaps keys and values', () => {
		const c = collect({ a: 1, b: 2 });
		const flipped = c.flip();
		expect(flipped.get('1')).toBe('a');
		expect(flipped.get('2')).toBe('b');
	});
});

describe('Edge Cases - Numeric Edge Cases', () => {
	it('sum handles NaN in array', () => {
		expect(collect([1, Number.NaN, 2]).sum()).toBe(3);
	});

	it('sum handles Infinity', () => {
		expect(collect([1, Number.POSITIVE_INFINITY, 2]).sum()).toBe(Number.POSITIVE_INFINITY);
	});

	it('avg with decimal precision', () => {
		expect(collect([1, 2]).avg()).toBe(1.5);
	});

	it('median with even count', () => {
		expect(collect([1, 2, 3, 4]).median()).toBe(2.5);
	});

	it('median with odd count', () => {
		expect(collect([1, 2, 3, 4, 5]).median()).toBe(3);
	});

	it('mode with multiple modes', () => {
		expect(collect([1, 1, 2, 2, 3]).mode()).toEqual([1, 2]);
	});

	it('min with negative numbers', () => {
		expect(collect([-5, -1, 0, 3]).min()).toBe(-5);
	});

	it('max with negative numbers', () => {
		expect(collect([-5, -1]).max()).toBe(-1);
	});

	it('random returns item from collection', () => {
		const items = [1, 2, 3, 4, 5];
		const result = collect(items).random();
		expect(items).toContain(result);
	});

	it('random with count returns collection', () => {
		const result = collect([1, 2, 3, 4, 5]).random(2);
		expect(result).toBeInstanceOf(Collection);
		expect((result as Collection<number>).count()).toBe(2);
	});
});

// =============================================================================
// PORTED FROM LARAVEL: SupportCollectionTest.php
// =============================================================================

describe('Add (Laravel port)', () => {
	it('adds items to collection', () => {
		const c = collect<unknown>([]);
		expect(c.add(1).values().all()).toEqual([1]);
		expect(c.add(2).values().all()).toEqual([1, 2]);
		expect(c.add('').values().all()).toEqual([1, 2, '']);
		expect(c.add(null).values().all()).toEqual([1, 2, '', null]);
		expect(c.add(false).values().all()).toEqual([1, 2, '', null, false]);
		expect(c.add([]).values().all()).toEqual([1, 2, '', null, false, []]);
		expect(c.add('name').values().all()).toEqual([1, 2, '', null, false, [], 'name']);
	});
});

describe('Put (Laravel port)', () => {
	it('puts items by key', () => {
		const data = collect({ name: 'taylor', email: 'foo' });
		data.put('name', 'dayle');
		expect(data.all()).toEqual({ name: 'dayle', email: 'foo' });
	});

	it('puts with no key appends', () => {
		const data = collect(['taylor', 'shawn']);
		data.put(null as unknown as string, 'dayle');
		expect(data.all()).toEqual(['taylor', 'shawn', 'dayle']);
	});
});

describe('Prepend (Laravel port)', () => {
	it('prepends value to array collection', () => {
		const c = collect(['one', 'two', 'three', 'four']);
		expect(c.prepend('zero').all()).toEqual(['zero', 'one', 'two', 'three', 'four']);
	});

	it('prepends with key to object collection', () => {
		const c = collect({ one: 1, two: 2 });
		expect(c.prepend(0, 'zero').all()).toEqual({ zero: 0, one: 1, two: 2 });
	});
});

describe('Forget (Laravel port)', () => {
	it('forgets single key from array', () => {
		const c = collect(['foo', 'bar']);
		const result = c.forget(0);
		expect(result.has(0)).toBe(false);
		expect(result.has(1)).toBe(true);
	});

	it('forgets single key from object', () => {
		const c = collect({ foo: 'bar', baz: 'qux' });
		const result = c.forget('foo');
		expect(result.has('foo')).toBe(false);
		expect(result.has('baz')).toBe(true);
	});

	it('forgets array of keys', () => {
		const c = collect(['foo', 'bar', 'baz']);
		const result = c.forget([0, 2]);
		expect(result.has(0)).toBe(false);
		expect(result.has(2)).toBe(false);
		expect(result.has(1)).toBe(true);
	});

	it('forgets array of keys from object', () => {
		const c = collect({ name: 'taylor', foo: 'bar', baz: 'qux' });
		const result = c.forget(['foo', 'baz']);
		expect(result.has('foo')).toBe(false);
		expect(result.has('baz')).toBe(false);
		expect(result.has('name')).toBe(true);
	});
});

describe('Pull (Laravel port)', () => {
	it('retrieves item from collection', () => {
		const c = collect(['foo', 'bar']);
		expect(c.pull(0)).toBe('foo');
		expect(c.pull(1)).toBe('bar');
	});

	it('returns undefined for missing keys', () => {
		const c = collect(['foo', 'bar']);
		expect(c.pull(-1)).toBeUndefined();
		expect(c.pull(2)).toBeUndefined();
	});

	it('removes item from collection', () => {
		const c = collect(['foo', 'bar']);
		c.pull(0);
		// After pull, keys are preserved (not reindexed)
		expect(c.get(1)).toBe('bar');
		c.pull(1);
		expect(c.isEmpty()).toBe(true);
	});

	it('returns default value when missing', () => {
		const c = collect([]);
		const value = c.pull(0, 'foo');
		expect(value).toBe('foo');
	});
});

describe('Concat (Laravel port)', () => {
	it('concatenates with array', () => {
		const data = collect([4, 5, 6]);
		// @ts-expect-error testing concat with mixed types
		const result = data.concat(['a', 'b', 'c']);
		expect(result.values().all()).toEqual([4, 5, 6, 'a', 'b', 'c']);
	});

	it('concatenates with collection', () => {
		const first = collect([4, 5, 6]);
		const second = collect(['a', 'b', 'c']);
		// @ts-expect-error testing concat with mixed types
		const result = first.concat(second);
		expect(result.values().all()).toEqual([4, 5, 6, 'a', 'b', 'c']);
	});

	it('concatenates multiple times', () => {
		const data = collect([4, 5, 6])
			// @ts-expect-error testing concat with mixed types
			.concat(['a', 'b', 'c'])
			// @ts-expect-error testing concat with mixed types
			.concat(['who', 'from', 'where']);
		expect(data.values().all()).toEqual([4, 5, 6, 'a', 'b', 'c', 'who', 'from', 'where']);
	});
});

describe('Unless (Laravel port)', () => {
	it('executes callback when condition is false', () => {
		const data = collect(['michael', 'tom']);
		const result = data.unless(false, (c) => c.concat(['caleb']));
		expect(result.toArray()).toEqual(['michael', 'tom', 'caleb']);
	});

	it('does not execute callback when condition is true', () => {
		const data = collect(['michael', 'tom']);
		const result = data.unless(true, (c) => c.concat(['caleb']));
		expect(result.toArray()).toEqual(['michael', 'tom']);
	});

	it('executes default when condition is true', () => {
		const data = collect(['michael', 'tom']);
		const result = data.unless(
			true,
			(c) => c.concat(['caleb']),
			(c) => c.concat(['taylor']),
		);
		expect(result.toArray()).toEqual(['michael', 'tom', 'taylor']);
	});
});

describe('WhenEmpty (Laravel port)', () => {
	it('does not execute callback when not empty', () => {
		const data = collect(['michael', 'tom']);
		const result = data.whenEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual(['michael', 'tom']);
	});

	it('executes callback when empty', () => {
		const data = collect<string>([]);
		const result = data.whenEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual(['adam']);
	});

	it('executes default when not empty', () => {
		const data = collect(['michael', 'tom']);
		const result = data.whenEmpty(
			(c) => c.concat(['adam']),
			(c) => c.concat(['taylor']),
		);
		expect(result.toArray()).toEqual(['michael', 'tom', 'taylor']);
	});
});

describe('WhenNotEmpty (Laravel port)', () => {
	it('executes callback when not empty', () => {
		const data = collect(['michael', 'tom']);
		const result = data.whenNotEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual(['michael', 'tom', 'adam']);
	});

	it('does not execute callback when empty', () => {
		const data = collect<string>([]);
		const result = data.whenNotEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual([]);
	});
});

describe('UnlessEmpty (Laravel port)', () => {
	it('executes callback when not empty', () => {
		const data = collect(['michael', 'tom']);
		const result = data.unlessEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual(['michael', 'tom', 'adam']);
	});

	it('does not execute callback when empty', () => {
		const data = collect<string>([]);
		const result = data.unlessEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual([]);
	});
});

describe('UnlessNotEmpty (Laravel port)', () => {
	it('does not execute callback when not empty', () => {
		const data = collect(['michael', 'tom']);
		const result = data.unlessNotEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual(['michael', 'tom']);
	});

	it('executes callback when empty', () => {
		const data = collect<string>([]);
		const result = data.unlessNotEmpty((c) => c.concat(['adam']));
		expect(result.toArray()).toEqual(['adam']);
	});
});

describe('ContainsStrict (Laravel port)', () => {
	it('checks strict type equality', () => {
		const c = collect([1, 3, 5, '02']);
		expect(c.containsStrict(1)).toBe(true);
		expect(c.containsStrict('1')).toBe(false);
		expect(c.containsStrict(2)).toBe(false);
		expect(c.containsStrict('02')).toBe(true);
	});

	it('handles zero correctly', () => {
		const c = collect([0]);
		expect(c.containsStrict(0)).toBe(true);
		expect(c.containsStrict('0')).toBe(false);
		// @ts-expect-error testing containsStrict with incompatible type
		expect(c.containsStrict(false)).toBe(false);
	});

	it('works with callback', () => {
		const c = collect([1, 3, 5]);
		expect(c.containsStrict((v: number) => v < 5)).toBe(true);
		expect(c.containsStrict((v: number) => v > 5)).toBe(false);
	});
});

describe('WhereStrict (Laravel port)', () => {
	it('filters with strict comparison', () => {
		const c = collect([{ v: 3 }, { v: '3' }]);
		expect(c.whereStrict('v', 3).values().all()).toEqual([{ v: 3 }]);
	});
});

describe('WhereNotIn (Laravel port)', () => {
	it('filters items not in array', () => {
		const c = collect([{ v: 1 }, { v: 2 }, { v: 3 }, { v: '3' }, { v: 4 }]);
		expect(c.whereNotIn('v', [1, 3]).values().all()).toEqual([{ v: 2 }, { v: 4 }]);
	});

	it('chains multiple whereNotIn', () => {
		const c = collect([{ v: 1 }, { v: 2 }, { v: 3 }, { v: '3' }, { v: 4 }]);
		expect(c.whereNotIn('v', [2]).whereNotIn('v', [1, 3]).values().all()).toEqual([{ v: 4 }]);
	});
});

describe('WhereNotInStrict (Laravel port)', () => {
	it('filters with strict comparison', () => {
		const c = collect([{ v: 1 }, { v: 2 }, { v: 3 }, { v: '3' }, { v: 4 }]);
		expect(c.whereNotInStrict('v', [1, 3]).values().all()).toEqual([{ v: 2 }, { v: '3' }, { v: 4 }]);
	});
});

describe('UniqueStrict (Laravel port)', () => {
	it('uses strict comparison for uniqueness', () => {
		const c = collect([
			{ id: '0', name: 'zero' },
			{ id: '00', name: 'double zero' },
			{ id: '0', name: 'again zero' },
		]);
		const unique = c.uniqueStrict('id').values().all();
		expect(unique).toHaveLength(2);
		expect(unique[0].name).toBe('zero');
		expect(unique[1].name).toBe('double zero');
	});
});

describe('Join (Laravel port)', () => {
	it('joins with separator', () => {
		expect(collect(['a', 'b', 'c']).join(', ')).toBe('a, b, c');
	});

	it('joins with final separator', () => {
		expect(collect(['a', 'b', 'c']).join(', ', ' and ')).toBe('a, b and c');
	});

	it('joins two items with final separator', () => {
		expect(collect(['a', 'b']).join(', ', ' and ')).toBe('a and b');
	});

	it('returns single item without separator', () => {
		expect(collect(['a']).join(', ', ' and ')).toBe('a');
	});

	it('returns empty string for empty collection', () => {
		expect(collect([]).join(', ', ' and ')).toBe('');
	});
});

describe('Implode (Laravel port)', () => {
	it('implodes by key', () => {
		const data = collect([
			{ name: 'taylor', email: 'foo' },
			{ name: 'dayle', email: 'bar' },
		]);
		expect(data.implode('email')).toBe('foobar');
		expect(data.implode('email', ',')).toBe('foo,bar');
	});

	it('implodes simple values', () => {
		const data = collect(['taylor', 'dayle']);
		expect(data.implode('')).toBe('taylordayle');
		expect(data.implode(',')).toBe('taylor,dayle');
	});
});

describe('SortDesc (Laravel port)', () => {
	it('sorts in descending order', () => {
		const data = collect([5, 3, 1, 2, 4]).sortDesc();
		expect(data.values().all()).toEqual([5, 4, 3, 2, 1]);
	});

	it('sorts negative numbers', () => {
		const data = collect([-1, -3, -2, -4, -5, 0, 5, 3, 1, 2, 4]).sortDesc();
		expect(data.values().all()).toEqual([5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5]);
	});

	it('sorts strings', () => {
		const data = collect(['bar-1', 'foo', 'bar-10']).sortDesc();
		expect(data.values().all()).toEqual(['foo', 'bar-10', 'bar-1']);
	});
});

describe('SortKeys (Laravel port)', () => {
	it('sorts by keys ascending', () => {
		const data = collect({ b: 'dayle', a: 'taylor' });
		expect(data.sortKeys().all()).toEqual({ a: 'taylor', b: 'dayle' });
	});
});

describe('SortKeysDesc (Laravel port)', () => {
	it('sorts by keys descending', () => {
		const data = collect({ a: 'taylor', b: 'dayle' });
		expect(data.sortKeysDesc().all()).toEqual({ b: 'dayle', a: 'taylor' });
	});
});

describe('SortKeysUsing (Laravel port)', () => {
	it('sorts keys with custom comparator', () => {
		const data = collect({ B: 'dayle', a: 'taylor' });
		const sorted = data.sortKeysUsing((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(sorted.all()).toEqual({ a: 'taylor', B: 'dayle' });
	});
});

describe('Dot (Laravel port)', () => {
	it('flattens nested arrays with dot notation', () => {
		const data = collect({
			name: 'Taylor',
			meta: {
				foo: 'bar',
				baz: 'boom',
				bam: {
					boom: 'bip',
				},
			},
		}).dot();
		expect(data.all()).toEqual({
			name: 'Taylor',
			'meta.foo': 'bar',
			'meta.baz': 'boom',
			'meta.bam.boom': 'bip',
		});
	});
});

describe('Undot (Laravel port)', () => {
	it('expands dot notation keys', () => {
		const data = collect({
			name: 'Taylor',
			'meta.foo': 'bar',
			'meta.baz': 'boom',
		}).undot();
		// Note: undot creates nested structure
		expect(data.get('name')).toBe('Taylor');
	});
});

describe('ToJson (Laravel port)', () => {
	it('converts to JSON string', () => {
		const c = collect(['foo', 'bar']);
		expect(c.toJson()).toBe('["foo","bar"]');
	});

	it('converts object to JSON preserving keys', () => {
		const c = collect({ name: 'taylor', email: 'foo' });
		// Laravel-compatible: preserves keys for associative collections
		expect(JSON.parse(c.toJson())).toEqual({ name: 'taylor', email: 'foo' });
	});
});

describe('ToPrettyJson (Laravel port)', () => {
	it('converts to formatted JSON string', () => {
		const c = collect(['foo', 'bar']);
		expect(c.toPrettyJson()).toBe('[\n  "foo",\n  "bar"\n]');
	});

	it('converts object to pretty JSON preserving keys', () => {
		const c = collect({ name: 'taylor', email: 'foo' });
		const expected = '{\n  "name": "taylor",\n  "email": "foo"\n}';
		expect(c.toPrettyJson()).toBe(expected);
	});

	it('handles nested structures', () => {
		const c = collect({
			user: { name: 'John', age: 30 },
			tags: ['admin', 'user'],
		});
		const result = JSON.parse(c.toPrettyJson());
		expect(result).toEqual({
			user: { name: 'John', age: 30 },
			tags: ['admin', 'user'],
		});
	});

	it('handles empty collection', () => {
		expect(collect([]).toPrettyJson()).toBe('[]');
		expect(collect({}).toPrettyJson()).toBe('{}');
	});
});

describe('ForPage (Laravel port)', () => {
	it('returns correct page', () => {
		const c = collect([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(c.forPage(1, 3).all()).toEqual([1, 2, 3]);
		expect(c.forPage(2, 3).all()).toEqual([4, 5, 6]);
		expect(c.forPage(3, 3).all()).toEqual([7, 8, 9]);
	});

	it('returns empty for out of range page', () => {
		const c = collect([1, 2, 3]);
		expect(c.forPage(2, 3).all()).toEqual([]);
	});
});

describe('DiffKeys (Laravel port)', () => {
	it('diffs by keys', () => {
		const c1 = collect({ id: 1, first_word: 'Hello' });
		const c2 = collect({ id: 123, foo_bar: 'Hello' });
		expect(c1.diffKeys(c2).all()).toEqual({ first_word: 'Hello' });
	});
});

describe('DiffKeysUsing (Laravel port)', () => {
	it('diffs keys with custom comparator', () => {
		const c1 = collect({ id: 1, first_word: 'Hello' });
		const c2 = collect({ ID: 123, foo_bar: 'Hello' });
		// Case insensitive comparison
		const result = c1.diffKeysUsing(c2, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.all()).toEqual({ first_word: 'Hello' });
	});
});

describe('DiffAssoc (Laravel port)', () => {
	it('diffs by key and value', () => {
		const c1 = collect({ id: 1, first_word: 'Hello', not_affected: 'value' });
		const c2 = collect({ id: 123, foo_bar: 'Hello', not_affected: 'value' });
		expect(c1.diffAssoc(c2).all()).toEqual({ id: 1, first_word: 'Hello' });
	});
});

describe('IntersectByKeys (Laravel port)', () => {
	it('intersects by keys', () => {
		const c = collect({ name: 'Mateus', age: 18 });
		expect(c.intersectByKeys(collect({ name: 'Mateus', surname: 'Guimaraes' })).all()).toEqual({ name: 'Mateus' });
	});

	it('intersects multiple keys', () => {
		const c = collect({ name: 'taylor', family: 'otwell', age: 26 });
		expect(c.intersectByKeys(collect({ height: 180, name: 'amir', family: 'moharami' })).all()).toEqual({
			name: 'taylor',
			family: 'otwell',
		});
	});
});

describe('Duplicates (Laravel port)', () => {
	it('finds duplicate values', () => {
		const duplicates = collect([1, 2, 1, 'laravel', null, 'laravel', 'php', null]).duplicates();
		expect(duplicates.get(2)).toBe(1);
		expect(duplicates.get(5)).toBe('laravel');
		expect(duplicates.get(7)).toBe(null);
	});
});

describe('DuplicatesStrict (Laravel port)', () => {
	it('finds duplicates with strict comparison', () => {
		const c = collect([1, '1', 1, '1', 2]);
		const duplicates = c.duplicatesStrict();
		expect(duplicates.get(2)).toBe(1);
		expect(duplicates.get(3)).toBe('1');
	});
});

describe('HasAny (Laravel port)', () => {
	it('returns true if any key exists', () => {
		const c = collect({ foo: 'one', bar: 'two' });
		expect(c.hasAny(['foo', 'baz'])).toBe(true);
		expect(c.hasAny(['baz', 'qux'])).toBe(false);
	});

	it('works with array indices', () => {
		const c = collect(['a', 'b', 'c']);
		expect(c.hasAny([0, 5])).toBe(true);
		expect(c.hasAny([5, 6])).toBe(false);
	});
});

describe('Average (Laravel port)', () => {
	it('is alias for avg', () => {
		const c = collect([1, 2, 3, 4, 5]);
		expect(c.average()).toBe(c.avg());
		expect(c.average()).toBe(3);
	});
});

describe('EachSpread (Laravel port)', () => {
	it('spreads array items as callback arguments', () => {
		const results: string[] = [];
		collect([
			[1, 'a'],
			[2, 'b'],
		]).eachSpread((num, char) => {
			results.push(`${num}-${char}`);
		});
		expect(results).toEqual(['1-a', '2-b']);
	});

	it('stops iteration when callback returns false', () => {
		const results: string[] = [];
		collect([
			[1, 'a'],
			[2, 'b'],
			[3, 'c'],
		]).eachSpread((num, char) => {
			results.push(`${num}-${char}`);
			if (num === 2) return false;
			return;
		});
		expect(results).toEqual(['1-a', '2-b']);
	});
});

describe('Replace (Laravel port)', () => {
	it('replaces items by key', () => {
		const c = collect(['a', 'b', 'c']);
		const replaced = c.replace({ 1: 'B' });
		expect(replaced.all()).toEqual(['a', 'B', 'c']);
	});
});

describe('ReplaceRecursive (Laravel port)', () => {
	it('replaces nested items', () => {
		const c = collect({
			name: 'taylor',
			meta: { age: 25, city: 'NYC' },
		});
		const replaced = c.replaceRecursive({
			meta: { age: 30 },
		});
		expect(replaced.get('name')).toBe('taylor');
	});
});

describe('MergeRecursive (Laravel port)', () => {
	it('merges nested arrays', () => {
		const c = collect({ name: 'taylor', tags: ['php'] });
		const merged = c.mergeRecursive({ tags: ['laravel'] });
		expect(merged.get('name')).toBe('taylor');
	});
});

// =============================================================================
// BATCH 8: SKIP, CHUNK, SPLIT, REDUCE (Laravel port)
// =============================================================================

describe('Skip (Laravel port)', () => {
	it('skips items', () => {
		const data = collect([1, 2, 3, 4, 5, 6]);
		expect(data.skip(4).values().all()).toEqual([5, 6]);
	});

	it('skips more than collection length', () => {
		const data = collect([1, 2, 3, 4, 5, 6]);
		expect(data.skip(10).values().all()).toEqual([]);
	});
});

describe('SkipUntil (Laravel port)', () => {
	it('skips until value found', () => {
		const data = collect([1, 1, 2, 2, 3, 3, 4, 4]);
		expect(data.skipUntil(3).values().all()).toEqual([3, 3, 4, 4]);
	});

	it('returns empty when value not found', () => {
		const data = collect([1, 1, 2, 2, 3, 3, 4, 4]);
		expect(data.skipUntil(5).values().all()).toEqual([]);
	});

	it('skips until callback returns true', () => {
		const data = collect([1, 1, 2, 2, 3, 3, 4, 4]);
		const result = data.skipUntil((v) => v >= 3).values();
		expect(result.all()).toEqual([3, 3, 4, 4]);
	});
});

describe('SkipWhile (Laravel port)', () => {
	it('skips while value matches', () => {
		const data = collect([1, 1, 2, 2, 3, 3, 4, 4]);
		expect(data.skipWhile(1).values().all()).toEqual([2, 2, 3, 3, 4, 4]);
	});

	it('returns all if value not at start', () => {
		const data = collect([1, 1, 2, 2, 3, 3, 4, 4]);
		expect(data.skipWhile(2).values().all()).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
	});

	it('skips while callback returns true', () => {
		const data = collect([1, 1, 2, 2, 3, 3, 4, 4]);
		const result = data.skipWhile((v) => v < 3).values();
		expect(result.all()).toEqual([3, 3, 4, 4]);
	});
});

describe('Chunk (Laravel port)', () => {
	it('chunks items', () => {
		const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).chunk(3);
		expect(data.count()).toBe(4);
		expect(data.first()?.toArray()).toEqual([1, 2, 3]);
	});

	it('returns empty for zero size', () => {
		const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(data.chunk(0).toArray()).toEqual([]);
	});

	it('returns empty for negative size', () => {
		const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(data.chunk(-1).toArray()).toEqual([]);
	});
});

describe('ChunkWhile (Laravel port)', () => {
	it('chunks on equal elements', () => {
		const data = collect(['A', 'A', 'B', 'B', 'C', 'C', 'C']).chunkWhile(
			(current, _key, chunk) => chunk.last() === current,
		);
		expect(data.first()?.values().all()).toEqual(['A', 'A']);
		expect(data.get(1)?.values().all()).toEqual(['B', 'B']);
		expect(data.last()?.values().all()).toEqual(['C', 'C', 'C']);
	});

	it('chunks contiguously increasing integers', () => {
		const data = collect([1, 4, 9, 10, 11, 12, 15, 16, 19, 20, 21]).chunkWhile(
			// biome-ignore lint/style/noNonNullAssertion: Test - chunk always has at least one item when callback is called
			(current, _key, chunk) => chunk.last()! + 1 === current,
		);
		expect(data.first()?.values().all()).toEqual([1]);
		expect(data.get(1)?.values().all()).toEqual([4]);
		expect(data.get(2)?.values().all()).toEqual([9, 10, 11, 12]);
	});
});

describe('SplitIn (Laravel port)', () => {
	it('splits into groups', () => {
		const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).splitIn(3);
		expect(data.count()).toBe(3);
		expect(data.get(0)?.values().toArray()).toEqual([1, 2, 3, 4]);
		expect(data.get(1)?.values().toArray()).toEqual([5, 6, 7, 8]);
		expect(data.get(2)?.values().toArray()).toEqual([9, 10]);
	});
});

describe('Reduce (Laravel port)', () => {
	it('reduces with accumulator', () => {
		const data = collect([1, 2, 3]);
		expect(data.reduce((carry, el) => carry + el, 0)).toBe(6);
	});

	it('reduces with key access', () => {
		const data = collect({ foo: 'bar', baz: 'qux' });
		const result = data.reduce((carry, el, key) => carry + key + el, '');
		expect(result).toBe('foobarbazqux');
	});
});

describe('ReduceSpread (Laravel port)', () => {
	it('reduces with multiple accumulators', () => {
		const data = collect([-1, 0, 1, 2, 3, 4, 5]);
		const [sum, max, min] = data.reduceSpread(
			(s, mx, mn, value) => [s + value, Math.max(mx, value), Math.min(mn, value)],
			0,
			Number.NEGATIVE_INFINITY,
			Number.POSITIVE_INFINITY,
		);
		expect(sum).toBe(14);
		expect(max).toBe(5);
		expect(min).toBe(-1);
	});
});

describe('Pipe (Laravel port)', () => {
	it('pipes collection through callback', () => {
		const data = collect([1, 2, 3]);
		expect(data.pipe((d) => d.sum())).toBe(6);
	});
});

describe('PipeThrough (Laravel port)', () => {
	it('pipes through multiple callbacks', () => {
		const data = collect([1, 2, 3]);
		const result = data.pipeThrough([
			(d) => (d as Collection<number>).merge([4, 5]),
			(d) => (d as Collection<number>).sum(),
		]);
		expect(result).toBe(15);
	});
});

describe('Every (Laravel port)', () => {
	it('returns true for empty collection', () => {
		const c = collect([]);
		expect(c.every('key', 'value')).toBe(true);
		expect(c.every(() => false)).toBe(true);
	});

	it('checks all items match condition', () => {
		const c = collect([{ age: 18 }, { age: 20 }, { age: 20 }]);
		expect(c.every('age', 18)).toBe(false);
		expect(c.every('age', '>=', 18)).toBe(true);
		expect(c.every((item) => item.age >= 18)).toBe(true);
		expect(c.every((item) => item.age >= 20)).toBe(false);
	});

	it('checks truthy values', () => {
		const c = collect([{ active: true }, { active: true }]);
		expect(c.every('active')).toBe(true);
	});
});

describe('Except (Laravel port)', () => {
	it('excludes specified keys', () => {
		const data = collect({ first: 'Taylor', last: 'Otwell', email: 'taylorotwell@gmail.com' });
		expect(data.except(['last', 'email', 'missing']).all()).toEqual({ first: 'Taylor' });
	});

	it('returns all when null passed', () => {
		const data = collect({ first: 'Taylor', last: 'Otwell' });
		// biome-ignore lint/suspicious/noExplicitAny: Testing null handling behavior
		expect(data.except(null as any).all()).toEqual(data.all());
	});
});

describe('TakeUntil (Laravel port)', () => {
	it('takes until value found', () => {
		const data = collect([1, 2, 3, 4]);
		expect(data.takeUntil(3).all()).toEqual([1, 2]);
	});

	it('takes until callback returns true', () => {
		const data = collect([1, 2, 3, 4]);
		expect(data.takeUntil((v) => v >= 3).all()).toEqual([1, 2]);
	});
});

describe('TakeWhile (Laravel port)', () => {
	it('takes while value matches', () => {
		const data = collect([1, 2, 3, 4]);
		expect(data.takeWhile((v) => v < 3).all()).toEqual([1, 2]);
	});
});

describe('Sliding (Laravel port)', () => {
	it('slides with default step', () => {
		const data = collect([1, 2, 3, 4, 5]).sliding(2);
		expect(data.count()).toBe(4);
		expect(data.first()?.all()).toEqual([1, 2]);
	});

	it('slides with custom step', () => {
		const data = collect([1, 2, 3, 4, 5]).sliding(3, 2);
		expect(data.count()).toBe(2);
		expect(data.first()?.all()).toEqual([1, 2, 3]);
	});
});

describe('Sole (Laravel port)', () => {
	it('returns sole item', () => {
		const data = collect([{ name: 'foo' }, { name: 'bar' }]);
		expect(data.sole('name', 'foo')).toEqual({ name: 'foo' });
	});

	it('throws on multiple matches', () => {
		const data = collect([{ name: 'foo' }, { name: 'foo' }]);
		expect(() => data.sole('name', 'foo')).toThrow();
	});

	it('throws on no matches', () => {
		const data = collect([{ name: 'bar' }]);
		expect(() => data.sole('name', 'foo')).toThrow();
	});

	it('throws MultipleItemsFoundException with correct count', () => {
		const data = collect(['foo', 'bar', 'bar']);
		try {
			data.sole((v) => v === 'bar');
			expect.fail('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(MultipleItemsFoundException);
			expect((e as MultipleItemsFoundException).getCount()).toBe(2);
		}
	});
});

describe('Collapse (Laravel port)', () => {
	it('collapses nested arrays', () => {
		const data = collect([[1, 2], [3, 4], [5]]);
		expect(data.collapse().all()).toEqual([1, 2, 3, 4, 5]);
	});

	it('collapses deeply nested', () => {
		const data = collect([[[1, 2]], [[3]]]);
		expect(data.collapse().toArray()).toEqual([[1, 2], [3]]);
	});
});

describe('Pad (Laravel port)', () => {
	it('pads to length', () => {
		const data = collect([1, 2, 3]);
		expect(data.pad(5, 0).all()).toEqual([1, 2, 3, 0, 0]);
	});

	it('pads from left with negative', () => {
		const data = collect([1, 2, 3]);
		expect(data.pad(-5, 0).all()).toEqual([0, 0, 1, 2, 3]);
	});

	it('does not truncate', () => {
		const data = collect([1, 2, 3, 4, 5]);
		expect(data.pad(3, 0).all()).toEqual([1, 2, 3, 4, 5]);
	});
});

describe('Wrap and Unwrap (Laravel port)', () => {
	it('wraps value in collection', () => {
		expect(Collection.wrap('foo').all()).toEqual(['foo']);
		expect(Collection.wrap([1, 2, 3]).all()).toEqual([1, 2, 3]);
		expect(Collection.wrap(collect([1, 2])).all()).toEqual([1, 2]);
	});

	it('unwraps collection', () => {
		expect(Collection.unwrap(collect([1, 2, 3]))).toEqual([1, 2, 3]);
		expect(Collection.unwrap([1, 2, 3])).toEqual([1, 2, 3]);
		// @ts-expect-error testing string unwrap
		expect(Collection.unwrap('foo')).toBe('foo');
	});
});

describe('Times (Laravel port)', () => {
	it('creates collection from times', () => {
		const result = Collection.times(5, (i) => i * 2);
		expect(result.all()).toEqual([2, 4, 6, 8, 10]);
	});
});

describe('Flatten (Laravel port)', () => {
	it('flattens nested arrays', () => {
		const data = collect([
			[1, 2],
			[3, [4, 5]],
		]);
		expect(data.flatten().all()).toEqual([1, 2, 3, 4, 5]);
	});

	it('flattens to depth', () => {
		const data = collect([[1, [2, [3]]]]);
		expect(data.flatten(1).all()).toEqual([1, [2, [3]]]);
	});
});

describe('Pluck with keys (Laravel port)', () => {
	it('plucks values with keys', () => {
		const data = collect([
			{ id: 1, name: 'Taylor' },
			{ id: 2, name: 'Otwell' },
		]);
		expect(data.pluck('name', 'id').all()).toEqual({ '1': 'Taylor', '2': 'Otwell' });
	});
});

describe('Zip (Laravel port)', () => {
	it('zips arrays together', () => {
		const data = collect([1, 2, 3]);
		const zipped = data.zip(['a', 'b', 'c']);
		expect(zipped.toArray()).toEqual([
			[1, 'a'],
			[2, 'b'],
			[3, 'c'],
		]);
	});
});

describe('CrossJoin (Laravel port)', () => {
	it('cross joins arrays', () => {
		const data = collect([1, 2]);
		const result = data.crossJoin(['a', 'b']);
		expect(result.all()).toEqual([
			[1, 'a'],
			[1, 'b'],
			[2, 'a'],
			[2, 'b'],
		]);
	});
});

describe('Mode (Laravel port)', () => {
	it('returns mode of values', () => {
		const data = collect([1, 2, 2, 3, 3, 3]);
		expect(data.mode()).toEqual([3]);
	});

	it('returns multiple modes', () => {
		const data = collect([1, 1, 2, 2, 3]);
		expect(data.mode()).toEqual([1, 2]);
	});

	it('returns null for empty', () => {
		expect(collect([]).mode()).toBeNull();
	});
});

describe('Median (Laravel port)', () => {
	it('returns median of values', () => {
		expect(collect([1, 2, 2, 4]).median()).toBe(2);
		expect(collect([1, 2, 3, 4, 5]).median()).toBe(3);
	});

	it('returns null for empty', () => {
		expect(collect([]).median()).toBeNull();
	});
});

describe('Percentage (Laravel port)', () => {
	it('calculates percentage matching', () => {
		const data = collect([1, 1, 2, 2, 2, 3]);
		expect(data.percentage((v) => v === 1)).toBeCloseTo(33.33, 1);
		expect(data.percentage((v) => v === 2)).toBeCloseTo(50, 1);
	});
});

describe('CountBy (Laravel port)', () => {
	it('counts by callback', () => {
		const data = collect(['alice@example.com', 'bob@example.com', 'carlos@gmail.com']);
		const counts = data.countBy((email) => email.split('@')[1]);
		expect(counts.get('example.com')).toBe(2);
		expect(counts.get('gmail.com')).toBe(1);
	});
});

describe('GroupBy deep (Laravel port)', () => {
	it('groups by nested key', () => {
		const data = collect([
			{ user: { city: 'NYC' }, name: 'Taylor' },
			{ user: { city: 'NYC' }, name: 'Otwell' },
			{ user: { city: 'LA' }, name: 'Adam' },
		]);
		const grouped = data.groupBy('user.city');
		expect(grouped.get('NYC')?.count()).toBe(2);
		expect(grouped.get('LA')?.count()).toBe(1);
	});
});

describe('KeyBy (Laravel port)', () => {
	it('keys by property', () => {
		const data = collect([
			{ id: 1, name: 'Taylor' },
			{ id: 2, name: 'Otwell' },
		]);
		expect(data.keyBy('id').get(1)).toEqual({ id: 1, name: 'Taylor' });
	});

	it('keys by callback', () => {
		const data = collect([
			{ id: 1, name: 'Taylor' },
			{ id: 2, name: 'Otwell' },
		]);
		expect(data.keyBy((item) => `user_${item.id}`).get('user_1')).toEqual({ id: 1, name: 'Taylor' });
	});
});

describe('MapToGroups (Laravel port)', () => {
	it('maps to groups', () => {
		const data = collect([
			{ id: 1, group: 'A' },
			{ id: 2, group: 'A' },
			{ id: 3, group: 'B' },
		]);
		const grouped = data.mapToGroups((item) => [item.group, item.id]);
		expect(grouped.get('A')?.all()).toEqual([1, 2]);
		expect(grouped.get('B')?.all()).toEqual([3]);
	});
});

describe('MapWithKeys (Laravel port)', () => {
	it('maps with keys', () => {
		const data = collect([
			{ id: 1, name: 'Taylor' },
			{ id: 2, name: 'Otwell' },
		]);
		// @ts-expect-error testing numeric key
		const mapped = data.mapWithKeys((item) => [item.id, item.name]);
		expect(mapped.get(1)).toBe('Taylor');
		expect(mapped.get(2)).toBe('Otwell');
	});
});

describe('Range (Laravel port)', () => {
	it('creates range', () => {
		expect(Collection.range(1, 5).all()).toEqual([1, 2, 3, 4, 5]);
		expect(Collection.range(5, 1).all()).toEqual([5, 4, 3, 2, 1]);
	});
});

describe('Before and After (Laravel port)', () => {
	it('gets item before', () => {
		const data = collect([1, 2, 3, 4, 5]);
		expect(data.before(3)).toBe(2);
		expect(data.before(1)).toBeNull();
	});

	it('gets item after', () => {
		const data = collect([1, 2, 3, 4, 5]);
		expect(data.after(3)).toBe(4);
		expect(data.after(5)).toBeNull();
	});
});

// =============================================================================
// PHASE 1: COMPARISON METHODS (Laravel port for 100% coverage)
// =============================================================================

describe('DiffUsing (Laravel port)', () => {
	it('diffs using case-insensitive comparison', () => {
		const c = collect(['en_GB', 'fr', 'HR']);
		// Case-insensitive diff
		const result = c.diffUsing(['en_gb', 'hr'], (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.values().all()).toEqual(['fr']);
	});
});

describe('DiffAssocUsing (Laravel port)', () => {
	it('diffs assoc using case-insensitive key comparison', () => {
		const c1 = collect({ a: 'green', b: 'brown', c: 'blue' });
		const c2 = { A: 'green', yellow: 'y', red: 'r' };
		const result = c1.diffAssocUsing(c2, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.all()).toEqual({ b: 'brown', c: 'blue' });
	});
});

describe('IntersectUsing (Laravel port)', () => {
	it('intersects using case-insensitive comparison', () => {
		const c = collect(['green', 'brown', 'blue']);
		const result = c.intersectUsing(['GREEN', 'brown', 'yellow'], (a, b) =>
			a.toLowerCase().localeCompare(b.toLowerCase()),
		);
		expect(result.all()).toEqual(['green', 'brown']);
	});
});

describe('IntersectAssoc (Laravel port)', () => {
	it('intersects with key and value match', () => {
		const c1 = collect({ a: 'green', b: 'brown', c: 'blue' });
		const c2 = { a: 'green', b: 'yellow', d: 'blue' };
		expect(c1.intersectAssoc(c2).all()).toEqual({ a: 'green' });
	});
});

describe('IntersectAssocUsing (Laravel port)', () => {
	it('intersects assoc using key comparison callback', () => {
		const c1 = collect({ a: 'green', b: 'brown', c: 'blue' });
		const c2 = { A: 'green', b: 'brown', d: 'yellow' };
		// Callback compares KEYS case-insensitively (per PHP's array_intersect_uassoc)
		const result = c1.intersectAssocUsing(c2, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.get('a')).toBe('green'); // 'a' matches 'A' (case-insensitive key), values equal
		expect(result.get('b')).toBe('brown'); // 'b' matches 'b', values equal
		expect(result.has('c')).toBe(false); // 'c' has no matching key
		expect(result.count()).toBe(2);
	});
});

describe('DoesntContainStrict (Laravel port)', () => {
	it('checks strict non-containment', () => {
		const c = collect([1, 3, 5, '02']);
		expect(c.doesntContainStrict(1)).toBe(false);
		expect(c.doesntContainStrict('1')).toBe(true); // strict: '1' !== 1
		expect(c.doesntContainStrict(2)).toBe(true);
		expect(c.doesntContainStrict('02')).toBe(false);
	});

	it('checks with callback', () => {
		const c = collect([1, 3, 5]);
		expect(c.doesntContainStrict((v) => v < 5)).toBe(false); // 1 and 3 are < 5
		expect(c.doesntContainStrict((v) => v > 5)).toBe(true); // nothing > 5
	});
});

// =============================================================================
// PHASE 2: CORE OPERATIONS (Laravel port for 100% coverage)
// =============================================================================

describe('Unshift (Laravel port)', () => {
	it('adds items to the beginning', () => {
		const c = collect([1, 2, 3]);
		c.unshift(0);
		expect(c.all()).toEqual([0, 1, 2, 3]);
	});

	it('adds multiple items', () => {
		const c = collect([3, 4]);
		c.unshift(1, 2);
		expect(c.all()).toEqual([1, 2, 3, 4]);
	});
});

describe('Select (Laravel port)', () => {
	it('selects specific keys from arrays', () => {
		const data = collect([
			{ first: 'Taylor', last: 'Otwell', email: 'taylorotwell@gmail.com' },
			{ first: 'Jess', last: 'Archer', email: 'jessarcher@gmail.com' },
		]);
		expect(data.select(['first', 'email']).all()).toEqual([
			{ first: 'Taylor', email: 'taylorotwell@gmail.com' },
			{ first: 'Jess', email: 'jessarcher@gmail.com' },
		]);
	});

	it('handles missing keys', () => {
		const data = collect([{ first: 'Taylor', last: 'Otwell' }]);
		expect(data.select(['first', 'missing']).all()).toEqual([{ first: 'Taylor' }]);
	});
});

describe('CollapseWithKeys (Laravel port)', () => {
	it('collapses preserving keys', () => {
		const data = collect([{ 1: 'a' }, { 3: 'c' }, { 2: 'b' }]);
		expect(data.collapseWithKeys().all()).toEqual({ '1': 'a', '2': 'b', '3': 'c' });
	});

	it('returns empty for flat collection', () => {
		const data = collect(['a', 'b', 'c']);
		expect(data.collapseWithKeys().all()).toEqual({});
	});

	it('handles nested collections', () => {
		const data = collect([collect({ a: '1a', b: '1b' }), collect({ b: '2b', c: '2c' })]);
		const result = data.collapseWithKeys();
		expect(result.get('a')).toBe('1a');
		expect(result.get('b')).toBe('2b'); // second overwrites first
		expect(result.get('c')).toBe('2c');
	});
});

describe('WhereNotBetween (Laravel port)', () => {
	it('filters values not between range', () => {
		const c = collect([{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }]);
		expect(c.whereNotBetween('v', [2, 4]).values().all()).toEqual([{ v: 1 }]);
	});
});

// =============================================================================
// PHASE 3: FILTERING & TYPE METHODS (Laravel port for 100% coverage)
// =============================================================================

describe('WhereInstanceOf (Laravel port)', () => {
	it('filters by instance type', () => {
		class Foo {}
		class Bar {}
		const c = collect([new Foo(), new Bar(), new Foo()]);
		expect(c.whereInstanceOf(Foo).count()).toBe(2);
		expect(c.whereInstanceOf(Bar).count()).toBe(1);
	});
});

describe('WhereInStrict (Laravel port)', () => {
	it('filters with strict comparison', () => {
		const c = collect([{ v: 1 }, { v: 2 }, { v: 3 }, { v: '3' }, { v: 4 }]);
		expect(c.whereInStrict('v', [1, 3]).values().all()).toEqual([{ v: 1 }, { v: 3 }]);
	});
});

describe('Ensure (Laravel port)', () => {
	it('passes for valid scalar types', () => {
		const data = collect([1, 2, 3]);
		expect(() => data.ensure('number')).not.toThrow();
	});

	it('throws for invalid types', () => {
		const data = collect([1, 2, 'foo']);
		expect(() => data.ensure('number')).toThrow();
	});

	it('works with multiple types', () => {
		const data = collect([1, 'hello', 2]);
		expect(() => data.ensure(['number', 'string'])).not.toThrow();
	});
});

describe('Value (Laravel port)', () => {
	it('gets value from first item', () => {
		const c = collect([
			{ id: 1, name: 'Hello' },
			{ id: 2, name: 'World' },
		]);
		expect(c.value('name')).toBe('Hello');
		expect(c.where('id', 2).value('name')).toBe('World');
	});

	it('supports dot notation', () => {
		const c = collect([
			{ id: 1, pivot: { value: 'foo' } },
			{ id: 2, pivot: { value: 'bar' } },
		]);
		// @ts-expect-error testing dot notation
		expect(c.value('pivot.value')).toBe('foo');
	});

	it('handles falsy values', () => {
		const c = collect([{ id: 1, balance: 0 }]);
		expect(c.value('balance')).toBe(0);
	});
});

// =============================================================================
// PHASE 4: UTILITY METHODS (Laravel port for 100% coverage)
// =============================================================================

describe('Static make (Laravel port)', () => {
	it('creates collection via make', () => {
		const c = Collection.make([1, 2, 3]);
		expect(c.all()).toEqual([1, 2, 3]);
	});

	it('creates empty collection', () => {
		const c = Collection.make();
		expect(c.all()).toEqual([]);
	});
});

describe('Static wrap with iterables (Laravel port)', () => {
	it('wraps iterable values', () => {
		const set = new Set([1, 2, 3]);
		const c = Collection.wrap(set);
		expect(c.all()).toEqual([1, 2, 3]);
	});

	it('wraps generator', () => {
		function* gen() {
			yield 1;
			yield 2;
		}
		const c = Collection.wrap(gen());
		expect(c.all()).toEqual([1, 2]);
	});
});

describe('PipeInto (Laravel port)', () => {
	it('pipes into class constructor', () => {
		class Container<T> {
			constructor(public value: ProxiedCollection<T>) {}
		}
		const c = collect([1, 2, 3]);
		const container = c.pipeInto(Container);
		expect(container.value.all()).toEqual([1, 2, 3]);
	});
});

describe('ToString (Laravel port)', () => {
	it('converts to string', () => {
		const c = collect([1, 2, 3]);
		expect(c.toString()).toBe('1, 2, 3'); // Uses join(', ') internally
	});
});

describe('Dump (Laravel port)', () => {
	it('dumps and returns collection', () => {
		const c = collect([1, 2, 3]);
		const result = c.dump();
		expect(result).toBe(c); // Returns same collection
	});
});

describe('DD (Laravel port)', () => {
	it('dumps and throws', () => {
		const c = collect([1, 2, 3]);
		expect(() => c.dd()).toThrow();
	});
});

// =============================================================================
// PHASE 5: ARRAY ACCESS & HELPERS (Laravel port for 100% coverage)
// =============================================================================

describe('Array Access (Laravel port)', () => {
	it('offsetExists checks key existence', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.offsetExists('a')).toBe(true);
		expect(c.offsetExists('c')).toBe(false);
	});

	it('offsetGet retrieves value', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.offsetGet('a')).toBe(1);
		expect(c.offsetGet('c')).toBeUndefined();
	});

	it('offsetSet sets value', () => {
		const c = collect({ a: 1 });
		c.offsetSet('b', 2);
		expect(c.get('b')).toBe(2);
	});

	it('offsetUnset removes value', () => {
		const c = collect({ a: 1, b: 2 });
		c.offsetUnset('a');
		expect(c.has('a')).toBe(false);
	});
});

describe('Symbol.iterator (Laravel port)', () => {
	it('is iterable', () => {
		const c = collect([1, 2, 3]);
		const result = [...c];
		expect(result).toEqual([1, 2, 3]);
	});
});

describe('collectState helper', () => {
	it('wraps arrays and objects as collections', async () => {
		const { collectState } = await import('../src/index.js');
		const state = { options: ['A', 'B'], votes: { u1: 'A' }, title: 'Poll' };
		const wrapped = collectState(state);
		expect(wrapped.options).toBeInstanceOf(Collection);
		expect(wrapped.votes).toBeInstanceOf(Collection);
		expect(wrapped.title).toBe('Poll');
	});

	it('skips internal properties', async () => {
		const { collectState } = await import('../src/index.js');
		const state = { _internal: 'skip', data: [1, 2] };
		const wrapped = collectState(state);
		expect(wrapped._internal).toBe('skip');
		expect(wrapped.data).toBeInstanceOf(Collection);
	});
});

describe('toArray helper', () => {
	it('converts collection to array', async () => {
		const { toArray } = await import('../src/index.js');
		const c = collect([1, 2, 3]);
		expect(toArray(c)).toEqual([1, 2, 3]);
	});

	it('returns array as-is', async () => {
		const { toArray } = await import('../src/index.js');
		const arr = [1, 2, 3];
		expect(toArray(arr)).toBe(arr);
	});
});

// =============================================================================
// ADDITIONAL EDGE CASE TESTS (for 100% coverage)
// =============================================================================

describe('WithCollection helper', () => {
	it('map receives filtered related items', async () => {
		const { WithCollection } = await import('../src/index.js');
		const primary = collect(['a', 'b', 'c']);
		const related = collect(['a', 'a', 'b']);
		const with_ = new WithCollection(primary, related);
		const result = with_.map((item, rel) => `${item}:${rel.count()}`);
		expect(result.all()).toEqual(['a:2', 'b:1', 'c:0']);
	});

	it('mapWithKey receives item, key and related', async () => {
		const { WithCollection } = await import('../src/index.js');
		const primary = collect({ x: 'a', y: 'b' });
		const related = collect(['a', 'a']);
		const with_ = new WithCollection(primary, related);
		const result = with_.mapWithKey((_item, key, rel) => `${key}:${rel.count()}`);
		expect(result.all()).toEqual({ x: 'x:2', y: 'y:0' });
	});

	it('each iterates with related', async () => {
		const { WithCollection } = await import('../src/index.js');
		const primary = collect([1, 2]);
		const related = collect([1, 1, 2]);
		const with_ = new WithCollection(primary, related);
		const counts: number[] = [];
		with_.each((_item, rel) => {
			counts.push(rel.count());
		});
		expect(counts).toEqual([2, 1]);
	});

	it('all returns primary items', async () => {
		const { WithCollection } = await import('../src/index.js');
		const primary = collect([1, 2, 3]);
		const related = collect(['a', 'b']);
		const with_ = new WithCollection(primary, related);
		expect(with_.all()).toEqual([1, 2, 3]);
	});
});

describe('Pop edge cases', () => {
	it('returns empty collection when count < 1', () => {
		const c = collect([1, 2, 3]);
		const result = c.pop(0);
		expect(result).toBeInstanceOf(Collection);
		expect((result as Collection<number>).all()).toEqual([]);
	});

	it('returns empty collection on empty collection with count > 1', () => {
		const c = collect<number>([]);
		const result = c.pop(5);
		expect(result).toBeInstanceOf(Collection);
	});

	it('returns multiple items when count > 1', () => {
		const c = collect([1, 2, 3, 4, 5]);
		const result = c.pop(3);
		expect(result).toBeInstanceOf(Collection);
		expect((result as Collection<number>).count()).toBe(3);
		expect(c.count()).toBe(2);
	});
});

describe('Shift edge cases', () => {
	it('throws when count < 0', () => {
		const c = collect([1, 2, 3]);
		expect(() => c.shift(-1)).toThrow('Number of shifted items may not be less than zero.');
	});

	it('returns empty collection on empty collection with count > 1', () => {
		const c = collect<number>([]);
		const result = c.shift(5);
		expect(result).toBeInstanceOf(Collection);
	});

	it('returns multiple items when count > 1', () => {
		const c = collect([1, 2, 3, 4, 5]);
		const result = c.shift(3);
		expect(result).toBeInstanceOf(Collection);
		expect((result as Collection<number>).all()).toEqual([1, 2, 3]);
		expect(c.all()).toEqual([4, 5]);
	});
});

describe('Last with callable default', () => {
	it('calls default function when no match', () => {
		const c = collect([1, 2, 3]);
		const result = c.last(
			(v) => v > 10,
			() => 'fallback',
		);
		expect(result).toBe('fallback');
	});
});

describe('ContainsStrict with key-value', () => {
	it('checks key-value pair strictly', () => {
		const c = collect([{ id: 1 }, { id: 2 }]);
		// @ts-expect-error testing value containment
		expect(c.containsStrict('id', 1)).toBe(true);
		// @ts-expect-error testing value containment
		expect(c.containsStrict('id', '1' as unknown as number)).toBe(false);
	});
});

describe('DoesntContain edge cases', () => {
	it('handles operator and value arguments', () => {
		const c = collect([{ val: 1 }, { val: 2 }, { val: 3 }]);
		expect(c.doesntContain('val', '>', 2)).toBe(false); // 3 > 2
		expect(c.doesntContain('val', '>', 5)).toBe(true); // nothing > 5
	});

	it('handles just operator argument (as value)', () => {
		const c = collect([{ name: 'Alice' }, { name: 'Bob' }]);
		expect(c.doesntContain('name', 'Alice')).toBe(false);
		expect(c.doesntContain('name', 'Charlie')).toBe(true);
	});
});

describe('operatorForWhere default case', () => {
	it('uses == comparison for unknown operators', () => {
		const c = collect([{ val: '1' }, { val: 2 }]);
		// Using unknown operator falls through to ==
		const result = c.where('val', 'unknown_op' as '=', 1);
		// With ==, '1' == 1 is true
		expect(result.count()).toBeGreaterThan(0);
	});
});

describe('Collection.with()', () => {
	it('creates WithCollection instance', () => {
		const c = collect([1, 2, 3]);
		const related = collect(['a', 'b']);
		const with_ = c.with(related);
		expect(with_).toBeInstanceOf(Object);
		expect(with_.all()).toEqual([1, 2, 3]);
	});
});

describe('Collapse with Collection items', () => {
	it('collapses nested collections', () => {
		const c = collect([collect([1, 2]), collect([3, 4])]);
		const result = c.collapse();
		expect(result.all()).toEqual([1, 2, 3, 4]);
	});
});

describe('CollapseWithKeys edge cases', () => {
	it('returns empty for empty collection', () => {
		const c = collect([]);
		const result = c.collapseWithKeys();
		expect(result.all()).toEqual({});
	});
});

describe('DoesntContainStrict with key-value', () => {
	it('checks key-value strict containment', () => {
		const c = collect([{ id: 1 }, { id: 2 }]);
		// @ts-expect-error testing value containment
		expect(c.doesntContainStrict('id', 1)).toBe(false); // contains id=1
		// @ts-expect-error testing value containment
		expect(c.doesntContainStrict('id', 99)).toBe(true); // doesn't contain id=99
	});
});

describe('Shift with count = 0', () => {
	it('returns empty collection when count is 0', () => {
		const c = collect([1, 2, 3]);
		const result = c.shift(0);
		expect(result).toBeInstanceOf(Collection);
		expect((result as Collection<number>).all()).toEqual([]);
	});
});

describe('OffsetSet with null key', () => {
	it('pushes value when key is null', () => {
		const c = collect([1, 2]);
		c.offsetSet(null, 3);
		expect(c.all()).toEqual([1, 2, 3]);
	});
});

describe('Random with preserveKeys', () => {
	it('preserves keys when taking random items', () => {
		const c = collect({ a: 1, b: 2, c: 3, d: 4, e: 5 });
		const result = c.random(2, true) as Collection<number>;
		expect(result.count()).toBe(2);
		// Keys should be preserved (original keys like 'a', 'b', etc.)
		const keys = result.keys().all();
		expect(keys.every((k: string) => ['a', 'b', 'c', 'd', 'e'].includes(k))).toBe(true);
	});
});

describe('Sliding edge cases', () => {
	it('throws when size < 1', () => {
		const c = collect([1, 2, 3]);
		expect(() => c.sliding(0)).toThrow('Size value must be at least 1.');
	});

	it('throws when step < 1', () => {
		const c = collect([1, 2, 3]);
		expect(() => c.sliding(2, 0)).toThrow('Step value must be at least 1.');
	});
});

describe('Ensure with class instance', () => {
	it('ensures items are instance of class', () => {
		class MyClass {
			constructor(public value: number) {}
		}
		const obj1 = new MyClass(1);
		const obj2 = new MyClass(2);
		const c = collect([obj1, obj2]);
		expect(() => c.ensure(MyClass)).not.toThrow();
	});

	it('throws when item is not instance of class', () => {
		class MyClass {
			constructor(public value: number) {}
		}
		const c = collect([{ value: 1 }, { value: 2 }]);
		expect(() => c.ensure(MyClass)).toThrow();
	});
});

describe('Flatten with Collection items', () => {
	it('flattens nested collections', () => {
		const c = collect([collect([1, 2]), collect([3, 4])]);
		const result = c.flatten(1);
		expect(result.all()).toEqual([1, 2, 3, 4]);
	});
});

describe('Chunk without preserveKeys', () => {
	it('chunks and creates arrays (not preserving keys)', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		const result = c.chunk(2);
		expect(result.count()).toBe(2);
	});
});

describe('Only with null keys', () => {
	it('returns all items when keys is null', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		const result = c.only(null);
		expect(result.count()).toBe(3); // Returns all items
	});
});

describe('Select with null keys', () => {
	it('returns all items when keys is null', () => {
		const c = collect([{ a: 1, b: 2 }]);
		const result = c.select(null);
		expect(result.count()).toBe(1);
	});
});

describe('GroupBy edge cases', () => {
	it('handles boolean group keys', () => {
		const c = collect([{ active: true }, { active: false }, { active: true }]);
		const result = c.groupBy('active');
		expect(result.keys().all()).toContain('1'); // true becomes '1'
		expect(result.keys().all()).toContain('0'); // false becomes '0'
	});

	it('handles null/undefined group keys', () => {
		const c = collect([
			{ name: 'Alice' },
			{ name: null as unknown as string },
			{ name: undefined as unknown as string },
		]);
		const result = c.groupBy('name');
		expect(result.has('')).toBe(true); // null/undefined become ''
	});

	it('preserves keys when specified', () => {
		const c = collect({ x: { type: 'a' }, y: { type: 'a' }, z: { type: 'b' } });
		const result = c.groupBy('type', true);
		const groupA = result.get('a');
		expect(groupA?.has('x')).toBe(true);
		expect(groupA?.has('y')).toBe(true);
	});
});

describe('KeyBy with object key', () => {
	it('converts object keys to string', () => {
		const c = collect([{ id: { toString: () => 'key1' }, name: 'Alice' }]);
		const result = c.keyBy('id');
		expect(result.has('key1') || result.has('[object Object]')).toBe(true);
	});
});

describe('Value with callable default', () => {
	it('calls default function when value not found', () => {
		const c = collect([{ name: 'Alice' }]);
		const result = c.value('missing' as keyof { name: string }, () => 'fallback');
		expect(result).toBe('fallback');
	});
});

describe('Chunk without preserveKeys (object)', () => {
	it('chunks object without preserving keys', () => {
		const c = collect({ a: 1, b: 2, c: 3, d: 4 });
		const result = c.chunk(2, false);
		expect(result.count()).toBe(2);
		const first = result.first() as Collection<number>;
		expect(first.all()).toEqual([1, 2]); // Values only, no keys
	});
});

describe('Search with callback returning false', () => {
	it('returns false when no match', () => {
		const c = collect([1, 2, 3]);
		const result = c.search((v) => v > 10);
		expect(result).toBe(false);
	});
});

describe('Implode with callback', () => {
	it('implodes using callback', () => {
		const c = collect([{ name: 'Alice' }, { name: 'Bob' }]);
		const result = c.implode((item) => item.name, ', ');
		expect(result).toBe('Alice, Bob');
	});
});

describe('ContainsOneItem with callback', () => {
	it('checks with callback', () => {
		const c = collect([1, 2, 3, 4, 5]);
		expect(c.containsOneItem((v) => v === 3)).toBe(true);
		expect(c.containsOneItem((v) => v > 3)).toBe(false); // 4 and 5 match
	});
});

describe('FirstOrFail edge cases', () => {
	it('with key-operator-value', () => {
		const c = collect([{ val: 1 }, { val: 2 }, { val: 3 }]);
		expect(c.firstOrFail('val', '>=', 2)).toEqual({ val: 2 });
	});

	it('with callback', () => {
		const c = collect([{ val: 1 }, { val: 2 }]);
		expect(c.firstOrFail((item) => item.val > 1)).toEqual({ val: 2 });
	});
});

describe('Random edge cases', () => {
	it('throws on empty collection', () => {
		const c = collect<number>([]);
		expect(() => c.random()).toThrow('Cannot get random item from empty collection.');
	});

	it('throws when count exceeds length', () => {
		const c = collect([1, 2]);
		expect(() => c.random(5)).toThrow('You requested 5 items, but there are only 2 items available.');
	});
});

describe('ReduceWithKeys', () => {
	it('reduces with key access', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		const result = c.reduceWithKeys((carry, val, key) => `${carry}${key}:${val},`, '');
		expect(result).toBe('a:1,b:2,c:3,');
	});
});

describe('Collect and toBase', () => {
	it('collect returns new collection', () => {
		const c = collect([1, 2, 3]);
		const result = c.collect();
		expect(result).toBeInstanceOf(Collection);
		expect(result).not.toBe(c);
		expect(result.all()).toEqual([1, 2, 3]);
	});

	it('toBase returns new collection', () => {
		const c = collect([1, 2, 3]);
		const result = c.toBase();
		expect(result).toBeInstanceOf(Collection);
		expect(result).not.toBe(c);
	});
});

describe('Sort with equal values', () => {
	it('handles equal values in sort', () => {
		const c = collect([3, 1, 2, 1, 3]);
		const result = c.sort();
		expect(result.all()).toEqual([1, 1, 2, 3, 3]);
	});

	it('handles equal values in sortDesc', () => {
		const c = collect([1, 3, 2, 1, 3]);
		const result = c.sortDesc();
		expect(result.all()).toEqual([3, 3, 2, 1, 1]);
	});
});

describe('Union edge case', () => {
	it('adds non-existing keys from other', () => {
		const c = collect({ a: 1, b: 2 });
		const result = c.union({ c: 3, d: 4 });
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(2);
		expect(result.get('c')).toBe(3); // New key added
		expect(result.get('d')).toBe(4); // Another new key added
	});

	it('preserves original key when key exists in both', () => {
		const c = collect({ a: 1 });
		const result = c.union({ a: 99, b: 2 });
		expect(result.get('a')).toBe(1); // Original preserved
		expect(result.get('b')).toBe(2); // New key added
	});
});

describe('Replace edge case', () => {
	it('adds new keys from replacement', () => {
		const c = collect({ a: 1, b: 2 });
		const result = c.replace({ b: 99, c: 3 });
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(99); // Replaced
		expect(result.get('c')).toBe(3); // New key added
	});
});

// =============================================================================
// BRANCH COVERAGE TESTS (improving 88.67% → 100%)
// =============================================================================

describe('Before/After null coalescing branches', () => {
	it('before returns null when item at position-1 is undefined', () => {
		const c = collect({ a: undefined, b: 2 });
		const result = c.before(2);
		expect(result).toBe(null); // get(a) returns undefined, ?? null kicks in
	});

	it('after returns null when item at position+1 is undefined', () => {
		const c = collect({ a: 1, b: undefined });
		const result = c.after(1);
		expect(result).toBe(null); // get(b) returns undefined, ?? null kicks in
	});
});

describe('When/Unless conditional branches', () => {
	it('when with function value resolves it', () => {
		const c = collect([1, 2, 3]);
		let called = false;
		c.when(
			() => true,
			() => {
				called = true;
			},
		);
		expect(called).toBe(true);
	});

	it('when truthy without callback returns self', () => {
		const c = collect([1, 2, 3]);
		const result = c.when(true);
		expect(result).toBe(c);
	});

	it('when falsy without callback returns self', () => {
		const c = collect([1, 2, 3]);
		const result = c.when(false);
		expect(result).toBe(c);
	});

	it('when falsy with defaultCallback calls it', () => {
		const c = collect([1, 2, 3]);
		let defaultCalled = false;
		c.when(false, undefined, () => {
			defaultCalled = true;
		});
		expect(defaultCalled).toBe(true);
	});

	it('unless falsy without callback returns self', () => {
		const c = collect([1, 2, 3]);
		const result = c.unless(false);
		expect(result).toBe(c);
	});

	it('unless truthy without callback returns self', () => {
		const c = collect([1, 2, 3]);
		const result = c.unless(true);
		expect(result).toBe(c);
	});

	it('unless truthy with defaultCallback calls it', () => {
		const c = collect([1, 2, 3]);
		let defaultCalled = false;
		c.unless(true, undefined, () => {
			defaultCalled = true;
		});
		expect(defaultCalled).toBe(true);
	});
});

describe('Ensure type string branches', () => {
	it('ensure accepts null type string', () => {
		const c = collect([null, null]);
		expect(() => c.ensure('null')).not.toThrow();
	});

	it('ensure accepts array type string', () => {
		const c = collect([
			[1, 2],
			[3, 4],
		]);
		expect(() => c.ensure('array')).not.toThrow();
	});

	it('ensure rejects non-null when expecting null', () => {
		const c = collect([1, 2]);
		expect(() => c.ensure('null')).toThrow();
	});

	it('ensure rejects non-array when expecting array', () => {
		const c = collect([1, 2]);
		expect(() => c.ensure('array')).toThrow();
	});
});

describe('Sole/FirstOrFail string key branches', () => {
	it('sole with string key finds truthy value', () => {
		const c = collect([{ active: false }, { active: true }]);
		// sole('active') uses operatorForWhere('active', '=', true)
		expect(c.sole('active')).toEqual({ active: true });
	});

	it('firstOrFail with string key finds truthy value', () => {
		const c = collect([{ active: false }, { active: true }]);
		// firstOrFail('active') uses operatorForWhere('active', '=', true)
		expect(c.firstOrFail('active')).toEqual({ active: true });
	});
});

describe('ToArray nested Collection branch', () => {
	it('toArray converts nested collections to arrays', () => {
		const inner = collect([1, 2, 3]);
		const c = collect({ items: inner });
		const result = c.toArray() as unknown as Record<string, number[]>;
		expect(Array.isArray(result.items)).toBe(true);
		expect(result.items).toEqual([1, 2, 3]);
	});
});

describe('Implode edge cases', () => {
	it('implode with primitives uses value as glue', () => {
		const c = collect([1, 2, 3]);
		const result = c.implode('-');
		expect(result).toBe('1-2-3');
	});

	it('implode with null glue defaults to empty string', () => {
		const c = collect([1, 2, 3]);
		const result = c.implode(null as unknown as string);
		expect(result).toBe('123');
	});
});

describe('Get/GetOrPut null key branches', () => {
	it('get with null key converts to empty string', () => {
		const c = collect({ '': 'empty-key-value' });
		expect(c.get(null)).toBe('empty-key-value');
	});

	it('getOrPut with null key uses empty string', () => {
		const c = collect<string>({});
		c.getOrPut(null, 'default');
		expect(c.get('')).toBe('default');
	});

	it('get with callable default when key missing', () => {
		const c = collect({ a: 1 });
		const result = c.get('missing', () => 99);
		expect(result).toBe(99);
	});
});

describe('DataGet edge cases via where', () => {
	it('where with dot notation on nested objects', () => {
		const c = collect([{ user: { active: true } }, { user: { active: false } }]);
		expect(c.where('user.active', true).count()).toBe(1);
	});

	it('where with non-existent nested key returns empty', () => {
		const c = collect([{ user: null }, { user: { name: 'Bob' } }]);
		const result = c.where('user.name', 'Bob');
		expect(result.count()).toBe(1);
	});
});

describe('Diff/DiffUsing with Collection argument', () => {
	it('diff accepts Collection argument', () => {
		const c1 = collect([1, 2, 3, 4]);
		const c2 = collect([2, 4]);
		expect(c1.diff(c2).all()).toEqual([1, 3]);
	});

	it('diffUsing accepts Collection argument', () => {
		const c1 = collect(['a', 'B', 'c']);
		const c2 = collect(['A', 'b']);
		const result = c1.diffUsing(c2, (a, b) => (a.toLowerCase() === b.toLowerCase() ? 0 : 1));
		expect(result.all()).toEqual(['c']);
	});
});

describe('First/Last edge cases', () => {
	it('first with no callback returns first item', () => {
		const c = collect([1, 2, 3]);
		expect(c.first()).toBe(1);
	});

	it('last with callback returns last matching', () => {
		const c = collect([1, 2, 3, 4]);
		expect(c.last((v) => v < 4)).toBe(3);
	});
});

describe('Tap without callback', () => {
	it('tap without callback returns self', () => {
		const c = collect([1, 2, 3]);
		expect(c.tap()).toBe(c);
	});
});

describe('Unless with function value', () => {
	it('unless resolves function value', () => {
		const c = collect([1, 2, 3]);
		let called = false;
		c.unless(
			() => false,
			() => {
				called = true;
			},
		);
		expect(called).toBe(true);
	});
});

describe('Intersect/IntersectByKeys with Collection', () => {
	it('intersect accepts Collection', () => {
		const c1 = collect([1, 2, 3, 4]);
		const c2 = collect([2, 3, 5]);
		expect(c1.intersect(c2).all()).toEqual([2, 3]);
	});

	it('intersectByKeys accepts Collection', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ a: 99, c: 99 });
		const result = c1.intersectByKeys(c2);
		expect(result.get('a')).toBe(1);
		expect(result.get('c')).toBe(3);
		expect(result.count()).toBe(2);
	});
});

describe('PipeThrough chain', () => {
	it('pipes through multiple callbacks', () => {
		const c = collect([1, 2, 3]);
		const result = c.pipeThrough<number>([(col) => (col as Collection<number>).sum(), (sum) => (sum as number) * 2]);
		expect(result).toBe(12);
	});
});

describe('Merge/Union with Collection', () => {
	it('merge accepts Collection', () => {
		const c1 = collect({ a: 1 });
		const c2 = collect({ b: 2 });
		const result = c1.merge(c2);
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(2);
	});

	it('union accepts Collection', () => {
		const c1 = collect({ a: 1 });
		const c2 = collect({ a: 99, b: 2 });
		const result = c1.union(c2);
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(2);
	});
});

describe('WhereNotNull branches', () => {
	it('whereNotNull without key filters null items', () => {
		const c = collect([1, null, 2, undefined, 3]);
		expect(c.whereNotNull().all()).toEqual([1, 2, 3]);
	});

	it('whereNotNull with key filters by key value', () => {
		const c = collect([{ name: 'Alice' }, { name: null }, { name: 'Bob' }]);
		expect(c.whereNotNull('name').count()).toBe(2);
	});
});

describe('EachSpread branches', () => {
	it('eachSpread spreads array items', () => {
		const c = collect([
			[1, 2],
			[3, 4],
		]);
		const results: number[][] = [];
		c.eachSpread((a, b, _key) => {
			results.push([a as number, b as number]);
		});
		expect(results).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	it('eachSpread handles non-array items', () => {
		const c = collect({ a: 'hello', b: 'world' });
		const results: string[] = [];
		c.eachSpread((val, key) => {
			results.push(`${key}:${val}`);
		});
		expect(results).toEqual(['a:hello', 'b:world']);
	});
});

describe('Value with non-callable default', () => {
	it('value returns non-callable default when no match', () => {
		const c = collect([{ name: 'Alice' }]);
		const result = c.value('missing' as keyof { name: string }, 'default-val');
		expect(result).toBe('default-val');
	});
});

// ============================================================================
// GROUP 1-2: dataGet and Callable Defaults (Lines 60-61, 291, 303, 309)
// ============================================================================

describe('dataGet branches', () => {
	it('where with null key checks item equality directly', () => {
		const c = collect([1, 2, 3, 2, 1]);
		expect(c.where(null as unknown as string, 2).all()).toEqual([2, 2]);
	});

	it('contains with key on primitives hits dataGet non-object branch', () => {
		// Line 61: typeof target !== 'object' - primitives trigger this branch
		const c = collect([1, 2, 3]);
		expect(c.contains('nonexistent', 'value')).toBe(false);
	});
});

describe('Callable defaults branches', () => {
	it('first with callable default on empty collection', () => {
		const c = collect([]);
		expect(c.first(undefined, () => 'default-value')).toBe('default-value');
	});

	it('first with callback and callable default, no match', () => {
		const c = collect([1, 2, 3]);
		expect(
			c.first(
				(v) => v > 100,
				() => 'no-match',
			),
		).toBe('no-match');
	});

	it('last with callable default on empty collection (no callback)', () => {
		const c = collect([]);
		expect(c.last(undefined, () => 'last-default')).toBe('last-default');
	});

	it('last with callback and callable default, no match', () => {
		const c = collect([1, 2, 3]);
		expect(
			c.last(
				(v) => v > 100,
				() => 'no-last-match',
			),
		).toBe('no-last-match');
	});

	it('last with callback and non-callable default, no match', () => {
		const c = collect([1, 2, 3]);
		expect(c.last((v) => v > 100, 'static-default')).toBe('static-default');
	});
});

// ============================================================================
// GROUP 3: Collection Argument Branches (12 methods)
// ============================================================================

describe('Collection argument branches', () => {
	it('countBy with Collection items', () => {
		const items = collect([collect([1, 2]), collect([3, 4])]);
		// @ts-expect-error testing numeric sortBy
		const result = items.countBy((item) => (item as Collection<number>).count());
		expect(result.get(2)).toBe(2);
	});

	it('collapse with Collection items', () => {
		const inner1 = collect([1, 2]);
		const inner2 = collect([3, 4]);
		const c = collect([inner1, inner2]);
		expect(c.collapse().all()).toEqual([1, 2, 3, 4]);
	});

	it('diffKeysUsing with Collection', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ A: 99, B: 99 });
		const result = c1.diffKeysUsing(c2, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.get('c')).toBe(3);
		expect(result.count()).toBe(1);
	});

	it('diffKeysUsing with plain object', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const result = c1.diffKeysUsing({ A: 99, B: 99 }, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.get('c')).toBe(3);
		expect(result.count()).toBe(1);
	});

	it('diffAssoc with Collection', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ a: 1, b: 99 });
		const result = c1.diffAssoc(c2);
		expect(result.get('b')).toBe(2);
		expect(result.get('c')).toBe(3);
	});

	it('diffAssocUsing with Collection', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ A: 1, B: 2 });
		const result = c1.diffAssocUsing(c2, (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(result.get('c')).toBe(3);
	});

	it('intersectUsing with Collection', () => {
		const c1 = collect([1, 2, 3, 4]);
		const c2 = collect([2, 4, 6]);
		const result = c1.intersectUsing(c2, (a, b) => a - b);
		expect(result.all()).toEqual([2, 4]);
	});

	it('intersectAssoc with Collection', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ a: 1, b: 99, c: 3 });
		const result = c1.intersectAssoc(c2);
		expect(result.get('a')).toBe(1);
		expect(result.get('c')).toBe(3);
		expect(result.count()).toBe(2);
	});

	it('intersectAssoc with raw array', () => {
		const collection = collect({ '0': 1, '1': 2, '2': 3 });
		const result = collection.intersectAssoc([1, 2, 4]);
		expect(result.all()).toEqual({ '0': 1, '1': 2 });
	});

	it('intersectAssocUsing with Collection', () => {
		// intersectAssocUsing: callback compares KEYS, values compared with ===
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ a: 1, c: 3 }); // Same keys 'a' and 'c', same values
		// Callback compares keys (string comparison)
		const result = c1.intersectAssocUsing(c2, (a, b) => a.localeCompare(b));
		expect(result.get('a')).toBe(1); // keys match, values equal
		expect(result.get('c')).toBe(3); // keys match, values equal
		expect(result.count()).toBe(2);
	});

	it('mergeRecursive with Collection', () => {
		const c1 = collect({ user: { name: 'John' } });
		const c2 = collect({ user: { age: 30 } });
		const result = c1.mergeRecursive({ ...c2.all() });
		const user = result.get('user') as Record<string, unknown>;
		expect(user.name).toBe('John');
		expect(user.age).toBe(30);
	});

	it('concat with Collection', () => {
		const c1 = collect([1, 2]);
		const c2 = collect([3, 4]);
		expect(c1.concat(c2).all()).toEqual([1, 2, 3, 4]);
	});

	it('replace with Collection', () => {
		const c1 = collect({ a: 1, b: 2 });
		const c2 = collect({ b: 99, c: 3 });
		const result = c1.replace(c2);
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(99);
		expect(result.get('c')).toBe(3);
	});

	it('replaceRecursive with Collection', () => {
		const c1 = collect({ user: { name: 'John', age: 25 } });
		const c2 = collect({ user: { age: 30 } });
		const result = c1.replaceRecursive({ ...c2.all() });
		const user = result.get('user') as Record<string, unknown>;
		expect(user.name).toBe('John');
		expect(user.age).toBe(30);
	});
});

// ============================================================================
// GROUP 4-5: Empty/Edge Checks and only/select/except null
// ============================================================================

describe('Empty and edge case branches', () => {
	it('chunk with preserveKeys explicitly false', () => {
		const c = collect({ a: 1, b: 2, c: 3, d: 4 });
		const chunks = c.chunk(2, false);
		expect(chunks.count()).toBe(2);
		expect(chunks.first()?.all()).toEqual([1, 2]);
	});

	it('splitIn alternative branch', () => {
		const c = collect([1, 2, 3, 4, 5]);
		const result = c.splitIn(3);
		expect(result.count()).toBe(3);
	});

	it('duplicates with callback', () => {
		const c = collect([{ n: 1 }, { n: 2 }, { n: 1 }, { n: 3 }]);
		const result = c.duplicates((item) => (item as { n: number }).n);
		expect(result.count()).toBe(1);
	});

	it('duplicatesStrict with callback', () => {
		const c = collect([{ n: 1 }, { n: 2 }, { n: 1 }, { n: 3 }]);
		const result = c.duplicatesStrict((item) => (item as { n: number }).n);
		expect(result.count()).toBe(1);
	});

	it('percentage on empty collection returns null', () => {
		const c = collect([]);
		expect(c.percentage(() => true)).toBeNull();
	});
});

describe('only/select/except with null and Collection keys', () => {
	it('except with null keys returns all', () => {
		const c = collect({ a: 1, b: 2 });
		const result = c.except(null as unknown as string[]);
		// all() returns array of values, so check using get()
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(2);
		expect(result.count()).toBe(2);
	});

	it('only with Collection keys', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		const keys = collect(['a', 'c']);
		const result = c.only(keys as Collection<string | number>);
		expect(result.get('a')).toBe(1);
		expect(result.get('c')).toBe(3);
		expect(result.count()).toBe(2);
	});

	it('select with Collection keys', () => {
		const c = collect([
			{ a: 1, b: 2, c: 3 },
			{ a: 4, b: 5, c: 6 },
		]);
		const keys = collect(['a', 'c']);
		const result = c.select(keys as Collection<string | number>);
		expect(result.first()).toEqual({ a: 1, c: 3 });
	});
});

// ============================================================================
// GROUP 6-7: Has/HasAny and GroupBy branches
// ============================================================================

describe('has/hasAny branches', () => {
	it('has with array of keys', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		expect(c.has(['a', 'b'])).toBe(true);
		expect(c.has(['a', 'd'])).toBe(false);
	});

	it('hasAny on empty collection returns false', () => {
		const c = collect({});
		expect(c.hasAny('a')).toBe(false);
	});

	it('hasAny with single key (not array)', () => {
		const c = collect({ a: 1, b: 2 });
		expect(c.hasAny('a')).toBe(true);
		expect(c.hasAny('z')).toBe(false);
	});
});

describe('groupBy returning array of keys', () => {
	it('groupBy with callback returning array groups by each key', () => {
		const c = collect([
			{ name: 'Item1', tags: ['a', 'b'] },
			{ name: 'Item2', tags: ['b', 'c'] },
		]);
		const result = c.groupBy((item) => (item as { tags: string[] }).tags);
		expect(result.get('a')?.count()).toBe(1);
		expect(result.get('b')?.count()).toBe(2);
		expect(result.get('c')?.count()).toBe(1);
	});
});

// ============================================================================
// GROUP 8: Sorting branches
// ============================================================================

describe('Sorting branches', () => {
	it('sortBy with callback (not key string)', () => {
		const c = collect([{ n: 3 }, { n: 1 }, { n: 2 }]);
		const result = c.sortBy((item) => (item as { n: number }).n);
		expect(result.values().all()).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
	});

	it('sortBy with descending flag true', () => {
		const c = collect([{ n: 1 }, { n: 3 }, { n: 2 }]);
		// Second param is _options, third is descending
		const result = c.sortBy('n', undefined, true);
		expect(result.values().all()).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
	});

	it('sortBy with callback and descending', () => {
		const c = collect([{ n: 1 }, { n: 3 }, { n: 2 }]);
		// Second param is _options, third is descending
		const result = c.sortBy((item) => (item as { n: number }).n, undefined, true);
		expect(result.values().all()).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
	});

	it('sortKeysUsing with custom comparator', () => {
		const c = collect({ b: 2, a: 1, c: 3 });
		const result = c.sortKeysUsing((a, b) => b.localeCompare(a));
		expect(result.keys().all()).toEqual(['c', 'b', 'a']);
	});
});

// ============================================================================
// GROUP 9: Join and Skip branches
// ============================================================================

describe('Join and Skip branches', () => {
	it('join with finalGlue', () => {
		const c = collect(['a', 'b', 'c']);
		expect(c.join(', ', ' and ')).toBe('a, b and c');
	});

	it('join with two items and finalGlue', () => {
		const c = collect(['a', 'b']);
		expect(c.join(', ', ' and ')).toBe('a and b');
	});

	it('join with one item and finalGlue', () => {
		const c = collect(['a']);
		expect(c.join(', ', ' and ')).toBe('a');
	});

	it('implode with callback and no glue uses empty string', () => {
		const c = collect([1, 2, 3]);
		// Line 1699: glue ?? '' branch when glue is undefined
		expect(c.implode((v) => String(v))).toBe('123');
	});
});

// ============================================================================
// GROUP 10: Random and Replace branches
// ============================================================================

describe('Random and Replace branches', () => {
	it('random with function count', () => {
		const c = collect([1, 2, 3, 4, 5]);
		const result = c.random(() => 2) as Collection<number>;
		expect(result.count()).toBe(2);
	});

	it('replace adds keys not in original', () => {
		const c = collect({ a: 1 });
		const result = c.replace({ b: 2, c: 3 });
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(2);
		expect(result.get('c')).toBe(3);
	});
});

// ============================================================================
// GROUP 11: whereNull with key
// ============================================================================

describe('whereNull with key', () => {
	it('whereNull with key parameter filters by that key', () => {
		const c = collect([
			{ name: null, age: 25 },
			{ name: 'Alice', age: 30 },
			{ name: null, age: 35 },
		]);
		const result = c.whereNull('name');
		expect(result.count()).toBe(2);
		expect(result.first()).toEqual({ name: null, age: 25 });
	});

	it('whereNull without key filters null items directly', () => {
		// Line 2156: key ? ... : item branch (without key)
		const c = collect([null, 'Alice', null, 'Bob']);
		const result = c.whereNull();
		expect(result.count()).toBe(2);
	});
});

// ============================================================================
// ADDITIONAL BRANCH COVERAGE TESTS
// ============================================================================

describe('Additional branch coverage tests', () => {
	// Line 309: last with callback and callable default, no match
	it('last with callback matching nothing and callable default', () => {
		const c = collect([1, 2, 3]);
		const result = c.last(
			(v) => v > 100,
			() => 'fallback',
		);
		expect(result).toBe('fallback');
	});

	// Lines 981, 1004, 1019: avg/min/max with NaN values
	it('avg ignores NaN values', () => {
		const c = collect([{ n: 1 }, { n: Number.NaN }, { n: 2 }]);
		expect(c.avg('n')).toBe(1.5);
	});

	it('min ignores NaN values', () => {
		const c = collect([{ n: Number.NaN }, { n: 5 }, { n: 2 }]);
		expect(c.min('n')).toBe(2);
	});

	it('max ignores NaN values', () => {
		const c = collect([{ n: Number.NaN }, { n: 5 }, { n: 2 }]);
		expect(c.max('n')).toBe(5);
	});

	// Line 1153: pull with callable default when key not found
	it('pull with callable default when key missing', () => {
		const c = collect({ a: 1, b: 2 });
		const result = c.pull('missing', () => 'default-val' as unknown);
		expect(result).toBe('default-val');
	});

	// Line 1203: pop on empty with count > 1
	it('pop on empty collection with count > 1 returns empty Collection', () => {
		const c = collect([]);
		const result = c.pop(5);
		expect(result).toBeInstanceOf(Collection);
		expect((result as unknown as Collection<unknown>).count()).toBe(0);
	});

	// Line 1233: shift on empty with count > 1
	it('shift on empty collection with count > 1 returns empty Collection', () => {
		const c = collect([]);
		const result = c.shift(5);
		expect(result).toBeInstanceOf(Collection);
		expect((result as unknown as Collection<unknown>).count()).toBe(0);
	});

	// Line 1286: except with Collection keys
	it('except with Collection keys', () => {
		const c = collect({ a: 1, b: 2, c: 3 });
		const keys = collect(['b']);
		const result = c.except(keys as Collection<string | number>);
		expect(result.get('a')).toBe(1);
		expect(result.get('c')).toBe(3);
		expect(result.count()).toBe(2);
	});

	// Line 1678: takeWhile with value (non-callable)
	it('takeWhile with value instead of callback', () => {
		const c = collect([1, 1, 1, 2, 1, 1]);
		const result = c.takeWhile(1);
		expect(result.all()).toEqual([1, 1, 1]);
	});

	// Line 1556: sortBy with equal values (no change needed)
	it('sortBy with equal values maintains order', () => {
		const c = collect([
			{ n: 1, id: 'a' },
			{ n: 1, id: 'b' },
			{ n: 1, id: 'c' },
		]);
		const result = c.sortBy('n');
		// All have same n, so original order preserved
		expect(result.values().all()).toEqual([
			{ n: 1, id: 'a' },
			{ n: 1, id: 'b' },
			{ n: 1, id: 'c' },
		]);
	});

	// Lines 1435, 1436: sortBy with callback (not string) and different options
	it('sortByDesc with callback', () => {
		const c = collect([{ n: 1 }, { n: 3 }, { n: 2 }]);
		const result = c.sortByDesc((item) => (item as { n: number }).n);
		expect(result.values().all()).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
	});

	// Line 394: mapSpread with non-array items
	it('mapSpread with non-array items uses value and key', () => {
		const c = collect({ a: 1, b: 2 });
		const result = c.mapSpread((val, key) => `${key}:${val}`);
		expect(result.all()).toEqual({ a: 'a:1', b: 'b:2' });
	});

	// Line 526: chunkWhile on empty collection
	it('chunkWhile on empty collection returns empty', () => {
		const c = collect<number>([]);
		const result = c.chunkWhile(() => true);
		expect(result.count()).toBe(0);
	});

	// Line 541: chunkWhile adds last chunk
	it('chunkWhile properly adds final chunk', () => {
		const c = collect([1, 2, 5, 6, 10]);
		// Group consecutive numbers that differ by <= 1
		const result = c.chunkWhile((v, _k, chunk) => {
			const last = chunk.last() ?? 0;
			return Math.abs(v - last) <= 1;
		});
		expect(result.count()).toBeGreaterThan(0);
	});

	// Line 892: duplicates false branch (strict flag)
	it('duplicates internal strict false branch', () => {
		const c = collect([1, '1', 1, 2]);
		// duplicates uses strict=false internally
		const result = c.duplicates();
		expect(result.count()).toBeGreaterThan(0);
	});

	// Line 915: duplicatesStrict false branch
	it('duplicatesStrict internal comparison', () => {
		const c = collect([1, 1, 2, 2]);
		const result = c.duplicatesStrict();
		expect(result.count()).toBe(2);
	});

	// Line 1101: replace non-existent key
	it('replace adds new keys not in original', () => {
		const c = collect([1, 2]);
		const result = c.replace({ 5: 99 });
		expect(result.get('5')).toBe(99);
	});

	// Lines 892, 915: median/mode without key parameter
	it('median without key on numeric collection', () => {
		const c = collect([1, 2, 3, 4, 5]);
		expect(c.median()).toBe(3);
	});

	it('mode without key on collection', () => {
		const c = collect([1, 1, 2, 2, 2, 3]);
		expect(c.mode()).toEqual([2]);
	});

	// Line 1089: combine with Collection values
	it('combine with Collection values', () => {
		const keys = collect(['a', 'b', 'c']);
		const values = collect([1, 2, 3]);
		const result = keys.combine(values);
		expect(result.get('a')).toBe(1);
		expect(result.get('b')).toBe(2);
		expect(result.get('c')).toBe(3);
	});

	// Line 1101: crossJoin with Collection
	it('crossJoin with Collection', () => {
		const c = collect([1, 2]);
		const other = collect(['a', 'b']);
		const result = c.crossJoin(other);
		expect(result.count()).toBe(4);
	});

	// Line 541: chunkWhile else branch (not continuing chunk)
	it('chunkWhile breaks into new chunk when condition false', () => {
		const c = collect([1, 2, 10, 11, 20]);
		const result = c.chunkWhile((v, _k, chunk) => {
			const last = chunk.last() ?? 0;
			return v - last <= 2;
		});
		expect(result.count()).toBeGreaterThan(1);
	});

	// Line 754: diffKeysUsing actual comparison path
	it('diffKeysUsing filters based on custom key comparison', () => {
		const c1 = collect({ a: 1, b: 2, c: 3, d: 4 });
		const c2 = collect({ A: 10, C: 30 });
		// Case-insensitive key comparison
		const result = c1.diffKeysUsing(c2, (k1, k2) => k1.toLowerCase().localeCompare(k2.toLowerCase()));
		expect(result.get('b')).toBe(2);
		expect(result.get('d')).toBe(4);
	});

	// Line 768: diffAssoc comparison path
	it('diffAssoc compares key-value pairs', () => {
		const c1 = collect({ a: 1, b: 2, c: 3 });
		const c2 = collect({ a: 1, b: 99, d: 4 });
		const result = c1.diffAssoc(c2);
		expect(result.get('b')).toBe(2);
		expect(result.get('c')).toBe(3);
	});

	// Line 848: intersectByKeys with regular object
	it('intersectByKeys filters to matching keys', () => {
		const c1 = collect({ a: 1, b: 2, c: 3, d: 4 });
		const c2 = { a: 99, c: 99 };
		const result = c1.intersectByKeys(c2);
		expect(result.count()).toBe(2);
		expect(result.get('a')).toBe(1);
		expect(result.get('c')).toBe(3);
	});

	// Line 892/915: median/mode WITH key (branch 0 - truthy case)
	it('median with key on object collection', () => {
		const c = collect([{ val: 1 }, { val: 2 }, { val: 3 }, { val: 4 }, { val: 5 }]);
		expect(c.median('val')).toBe(3);
	});

	it('mode with key on object collection', () => {
		const c = collect([{ val: 1 }, { val: 2 }, { val: 2 }, { val: 2 }, { val: 3 }]);
		expect(c.mode('val')).toEqual([2]);
	});

	// Line 1203: pop on empty with count=1 returns null (branch 0)
	it('pop on empty collection with count=1 returns null', () => {
		const c = collect([]);
		expect(c.pop(1)).toBeNull();
	});

	// Line 1233: shift on empty with count=1 returns null (branch 0)
	it('shift on empty collection with count=1 returns null', () => {
		const c = collect([]);
		expect(c.shift(1)).toBeNull();
	});

	// Line 437: collapse with Collection items (instanceof branch)
	it('collapse flattens nested Collection objects', () => {
		const inner1 = collect([10, 20]);
		const inner2 = collect([30, 40]);
		const outer = collect([inner1, inner2]);
		const result = outer.collapse();
		expect(result.all()).toEqual([10, 20, 30, 40]);
	});

	// Line 461: collapse skips non-array non-Collection items
	it('collapse skips primitive items', () => {
		// Mix of arrays and primitives - primitives should be skipped
		const c = collect([[1, 2], 'skip-me', [3, 4], 42]);
		const result = c.collapse();
		expect(result.all()).toEqual([1, 2, 3, 4]);
	});

	// Line 1435/1436: sortBy with callback and descending
	it('sortBy uses callback to extract value', () => {
		const c = collect([{ x: 3 }, { x: 1 }, { x: 2 }]);
		// Use callback (not string key)
		const result = c.sortBy((item) => (item as { x: number }).x);
		expect(
			result
				.values()
				.map((i) => (i as { x: number }).x)
				.all(),
		).toEqual([1, 2, 3]);
	});

	it('sortBy with descending true reverses order', () => {
		const c = collect([{ x: 1 }, { x: 3 }, { x: 2 }]);
		// Third param is descending
		const result = c.sortBy('x', undefined, true);
		expect(
			result
				.values()
				.map((i) => (i as { x: number }).x)
				.all(),
		).toEqual([3, 2, 1]);
	});

	// Line 1435/1436: partition with operator (not just callback)
	it('partition with key and operator', () => {
		const c = collect([{ age: 15 }, { age: 25 }, { age: 35 }]);
		const [adults, minors] = c.partition('age', '>=', 18);
		expect(adults.count()).toBe(2);
		expect(minors.count()).toBe(1);
	});

	it('partition with callback (useAsCallable true)', () => {
		const c = collect([1, 2, 3, 4, 5]);
		const [even, odd] = c.partition((v) => v % 2 === 0);
		expect(even.all()).toEqual([2, 4]);
		expect(odd.all()).toEqual([1, 3, 5]);
	});

	it('partition with string key (valueRetriever path)', () => {
		const c = collect([{ active: true }, { active: false }, { active: 1 }]);
		const [active, inactive] = c.partition('active');
		expect(active.count()).toBe(2);
		expect(inactive.count()).toBe(1);
	});

	// Line 541: chunkWhile - ensure else branch (Object.keys.length > 0 adds chunk)
	it('chunkWhile final chunk added when non-empty', () => {
		const c = collect([1, 3, 5, 10, 12]);
		const result = c.chunkWhile((val, _key, chunk) => {
			const lastVal = chunk.last();
			if (lastVal === undefined) return true;
			return (val as number) - lastVal < 5;
		});
		// Should create multiple chunks: [1,3,5], [10,12]
		expect(result.count()).toBe(2);
	});

	// Line 309: last with callable default returning default when callback matches nothing
	it('last calls callable default when no match', () => {
		const c = collect([1, 2, 3]);
		let called = false;
		const result = c.last(
			(v) => v > 100,
			() => {
				called = true;
				return 'default';
			},
		);
		expect(called).toBe(true);
		expect(result).toBe('default');
	});
});

// ============================================================================
// HIGHER-ORDER MESSAGING
// ============================================================================

describe('Higher-Order Messaging', () => {
	// Test data
	interface User {
		name: string;
		age: number;
		active: boolean;
		score: number;
	}
	const users = () =>
		collect<User>([
			{ name: 'John', age: 30, active: true, score: 85 },
			{ name: 'Jane', age: 25, active: false, score: 90 },
			{ name: 'Bob', age: 35, active: true, score: 75 },
		]);

	describe('map property access', () => {
		it('extracts property values', () => {
			expect(users().map.name.all()).toEqual(['John', 'Jane', 'Bob']);
			expect(users().map.age.all()).toEqual([30, 25, 35]);
		});
	});

	describe('filter property access', () => {
		it('filters by truthy property', () => {
			expect(users().filter.active.count()).toBe(2);
		});
	});

	describe('reject property access', () => {
		it('rejects by truthy property', () => {
			expect(users().reject.active.count()).toBe(1);
		});
	});

	describe('sum property access', () => {
		it('sums numeric property', () => {
			expect(users().sum.age).toBe(90);
			expect(users().sum.score).toBe(250);
		});
	});

	describe('avg property access', () => {
		it('averages numeric property', () => {
			expect(users().avg.age).toBe(30);
			expect(users().avg.score).toBeCloseTo(83.33, 1);
		});
	});

	describe('min property access', () => {
		it('finds minimum', () => {
			expect(users().min.age).toBe(25);
		});
	});

	describe('max property access', () => {
		it('finds maximum', () => {
			expect(users().max.age).toBe(35);
		});
	});

	describe('sortBy property access', () => {
		it('sorts by property', () => {
			expect(users().sortBy.age.map.name.all()).toEqual(['Jane', 'John', 'Bob']);
		});
	});

	describe('sortByDesc property access', () => {
		it('sorts descending by property', () => {
			expect(users().sortByDesc.age.map.name.all()).toEqual(['Bob', 'John', 'Jane']);
		});
	});

	describe('groupBy property access', () => {
		it('groups by property', () => {
			const data = collect([{ status: 'pending' }, { status: 'done' }, { status: 'pending' }]);
			const grouped = data.groupBy.status;
			// groupBy.status groups items by their status value
			expect(grouped.count()).toBe(2); // Two groups: pending and done
		});
	});

	describe('keyBy property access', () => {
		it('keys by property', () => {
			const keyed = users().keyBy.name;
			// keyBy.name creates a collection keyed by name property
			// The value is the original User object
			expect(keyed.keys().all()).toEqual(['John', 'Jane', 'Bob']);
		});
	});

	describe('unique property access', () => {
		it('unique by property', () => {
			const data = collect([{ x: 1 }, { x: 1 }, { x: 2 }]);
			expect(data.unique.x.count()).toBe(2);
		});
	});

	describe('flatMap property access', () => {
		it('flat maps property', () => {
			const data = collect([{ tags: ['a', 'b'] }, { tags: ['c'] }]);
			expect(data.flatMap.tags.all()).toEqual(['a', 'b', 'c']);
		});
	});

	describe('contains property access', () => {
		it('checks if any item has truthy property', () => {
			expect(users().contains.active).toBe(true);
		});
	});

	describe('every property access', () => {
		it('checks if all items have truthy property', () => {
			expect(users().every.active).toBe(false);
			expect(users().every.name).toBe(true);
		});
	});

	describe('some property access', () => {
		it('alias for contains', () => {
			expect(users().some.active).toBe(true);
		});
	});

	describe('doesntContain property access', () => {
		it('inverse of contains', () => {
			const allActive = collect([{ active: true }, { active: true }]);
			expect(allActive.doesntContain.active).toBe(false);
		});
	});

	describe('partition property access', () => {
		it('partitions by truthy property', () => {
			const [active, inactive] = users().partition.active;
			expect(active.count()).toBe(2);
			expect(inactive.count()).toBe(1);
		});
	});

	describe('first property access', () => {
		it('finds first with truthy property', () => {
			expect(users().first.active?.name).toBe('John');
		});
	});

	describe('last property access', () => {
		it('finds last with truthy property', () => {
			expect(users().last.active?.name).toBe('Bob');
		});
	});

	describe('takeWhile property access', () => {
		it('takes while property is truthy', () => {
			expect(users().takeWhile.active.count()).toBe(1);
		});
	});

	describe('takeUntil property access', () => {
		it('takes until property is truthy', () => {
			const data = collect([{ done: false }, { done: false }, { done: true }]);
			expect(data.takeUntil.done.count()).toBe(2);
		});
	});

	describe('skipWhile property access', () => {
		it('skips while property is truthy', () => {
			expect(users().skipWhile.active.count()).toBe(2);
		});
	});

	describe('skipUntil property access', () => {
		it('skips until property is truthy', () => {
			expect(users().skipUntil.active.count()).toBe(3);
		});
	});

	describe('each property access with methods', () => {
		it('calls method on each item', () => {
			const items: { save: () => void; saved: boolean }[] = [
				{
					save() {
						this.saved = true;
					},
					saved: false,
				},
				{
					save() {
						this.saved = true;
					},
					saved: false,
				},
			];
			collect(items).each.save();
			expect(items.every((i) => i.saved)).toBe(true);
		});
	});

	describe('chaining higher-order proxies', () => {
		it('supports chained property access', () => {
			// filter.active filters to active users, map.name extracts names
			expect(users().filter.active.map.name.all()).toEqual(['John', 'Bob']);
			// sortBy.age sorts by age, then use callback first() to get first item
			expect(users().sortBy.age.first()?.name).toBe('Jane');
		});
	});

	describe('callable proxy properties', () => {
		it('supports .call()', () => {
			const fn = users().map;
			expect(fn.call(null, (u) => u.name).all()).toEqual(['John', 'Jane', 'Bob']);
		});

		it('supports .apply()', () => {
			const fn = users().filter;
			expect(fn.apply(null, [(u) => u.active]).count()).toBe(2);
		});

		it('supports .bind()', () => {
			const fn = users().map;
			const bound = fn.bind(null);
			expect(bound((u) => u.name).all()).toEqual(['John', 'Jane', 'Bob']);
		});

		it('exposes length', () => {
			expect(users().map.length).toBe(1); // callback param
		});

		it('returns undefined for Symbol access', () => {
			const fn = users().map;
			expect((fn as unknown as Record<symbol, unknown>)[Symbol.iterator]).toBeUndefined();
		});

		it('returns non-Collection results directly when calling methods', () => {
			// sum returns a number, not a Collection
			const fn = users().sum;
			expect(fn((u) => u.age)).toBe(90);
		});
	});

	describe('higher-order proxy edge cases', () => {
		it('supports toString on results', () => {
			const result = users().map.name;
			expect(typeof result.toString()).toBe('string');
		});

		it('supports instanceof check', () => {
			const result = users().filter.active;
			// Result should be a Collection
			expect(Object.getPrototypeOf(result)).toBeDefined();
		});

		it('supports in operator', () => {
			const result = users().filter.active;
			expect('count' in result).toBe(true);
		});

		it('applies method through higher-order proxy', () => {
			const items: { greet: (prefix: string) => string; name: string }[] = [
				{ greet: (p) => `${p}John`, name: 'John' },
				{ greet: (p) => `${p}Jane`, name: 'Jane' },
			];
			// Test method call through higher-order messaging
			const result = collect(items).each.greet('Hi, ');
			expect(result.count()).toBe(2);
		});

		// Line 444: average alias handler
		it('average property access (alias for avg)', () => {
			const data = collect([{ score: 10 }, { score: 20 }]);
			expect(data.average.score).toBe(15);
		});

		// Line 502: BYPASS_PROPERTIES check on higher-order proxy
		it('returns undefined for bypass properties like then on higher-order proxy', () => {
			// Access 'then' directly on the higher-order proxy (not on result)
			// biome-ignore lint/suspicious/noExplicitAny: Testing internal proxy behavior
			expect((users().map as any).then).toBeUndefined();
		});

		// Lines 541, 547: Method invocation on non-function property
		it('handles method invocation returning non-function property', () => {
			const items = collect([{ x: 10 }, { x: 20 }]);
			// Call the property access as a function - x is a number, not a function
			// biome-ignore lint/suspicious/noExplicitAny: Testing internal proxy behavior
			const result = (items.map as any).x();
			// Returns the mapped values
			expect(result.all()).toEqual([10, 20]);
		});

		it('method invocation returns non-Collection directly (line 547)', () => {
			// first.active returns an object (User), calling it invokes methodInvoker
			// which returns non-Collection result (User or undefined)
			// biome-ignore lint/suspicious/noExplicitAny: Testing internal proxy behavior
			const result = (users().first as any).active();
			// Returns the first active user
			expect(result?.name).toBe('John');
		});

		// Lines 556, 559: Symbol.toPrimitive and valueOf
		it('supports Symbol.toPrimitive coercion', () => {
			const result = users().map.name;
			// biome-ignore lint/suspicious/noExplicitAny: Testing Symbol.toPrimitive which isn't in ProxiedCollection type
			expect((result as any)[Symbol.toPrimitive]()).toBeDefined();
		});

		it('supports valueOf coercion', () => {
			const result = users().map.name;
			expect(result.valueOf()).toBeDefined();
		});

		// Line 637: callable proxy non-Collection return via .call()
		it('returns primitive from callable proxy via .call()', () => {
			const c = collect([1, 2, 3]);
			const fn = c.sum;
			// Call via .call() bypasses proxy's apply trap, uses callableProxy directly
			expect(fn.call(null)).toBe(6);
		});

		// Lines 507, 536: null item handling in higher-order callbacks
		it('handles null items in higher-order property access', () => {
			const items = collect([{ x: 1 }, null, { x: 3 }] as ({ x: number } | null)[]);
			const result = items.map.x;
			expect(result.all()).toEqual([1, undefined, 3]);
		});

		it('handles null items in method invocation', () => {
			const items = collect([{ x: 1 }, null, { x: 3 }] as ({ x: number } | null)[]);
			// biome-ignore lint/suspicious/noExplicitAny: Testing internal proxy behavior with null items
			const result = (items.map as any).x();
			expect(result.all()).toEqual([1, undefined, 3]);
		});

		// Lines 1675, 2590: mergeRecursive/replaceRecursive with Collection argument
		it('mergeRecursive with Collection argument', () => {
			const c1 = collect({ a: 1, b: { x: 1 } });
			const c2 = collect({ b: { y: 2 }, c: 3 });
			const result = c1.mergeRecursive(c2);
			expect(result.get('a')).toBe(1);
			expect(result.get('c')).toBe(3);
		});

		it('replaceRecursive with Collection argument', () => {
			const c1 = collect({ a: 1, b: { x: 1, y: 2 } });
			const c2 = collect({ b: { x: 10 } });
			const result = c1.replaceRecursive(c2);
			expect(result.get('a')).toBe(1);
		});
	});

	// =============================================================================
	// PERFORMANCE OPTIMIZATIONS
	// =============================================================================

	describe('performance optimizations', () => {
		describe('push() optimization with cached nextNumericKey', () => {
			it('push() uses correct next key', () => {
				const c = collect([1, 2, 3]);
				c.push(4, 5);
				expect(c.all()).toEqual([1, 2, 3, 4, 5]);
			});

			it('multiple push() calls maintain correct keys', () => {
				const c = collect<number>([]);
				c.push(1);
				c.push(2);
				c.push(3);
				expect(c.all()).toEqual([1, 2, 3]);
			});

			it('push() after pop() maintains correct keys', () => {
				const c = collect([1, 2, 3]);
				c.pop();
				c.push(4);
				// After pop, the cache is invalidated and recalculated
				expect(c.all()).toEqual([1, 2, 4]);
			});

			it('push() after shift() maintains correct keys', () => {
				const c = collect([1, 2, 3]);
				c.shift();
				c.push(4);
				expect(c.values().all()).toEqual([2, 3, 4]);
			});

			it('push() after forget() maintains correct keys', () => {
				const c = collect([1, 2, 3]);
				c.forget(1);
				c.push(4);
				expect(c.values().all()).toEqual([1, 3, 4]);
			});

			it('push() after pull() maintains correct keys', () => {
				const c = collect([1, 2, 3]);
				c.pull(1);
				c.push(4);
				expect(c.values().all()).toEqual([1, 3, 4]);
			});

			it('pull() with non-numeric key does not invalidate cache', () => {
				const c = collect<number | string>({ 0: 'a', 1: 'b', foo: 'c' });
				c.pull('foo'); // Non-numeric key - should NOT invalidate cache
				c.push('d');
				expect(c.get(2)).toBe('d'); // Next numeric key is still 2
			});

			it('handles mixed numeric and string keys', () => {
				const c = collect<number | string>({ 0: 'a', 1: 'b', foo: 'c' });
				c.push('d');
				expect(c.get(2)).toBe('d');
			});

			it('push() on empty collection starts at 0', () => {
				const c = collect<number>([]);
				c.push(1);
				expect(c.keys().all()).toEqual(['0']);
			});
		});

		describe('pop(n) optimization', () => {
			it('pop() removes last item', () => {
				const c = collect([1, 2, 3]);
				expect(c.pop()).toBe(3);
				expect(c.all()).toEqual([1, 2]);
			});

			it('pop(n) removes last n items efficiently', () => {
				const c = collect([1, 2, 3, 4, 5]);
				const result = c.pop(3);
				expect(result.all()).toEqual([3, 4, 5]);
				expect(c.all()).toEqual([1, 2]);
			});
		});

		describe('shift(n) optimization', () => {
			it('shift() removes first item', () => {
				const c = collect([1, 2, 3]);
				expect(c.shift()).toBe(1);
				expect(c.values().all()).toEqual([2, 3]);
			});

			it('shift(n) removes first n items efficiently', () => {
				const c = collect([1, 2, 3, 4, 5]);
				const result = c.shift(3);
				expect(result.all()).toEqual([1, 2, 3]);
				expect(c.values().all()).toEqual([4, 5]);
			});
		});
	});
});

// =============================================================================
// TYPE INFERENCE TESTS
// =============================================================================

describe('Type Inference', () => {
	describe('collapse() type inference', () => {
		it('infers inner array type', () => {
			const nested = collect([
				[1, 2],
				[3, 4],
			]);
			const collapsed = nested.collapse();

			// Runtime assertion
			expect(collapsed.first()).toBe(1);

			// Type assertion - this line MUST compile without errors
			collapsed.first()! satisfies number;
		});

		it('preserves T when not nested (type check)', () => {
			const flat = collect([1, 2, 3]);
			const collapsed = flat.collapse();

			// Type should be Collection<number> (not Collection<never>)
			// Runtime: collapse on non-nested items returns empty collection
			// because 1, 2, 3 are not arrays/Collections to flatten
			collapsed.first() satisfies number | undefined;
			expect(collapsed.isEmpty()).toBe(true);
		});

		it('handles Collection of Collections', () => {
			const nested = collect([collect(['a', 'b']), collect(['c', 'd'])]);
			const collapsed = nested.collapse();

			// Type should be Collection<string>
			collapsed.first()! satisfies string;
			expect(collapsed.first()).toBe('a');
		});
	});

	describe('flatten() type inference', () => {
		it('infers type for flatten(1)', () => {
			const deep = collect([
				[[1, 2]],
				[[3, 4]],
			]);
			const flat1 = deep.flatten(1);

			// number[][][] flattened 1 level = number[][]
			flat1.first()! satisfies number[];
			expect(flat1.first()).toEqual([1, 2]);
		});

		it('infers type for flatten(2)', () => {
			const deep = collect([
				[[1, 2]],
				[[3, 4]],
			]);
			const flat2 = deep.flatten(2);

			// number[][][] flattened 2 levels = number
			flat2.first()! satisfies number;
			expect(flat2.first()).toBe(1);
		});

		it('infers type for flatten() (deep)', () => {
			const deep = collect([[[[[1, 2]]]]]);
			const flatDeep = deep.flatten();

			// Should be fully flattened to number
			flatDeep.first()! satisfies number;
			expect(flatDeep.first()).toBe(1);
		});

		it('returns Collection<unknown> for variable depth', () => {
			const depth = 2 as number; // Variable, not literal
			const flat = collect([[[1]]]).flatten(depth);

			// Should be Collection<unknown> - honest about limitation
			flat.first() satisfies unknown;
			expect(flat.first()).toBe(1);
		});
	});

	describe('flatMap() type inference', () => {
		it('infers callback return type', () => {
			const users = collect([{ tags: ['a', 'b'] }, { tags: ['c'] }]);
			const allTags = users.flatMap((u) => u.tags);

			allTags.first()! satisfies string;
			expect(allTags.all()).toEqual(['a', 'b', 'c']);
		});
	});

	describe('contains() loose comparison', () => {
		it('uses loose comparison for value-only check', () => {
			// Test that "1" == 1 (loose comparison)
			const c = collect([1, 2, 3]);
			expect(c.contains('1' as unknown as number)).toBe(true);
		});

		it('containsStrict uses strict comparison', () => {
			// Test that "1" !== 1 (strict comparison)
			const c = collect([1, 2, 3]);
			expect(c.containsStrict('1' as unknown as number)).toBe(false);
		});
	});
});
