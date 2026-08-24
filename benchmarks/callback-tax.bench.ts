/**
 * Callback Tax Benchmarks
 *
 * Measures the overhead of native array methods that use callbacks
 * vs for-loops with direct index access.
 *
 * Operations tested: sum, filter, map, unique, groupBy, pluck
 * Scales: 1K, 10K, 100K items
 * Callback types: simple expression, closure capturing external state
 */

import { bench, describe } from 'vitest';

// Generate test data at different scales
const generate = (n: number) =>
	Array.from({ length: n }, (_, i) => ({
		id: i,
		value: Math.random() * 100,
		category: `cat-${i % 50}`,
		active: i % 3 !== 0,
	}));

const data1K = generate(1_000);
const data10K = generate(10_000);
const data100K = generate(100_000);

// External state for closure tests
const threshold = 50;
const categories = new Set(['cat-0', 'cat-1', 'cat-2', 'cat-3', 'cat-4']);

// ============================================================================
// SUM - reduce vs for loop
// ============================================================================

describe('sum @ 1K', () => {
	bench('native reduce', () => {
		data1K.reduce((acc, x) => acc + x.value, 0);
	});
	bench('for loop', () => {
		let total = 0;
		for (let i = 0; i < data1K.length; i++) total += data1K[i].value;
		return total;
	});
});

describe('sum @ 10K', () => {
	bench('native reduce', () => {
		data10K.reduce((acc, x) => acc + x.value, 0);
	});
	bench('for loop', () => {
		let total = 0;
		for (let i = 0; i < data10K.length; i++) total += data10K[i].value;
		return total;
	});
});

describe('sum @ 100K', () => {
	bench('native reduce', () => {
		data100K.reduce((acc, x) => acc + x.value, 0);
	});
	bench('for loop', () => {
		let total = 0;
		for (let i = 0; i < data100K.length; i++) total += data100K[i].value;
		return total;
	});
});

// ============================================================================
// FILTER - simple callback vs closure vs for loop
// ============================================================================

describe('filter (simple) @ 10K', () => {
	bench('native filter', () => {
		data10K.filter((x) => x.value > 50);
	});
	bench('for loop', () => {
		const result: typeof data10K = [];
		for (let i = 0; i < data10K.length; i++) {
			if (data10K[i].value > 50) result.push(data10K[i]);
		}
		return result;
	});
});

describe('filter (closure) @ 10K', () => {
	bench('native filter', () => {
		data10K.filter((x) => x.value > threshold);
	});
	bench('for loop', () => {
		const result: typeof data10K = [];
		for (let i = 0; i < data10K.length; i++) {
			if (data10K[i].value > threshold) result.push(data10K[i]);
		}
		return result;
	});
});

describe('filter (complex closure) @ 10K', () => {
	bench('native filter', () => {
		data10K.filter((x) => categories.has(x.category) && x.value > threshold);
	});
	bench('for loop', () => {
		const result: typeof data10K = [];
		for (let i = 0; i < data10K.length; i++) {
			if (categories.has(data10K[i].category) && data10K[i].value > threshold) {
				result.push(data10K[i]);
			}
		}
		return result;
	});
});

describe('filter @ 100K', () => {
	bench('native filter', () => {
		data100K.filter((x) => x.value > threshold);
	});
	bench('for loop', () => {
		const result: typeof data100K = [];
		for (let i = 0; i < data100K.length; i++) {
			if (data100K[i].value > threshold) result.push(data100K[i]);
		}
		return result;
	});
});

// ============================================================================
// MAP - transform each element
// ============================================================================

describe('map (simple) @ 10K', () => {
	bench('native map', () => {
		data10K.map((x) => x.value * 2);
	});
	bench('for loop', () => {
		const result: number[] = [];
		for (let i = 0; i < data10K.length; i++) {
			result.push(data10K[i].value * 2);
		}
		return result;
	});
});

describe('map (object transform) @ 10K', () => {
	bench('native map', () => {
		data10K.map((x) => ({ id: x.id, doubled: x.value * 2 }));
	});
	bench('for loop', () => {
		const result: { id: number; doubled: number }[] = [];
		for (let i = 0; i < data10K.length; i++) {
			result.push({ id: data10K[i].id, doubled: data10K[i].value * 2 });
		}
		return result;
	});
});

