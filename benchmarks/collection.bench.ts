import { bench, describe } from 'vitest';
import { collect } from '../src/index.js';

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, value: Math.random() }));

describe('Collection', () => {
	bench('map', () => {
		collect(items).map((x) => x.value * 2);
	});

	bench('filter', () => {
		collect(items).filter((x) => x.value > 0.5);
	});

	bench('reduce', () => {
		collect(items).reduce((acc, x) => acc + x.value, 0);
	});

	bench('chained', () => {
		collect(items)
			.filter((x) => x.value > 0.3)
			.map((x) => x.value * 2)
			.take(100)
			.sum();
	});
});
