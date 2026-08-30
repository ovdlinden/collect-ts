import { describe, expect, it } from 'vitest';
import { transform, shouldTransform } from '../src/plugin/transform.js';

describe('Plugin Transform', () => {
	describe('shouldTransform', () => {
		it('includes JS/TS files', () => {
			expect(shouldTransform('app.js')).toBe(true);
			expect(shouldTransform('app.ts')).toBe(true);
			expect(shouldTransform('app.jsx')).toBe(true);
			expect(shouldTransform('app.tsx')).toBe(true);
		});

		it('excludes node_modules', () => {
			expect(shouldTransform('node_modules/foo/index.js')).toBe(false);
		});

		it('excludes non-JS files', () => {
			expect(shouldTransform('app.css')).toBe(false);
			expect(shouldTransform('app.json')).toBe(false);
		});
	});

	describe('transform', () => {
		it('returns null for files without collect-ts import', () => {
			const code = `
				import { something } from 'other-package';
				const x = something();
			`;
			expect(transform(code)).toBeNull();
		});

		it('returns null for files with collect import but no method calls', () => {
			const code = `
				import { collect } from 'collect-ts';
				const c = collect([1, 2, 3]);
				console.log(c.all());
			`;
			// all() is a terminal method always available, no need to import
			const result = transform(code);
			// If no known methods are used, might return null or transform
			// Let's check what happens
			expect(result).toBeNull();
		});

		it('transforms simple method chain', () => {
			const code = `
import { collect } from 'collect-ts';
const result = collect(users).filter(u => u.active).map(u => u.name);
			`;
			const result = transform(code);
			expect(result).not.toBeNull();
			expect(result!.usedMethods).toContain('filter');
			expect(result!.usedMethods).toContain('map');
			expect(result!.code).toContain("import { createCollection } from 'collect-ts/core'");
			expect(result!.code).toContain("import filterMethod from 'collect-ts/methods/filter'");
			expect(result!.code).toContain("import mapMethod from 'collect-ts/methods/map'");
			expect(result!.code).toContain('createCollection([filterMethod, mapMethod])');
		});

		it('transforms complex method chain', () => {
			const code = `
import { collect } from 'collect-ts';
const result = collect(users)
  .filter(u => u.active)
  .groupBy('role')
  .map(group => group.first());
			`;
			const result = transform(code);
			expect(result).not.toBeNull();
			expect(result!.usedMethods).toContain('filter');
			expect(result!.usedMethods).toContain('groupBy');
			expect(result!.usedMethods).toContain('map');
			expect(result!.usedMethods).toContain('first');
		});

		it('handles where methods', () => {
			const code = `
import { collect } from 'collect-ts';
collect(items).where('status', 'active').whereIn('role', ['admin', 'user']);
			`;
			const result = transform(code);
			expect(result).not.toBeNull();
			expect(result!.usedMethods).toContain('where');
			expect(result!.usedMethods).toContain('whereIn');
		});

		it('handles aggregation methods', () => {
			const code = `
import { collect } from 'collect-ts';
const total = collect(items).sum('price');
const average = collect(items).avg('rating');
			`;
			const result = transform(code);
			expect(result).not.toBeNull();
			expect(result!.usedMethods).toContain('sum');
			expect(result!.usedMethods).toContain('avg');
		});

		it('handles custom package name', () => {
			const code = `
import { collect } from '@my-org/collection';
collect(items).filter(x => x).map(x => x);
			`;
			const result = transform(code, { packageName: '@my-org/collection' });
			expect(result).not.toBeNull();
			expect(result!.code).toContain("import { createCollection } from '@my-org/collection/core'");
		});

		it('deduplicates shared modules', () => {
			const code = `
import { collect } from 'collect-ts';
collect(items).sortBy('name').sortByDesc('date');
			`;
			const result = transform(code);
			expect(result).not.toBeNull();
			// sortBy and sortByDesc share the same module
			expect(result!.code.match(/import.*from.*sortBy/g)?.length).toBe(1);
		});
	});
});
