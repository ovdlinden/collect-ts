import { bench, describe } from 'vitest';
import { STABLE_BENCH } from './bench-options.js';

const items = Array.from({ length: 10_000 }, () => ({ value: Math.random() }));

describe('sum: reduce vs for loop', () => {
	bench('array.reduce (callback)', () => {
		items.reduce((acc, x) => acc + x.value, 0);
	}, STABLE_BENCH);

	bench('for loop (no callback)', () => {
		let total = 0;
		for (let i = 0; i < items.length; i++) {
			total += items[i].value;
		}
		return total;
	}, STABLE_BENCH);
});

describe('unique: filter+Set vs for loop+Set', () => {
	const dupes = items.map((x, i) => ({ ...x, category: i % 100 }));

	bench('array.filter (callback)', () => {
		const seen = new Set();
		dupes.filter((x) => {
			if (seen.has(x.category)) return false;
			seen.add(x.category);
			return true;
		});
	}, STABLE_BENCH);

	bench('for loop (no callback)', () => {
		const seen = new Set();
		const result: typeof dupes = [];
		for (let i = 0; i < dupes.length; i++) {
			const k = dupes[i].category;
			if (!seen.has(k)) {
				seen.add(k);
				result.push(dupes[i]);
			}
		}
		return result;
	}, STABLE_BENCH);
});

describe('find: array.find vs for loop', () => {
	bench('array.find (callback)', () => {
		items.find((x) => x.value > 0.9999);
	}, STABLE_BENCH);

	bench('for loop (no callback)', () => {
		for (let i = 0; i < items.length; i++) {
			if (items[i].value > 0.9999) return items[i];
		}
		return undefined;
	}, STABLE_BENCH);
});