describe('map @ 100K', () => {
	bench('native map', () => {
		data100K.map((x) => x.value * 2);
	});
	bench('for loop', () => {
		const result: number[] = [];
		for (let i = 0; i < data100K.length; i++) {
			result.push(data100K[i].value * 2);
		}
		return result;
	});
});

// ============================================================================
// UNIQUE - deduplicate by key
// ============================================================================

describe('unique @ 10K', () => {
	bench('native filter+Set', () => {
		const seen = new Set<string>();
		data10K.filter((x) => {
			if (seen.has(x.category)) return false;
			seen.add(x.category);
			return true;
		});
	});
	bench('for loop', () => {
		const seen = new Set<string>();
		const result: typeof data10K = [];
		for (let i = 0; i < data10K.length; i++) {
			const cat = data10K[i].category;
			if (!seen.has(cat)) {
				seen.add(cat);
				result.push(data10K[i]);
			}
		}
		return result;
	});
});

describe('unique @ 100K', () => {
	bench('native filter+Set', () => {
		const seen = new Set<string>();
		data100K.filter((x) => {
			if (seen.has(x.category)) return false;
			seen.add(x.category);
			return true;
		});
	});
	bench('for loop', () => {
		const seen = new Set<string>();
		const result: typeof data100K = [];
		for (let i = 0; i < data100K.length; i++) {
			const cat = data100K[i].category;
			if (!seen.has(cat)) {
				seen.add(cat);
				result.push(data100K[i]);
			}
		}
		return result;
	});
});

// ============================================================================
// GROUPBY - group items by key
// ============================================================================

describe('groupBy @ 10K', () => {
	bench('native reduce', () => {
		data10K.reduce(
			(acc, x) => {
				// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic groupBy
				(acc[x.category] ??= []).push(x);
				return acc;
			},
			{} as Record<string, typeof data10K>,
		);
	});
	bench('for loop', () => {
		const result: Record<string, typeof data10K> = {};
		for (let i = 0; i < data10K.length; i++) {
			const cat = data10K[i].category;
			// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic groupBy
			(result[cat] ??= []).push(data10K[i]);
		}
		return result;
	});
});

describe('groupBy @ 100K', () => {
	bench('native reduce', () => {
		data100K.reduce(
			(acc, x) => {
				// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic groupBy
				(acc[x.category] ??= []).push(x);
				return acc;
			},
			{} as Record<string, typeof data100K>,
		);
	});
	bench('for loop', () => {
		const result: Record<string, typeof data100K> = {};
		for (let i = 0; i < data100K.length; i++) {
			const cat = data100K[i].category;
			// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic groupBy
			(result[cat] ??= []).push(data100K[i]);
		}
		return result;
	});
});

// ============================================================================
// PLUCK - extract single property
// ============================================================================

describe('pluck @ 10K', () => {
	bench('native map', () => {
		data10K.map((x) => x.value);
	});
	bench('for loop', () => {
		const result: number[] = [];
		for (let i = 0; i < data10K.length; i++) {
			result.push(data10K[i].value);
		}
		return result;
	});
});

describe('pluck @ 100K', () => {
	bench('native map', () => {
		data100K.map((x) => x.value);
	});
	bench('for loop', () => {
		const result: number[] = [];
		for (let i = 0; i < data100K.length; i++) {
			result.push(data100K[i].value);
		}
		return result;
	});
});

// ============================================================================
// CHAINED - filter + map + reduce (common pattern)
// ============================================================================

describe('chained (filter→map→sum) @ 10K', () => {
	bench('native chained', () => {
		data10K
			.filter((x) => x.active)
			.map((x) => x.value)
			.reduce((a, b) => a + b, 0);
	});
	bench('for loop', () => {
		let total = 0;
		for (let i = 0; i < data10K.length; i++) {
			if (data10K[i].active) total += data10K[i].value;
		}
		return total;
	});
});

describe('chained (filter→map→sum) @ 100K', () => {
	bench('native chained', () => {
		data100K
			.filter((x) => x.active)
			.map((x) => x.value)
			.reduce((a, b) => a + b, 0);
	});
	bench('for loop', () => {
		let total = 0;
		for (let i = 0; i < data100K.length; i++) {
			if (data100K[i].active) total += data100K[i].value;
		}
		return total;
	});
});
