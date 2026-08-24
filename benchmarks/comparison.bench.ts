import { bench, describe } from 'vitest';
import { Collection } from '../src/Collection.js';

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, name: `user-${i}`, value: Math.random() }));

describe('map 10K items', () => {
	bench('Native JS', () => {
		items.map((x) => x.value * 2);
	});

	bench('Collection', () => {
		new Collection(items).map((x) => x.value * 2).all();
	});
});

describe('filter 10K items', () => {
	bench('Native JS', () => {
		items.filter((x) => x.value > 0.5);
	});

	bench('Collection', () => {
		new Collection(items).filter((x) => x.value > 0.5).all();
	});
});

describe('filter + map + take(100)', () => {
	bench('Native JS', () => {
		items
			.filter((x) => x.value > 0.3)
			.map((x) => x.value * 2)
			.slice(0, 100);
	});

	bench('Collection', () => {
		new Collection(items)
			.filter((x) => x.value > 0.3)
			.map((x) => x.value * 2)
			.take(100)
			.all();
	});
});

describe('find first matching', () => {
	bench('Native JS', () => {
		items.find((x) => x.id === 500);
	});

	bench('Collection', () => {
		new Collection(items).first((x) => x.id === 500);
	});
});

describe('reduce (sum)', () => {
	bench('Native JS', () => {
		items.reduce((acc, x) => acc + x.value, 0);
	});

	bench('Collection', () => {
		new Collection(items).sum('value');
	});
});

describe('pluck values', () => {
	bench('Native JS', () => {
		items.map((x) => x.name);
	});

	bench('Collection', () => {
		new Collection(items).pluck('name').all();
	});
});

describe('groupBy key', () => {
	const grouped = items.map((x, i) => ({ ...x, category: i % 10 }));

	bench('Native JS', () => {
		const result: Record<number, typeof grouped> = {};
		for (const item of grouped) {
			// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic groupBy
			(result[item.category] ??= []).push(item);
		}
		return result;
	});

	bench('Collection', () => {
		new Collection(grouped).groupBy('category');
	});
});

describe('unique by key', () => {
	const dupes = items.map((x, i) => ({ ...x, category: i % 100 }));

	bench('Native JS', () => {
		const seen = new Set();
		return dupes.filter((x) => {
			if (seen.has(x.category)) return false;
			seen.add(x.category);
			return true;
		});
	});

	bench('Collection', () => {
		new Collection(dupes).unique('category').all();
	});
});

describe('sort by key', () => {
	bench('Native JS', () => {
		[...items].sort((a, b) => a.value - b.value);
	});

	bench('Collection', () => {
		new Collection(items).sortBy('value').all();
	});
});

describe('chained: where + pluck + unique + sort', () => {
	bench('Native JS', () => {
		const filtered = items.filter((x) => x.value > 0.5);
		const names = filtered.map((x) => x.name);
		const unique = [...new Set(names)];
		unique.sort();
		return unique;
	});

	bench('Collection', () => {
		new Collection(items).where('value', '>', 0.5).pluck('name').unique().sort().all();
	});
});
