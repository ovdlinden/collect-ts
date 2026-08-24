import { describe, expect, it } from 'vitest';
import {
	arrayContains,
	arrayFilterByKey,
	arrayFilterBySet,
	arrayFindByKey,
	arrayGroupByKey,
	arrayMapByKey,
} from '../src/arrayUtils.js';

describe('arrayFilterByKey', () => {
	const items = [
		{ id: 1, active: true, score: 10 },
		{ id: 2, active: false, score: 20 },
		{ id: 3, active: true, score: 30 },
		{ id: 4, active: false, score: 10 },
	];

	it('filters with loose equality (default)', () => {
		expect(arrayFilterByKey(items, 'score', '10')).toEqual([items[0], items[3]]);
		expect(arrayFilterByKey(items, 'score', 10)).toEqual([items[0], items[3]]);
	});

	it('filters with strict equality (===)', () => {
		expect(arrayFilterByKey(items, 'score', '10', '===')).toEqual([]);
		expect(arrayFilterByKey(items, 'score', 10, '===')).toEqual([items[0], items[3]]);
	});

	it('filters with != operator', () => {
		expect(arrayFilterByKey(items, 'active', true, '!=')).toEqual([items[1], items[3]]);
	});

	it('filters with <> operator (alias for !=)', () => {
		expect(arrayFilterByKey(items, 'active', true, '<>')).toEqual([items[1], items[3]]);
	});

	it('filters with > operator', () => {
		expect(arrayFilterByKey(items, 'score', 15, '>')).toEqual([items[1], items[2]]);
	});

	it('filters with < operator', () => {
		expect(arrayFilterByKey(items, 'score', 15, '<')).toEqual([items[0], items[3]]);
	});

	it('filters with >= operator', () => {
		expect(arrayFilterByKey(items, 'score', 20, '>=')).toEqual([items[1], items[2]]);
	});

	it('filters with <= operator', () => {
		expect(arrayFilterByKey(items, 'score', 20, '<=')).toEqual([items[0], items[1], items[3]]);
	});

	it('handles empty array', () => {
		expect(arrayFilterByKey([], 'id', 1)).toEqual([]);
	});

	it('handles no matches', () => {
		expect(arrayFilterByKey(items, 'id', 999)).toEqual([]);
	});

	it('handles single element array', () => {
		expect(arrayFilterByKey([items[0]], 'id', 1)).toEqual([items[0]]);
		expect(arrayFilterByKey([items[0]], 'id', 2)).toEqual([]);
	});
});

describe('arrayFilterBySet', () => {
	const items = [1, 2, 3, 4, 5];

	it('includes items in set', () => {
		const set = new Set([2, 4]);
		expect(arrayFilterBySet(items, set, true)).toEqual([2, 4]);
	});

	it('excludes items in set', () => {
		const set = new Set([2, 4]);
		expect(arrayFilterBySet(items, set, false)).toEqual([1, 3, 5]);
	});

	it('handles empty array', () => {
		expect(arrayFilterBySet([], new Set([1, 2]), true)).toEqual([]);
	});

	it('handles empty set', () => {
		expect(arrayFilterBySet(items, new Set(), true)).toEqual([]);
		expect(arrayFilterBySet(items, new Set(), false)).toEqual(items);
	});

	it('handles single element', () => {
		expect(arrayFilterBySet([3], new Set([3]), true)).toEqual([3]);
		expect(arrayFilterBySet([3], new Set([3]), false)).toEqual([]);
	});
});

describe('arrayMapByKey', () => {
	const items = [
		{ id: 1, name: 'Alice' },
		{ id: 2, name: 'Bob' },
		{ id: 3, name: 'Charlie' },
	];

	it('maps (plucks) values by key', () => {
		expect(arrayMapByKey(items, 'id')).toEqual([1, 2, 3]);
		expect(arrayMapByKey(items, 'name')).toEqual(['Alice', 'Bob', 'Charlie']);
	});

	it('handles empty array', () => {
		expect(arrayMapByKey([], 'id')).toEqual([]);
	});

	it('handles single element', () => {
		expect(arrayMapByKey([items[0]], 'name')).toEqual(['Alice']);
	});

	it('handles undefined values', () => {
		const itemsWithUndefined = [
			{ id: 1, name: undefined },
			{ id: 2, name: 'Bob' },
		];
		expect(arrayMapByKey(itemsWithUndefined, 'name')).toEqual([undefined, 'Bob']);
	});
});

