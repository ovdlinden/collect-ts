import { describe, expect, it } from 'vitest';
import { extractPublicMethods, extractPublicMethodsFromSource } from '../../scripts/docs/core/extractor';

describe('ts-extractor', () => {
	describe('extractPublicMethodsFromSource', () => {
		it('extracts public methods', () => {
			const source = 'class Test { public foo(): void {} bar(): void {} }';
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Test')).toEqual(['bar', 'foo']);
		});

		it('excludes private methods', () => {
			const source = 'class Test { private secret(): void {} visible(): void {} }';
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Test')).toEqual(['visible']);
		});

		it('excludes protected methods', () => {
			const source = 'class Test { protected hidden(): void {} visible(): void {} }';
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Test')).toEqual(['visible']);
		});

		it('handles overloads (extracts once)', () => {
			const source = `class Test {
        foo(): string;
        foo(x: number): string;
        foo(x?: number): string { return '' }
      }`;
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Test')).toEqual(['foo']);
		});

		it('returns empty for class without methods', () => {
			expect(extractPublicMethodsFromSource('class Empty {}', 'test.ts', 'Empty')).toEqual([]);
		});

		it('returns empty for file without class', () => {
			expect(extractPublicMethodsFromSource('function fn() {}', 'test.ts', 'Test')).toEqual([]);
		});

		it('includes static methods', () => {
			const source = 'class Test { static create(): Test { return new Test() } }';
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Test')).toEqual(['create']);
		});

		it('returns sorted method names', () => {
			const source = 'class Test { zebra(): void {} apple(): void {} mango(): void {} }';
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Test')).toEqual(['apple', 'mango', 'zebra']);
		});

		it('selects class by name when multiple classes exist', () => {
			const source = `
				class First { firstMethod(): void {} }
				class Second { secondMethod(): void {} }
			`;
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'First')).toEqual(['firstMethod']);
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'Second')).toEqual(['secondMethod']);
		});

		it('returns empty when specified class not found', () => {
			const source = 'class Actual { method(): void {} }';
			expect(extractPublicMethodsFromSource(source, 'test.ts', 'NonExistent')).toEqual([]);
		});
	});

	describe('extractPublicMethods (integration)', () => {
		it('extracts from Collection.ts', () => {
			const methods = extractPublicMethods('src/Collection.ts');
			expect(methods).toContain('map');
			expect(methods).toContain('filter');
			expect(methods).toContain('reduce');
			expect(methods).toContain('first');
			expect(methods).toContain('last');
			expect(methods.length).toBeGreaterThan(100);
		});

		it('excludes protected methods from Collection.ts', () => {
			const methods = extractPublicMethods('src/Collection.ts');
			expect(methods).not.toContain('getArrayableItems');
			expect(methods).not.toContain('getNextNumericKey');
			expect(methods).not.toContain('invalidateNextNumericKey');
		});

		it('returns sorted alphabetically', () => {
			const methods = extractPublicMethods('src/Collection.ts');
			const sorted = [...methods].sort();
			expect(methods).toEqual(sorted);
		});

		it('extracts from LazyCollection.ts with className parameter', () => {
			const methods = extractPublicMethods('src/LazyCollection.ts', 'LazyCollection');
			expect(methods).toContain('tapEach');
			expect(methods).toContain('remember');
			expect(methods).toContain('withHeartbeat');
			expect(methods).toContain('takeUntilTimeout');
		});

		it('throws helpful error for non-existent file', () => {
			expect(() => extractPublicMethods('src/NonExistent.ts')).toThrow(
				'Cannot extract methods: file not found at src/NonExistent.ts',
			);
		});
	});
});