describe('arrayFindByKey', () => {
	const items = [
		{ id: 1, active: true, score: 10 },
		{ id: 2, active: false, score: 20 },
		{ id: 3, active: true, score: 30 },
	];

	it('finds with loose equality (default)', () => {
		expect(arrayFindByKey(items, 'id', '2')).toBe(items[1]);
		expect(arrayFindByKey(items, 'id', 2)).toBe(items[1]);
	});

	it('finds with strict equality (===)', () => {
		expect(arrayFindByKey(items, 'id', '2', '===')).toBeUndefined();
		expect(arrayFindByKey(items, 'id', 2, '===')).toBe(items[1]);
	});

	it('finds with > operator', () => {
		expect(arrayFindByKey(items, 'score', 15, '>')).toBe(items[1]);
	});

	it('finds with < operator', () => {
		expect(arrayFindByKey(items, 'score', 15, '<')).toBe(items[0]);
	});

	it('finds with >= operator', () => {
		expect(arrayFindByKey(items, 'score', 20, '>=')).toBe(items[1]);
	});

	it('finds with <= operator', () => {
		expect(arrayFindByKey(items, 'score', 10, '<=')).toBe(items[0]);
	});

	it('finds with != operator', () => {
		expect(arrayFindByKey(items, 'active', true, '!=')).toBe(items[1]);
	});

	it('returns undefined for empty array', () => {
		expect(arrayFindByKey([], 'id', 1)).toBeUndefined();
	});

	it('returns undefined when not found', () => {
		expect(arrayFindByKey(items, 'id', 999)).toBeUndefined();
	});

	it('returns first match when multiple exist', () => {
		expect(arrayFindByKey(items, 'active', true)).toBe(items[0]);
	});
});

describe('arrayContains', () => {
	it('finds primitive values with loose equality', () => {
		expect(arrayContains([1, 2, 3], 2)).toBe(true);
		expect(arrayContains([1, 2, 3], '2')).toBe(true);
		expect(arrayContains([1, 2, 3], 4)).toBe(false);
	});

	it('handles empty array', () => {
		expect(arrayContains([], 1)).toBe(false);
	});

	it('handles null and undefined', () => {
		expect(arrayContains([null, 1, 2], null)).toBe(true);
		expect(arrayContains([undefined, 1, 2], undefined)).toBe(true);
		expect(arrayContains([null], undefined)).toBe(true);
	});

	it('handles single element array', () => {
		expect(arrayContains([5], 5)).toBe(true);
		expect(arrayContains([5], 6)).toBe(false);
	});

	it('handles boolean values', () => {
		expect(arrayContains([true, false], true)).toBe(true);
		expect(arrayContains([true, false], 1)).toBe(true);
		expect(arrayContains([true, false], 0)).toBe(true);
	});
});

describe('arrayGroupByKey', () => {
	const items = [
		{ id: 1, category: 'a', active: true },
		{ id: 2, category: 'b', active: false },
		{ id: 3, category: 'a', active: true },
		{ id: 4, category: 'c', active: false },
	];

	it('groups items by string key', () => {
		const groups = arrayGroupByKey(items, 'category');
		expect(groups.size).toBe(3);
		expect(groups.get('a')).toEqual([items[0], items[2]]);
		expect(groups.get('b')).toEqual([items[1]]);
		expect(groups.get('c')).toEqual([items[3]]);
	});

	it('groups items by boolean key (converts to "1"/"0")', () => {
		const groups = arrayGroupByKey(items, 'active');
		expect(groups.size).toBe(2);
		expect(groups.get('1')).toEqual([items[0], items[2]]);
		expect(groups.get('0')).toEqual([items[1], items[3]]);
	});

	it('handles empty array', () => {
		const groups = arrayGroupByKey([], 'category');
		expect(groups.size).toBe(0);
	});

	it('handles single element', () => {
		const groups = arrayGroupByKey([items[0]], 'category');
		expect(groups.size).toBe(1);
		expect(groups.get('a')).toEqual([items[0]]);
	});

	it('handles null/undefined values (converts to empty string)', () => {
		const itemsWithNull = [
			{ id: 1, category: null },
			{ id: 2, category: undefined },
			{ id: 3, category: 'a' },
		];
		const groups = arrayGroupByKey(itemsWithNull, 'category');
		expect(groups.size).toBe(2);
		expect(groups.get('')).toEqual([itemsWithNull[0], itemsWithNull[1]]);
		expect(groups.get('a')).toEqual([itemsWithNull[2]]);
	});

	it('handles numeric keys (converts to string)', () => {
		const itemsWithNumeric = [
			{ id: 1, code: 100 },
			{ id: 2, code: 200 },
			{ id: 3, code: 100 },
		];
		const groups = arrayGroupByKey(itemsWithNumeric, 'code');
		expect(groups.size).toBe(2);
		expect(groups.get('100')).toEqual([itemsWithNumeric[0], itemsWithNumeric[2]]);
		expect(groups.get('200')).toEqual([itemsWithNumeric[1]]);
	});
});
