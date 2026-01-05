/**
 * Integration tests for docs:check command
 *
 * Tests the full runCheck() flow with mocked dependencies.
 * Kent C. Dodds principle: One integration test > many unit tests.
 */

import { describe, expect, it } from 'vitest';
import { type CheckDeps, runCheck } from '../../scripts/docs/check';
import { type FetchError, type FileError, type Result, err, ok } from '../../scripts/docs/core/types';

// Minimal Laravel docs markdown with one method
const MINIMAL_LARAVEL_DOCS = `
# Available Methods

<a name="method-all"></a>
#### \`all()\`

The \`all\` method returns the underlying array.

<a name="method-map"></a>
#### \`map()\`

The \`map\` method iterates through the collection.
`;

// Mock TypeScript source with 'all' method only (missing 'map')
const MOCK_COLLECTION_TS = `
export class Collection<T> {
	all(): T[] { return []; }
}
`;

// Mock TypeScript source with both methods
const MOCK_COLLECTION_TS_COMPLETE = `
export class Collection<T> {
	all(): T[] { return []; }
	map<U>(fn: (v: T) => U): Collection<U> { return this as unknown as Collection<U>; }
}
`;

// Mock LazyCollection source
const MOCK_LAZY_TS = `
export class LazyCollection<T> {
	all(): T[] { return []; }
}
`;

describe('docs:check integration', () => {
	const silentLog = () => {};

	it('returns success when methods are in sync and baseline matches', async () => {
		const deps: Partial<CheckDeps> = {
			fetchDocs: async () => ok(MINIMAL_LARAVEL_DOCS),
			readFile: (path: string): Result<string, FileError> => {
				if (path.includes('laravel-collections.md')) {
					return ok(MINIMAL_LARAVEL_DOCS); // Baseline matches
				}
				if (path.includes('Collection.ts')) {
					return ok(MOCK_COLLECTION_TS_COMPLETE);
				}
				if (path.includes('LazyCollection.ts')) {
					return ok(MOCK_LAZY_TS);
				}
				return err({ type: 'not_found', path, message: `File not found: ${path}` });
			},
			fileExists: (path: string) => path.includes('laravel-collections.md'),
			log: silentLog,
		};

		const result = await runCheck(deps);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.baselineStatus.exists).toBe(true);
			expect(result.value.baselineStatus.upToDate).toBe(true);
			expect(result.value.syncStatus.missingFromTs).toEqual([]);
		}
	});

	it('returns syncStatus.missingFromTs when TS is missing methods', async () => {
		const deps: Partial<CheckDeps> = {
			fetchDocs: async () => ok(MINIMAL_LARAVEL_DOCS),
			readFile: (path: string): Result<string, FileError> => {
				if (path.includes('laravel-collections.md')) {
					return ok(MINIMAL_LARAVEL_DOCS);
				}
				if (path.includes('Collection.ts')) {
					return ok(MOCK_COLLECTION_TS); // Missing 'map' method
				}
				if (path.includes('LazyCollection.ts')) {
					return ok(MOCK_LAZY_TS);
				}
				return err({ type: 'not_found', path, message: `File not found: ${path}` });
			},
			fileExists: (path: string) => path.includes('laravel-collections.md'),
			log: silentLog,
		};

		const result = await runCheck(deps);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.syncStatus.missingFromTs).toContain('map');
			expect(result.value.syncStatus.laravelCount).toBe(2);
			expect(result.value.syncStatus.inSyncCount).toBe(1);
		}
	});

	it('returns baselineStatus.upToDate=false when baseline differs from remote', async () => {
		const updatedLaravelDocs = `${MINIMAL_LARAVEL_DOCS}
<a name="method-filter"></a>
#### \`filter()\`

The \`filter\` method filters the collection.
`;

		const deps: Partial<CheckDeps> = {
			fetchDocs: async () => ok(updatedLaravelDocs), // New content from remote
			readFile: (path: string): Result<string, FileError> => {
				if (path.includes('laravel-collections.md')) {
					return ok(MINIMAL_LARAVEL_DOCS); // Old baseline
				}
				if (path.includes('Collection.ts')) {
					return ok(MOCK_COLLECTION_TS_COMPLETE);
				}
				if (path.includes('LazyCollection.ts')) {
					return ok(MOCK_LAZY_TS);
				}
				return err({ type: 'not_found', path, message: `File not found: ${path}` });
			},
			fileExists: (path: string) => path.includes('laravel-collections.md'),
			log: silentLog,
		};

		const result = await runCheck(deps);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.baselineStatus.exists).toBe(true);
			expect(result.value.baselineStatus.upToDate).toBe(false); // Baseline is stale
		}
	});

	it('handles network failure gracefully with existing baseline', async () => {
		const deps: Partial<CheckDeps> = {
			fetchDocs: async (): Promise<Result<string, FetchError>> =>
				err({ type: 'network', message: 'Connection refused' }),
			readFile: (path: string): Result<string, FileError> => {
				if (path.includes('laravel-collections.md')) {
					return ok(MINIMAL_LARAVEL_DOCS); // Baseline exists
				}
				if (path.includes('Collection.ts')) {
					return ok(MOCK_COLLECTION_TS_COMPLETE);
				}
				if (path.includes('LazyCollection.ts')) {
					return ok(MOCK_LAZY_TS);
				}
				return err({ type: 'not_found', path, message: `File not found: ${path}` });
			},
			fileExists: (path: string) => path.includes('laravel-collections.md'),
			log: silentLog,
		};

		const result = await runCheck(deps);

		// Should still succeed using baseline for method coverage
		expect(result.ok).toBe(true);
		if (result.ok) {
			// Method coverage still works using baseline
			expect(result.value.syncStatus.laravelCount).toBeGreaterThan(0);
		}
	});

	it('reports TS-only methods that are not in Laravel', async () => {
		const deps: Partial<CheckDeps> = {
			fetchDocs: async () => ok(MINIMAL_LARAVEL_DOCS), // Only has 'all' and 'map'
			readFile: (path: string): Result<string, FileError> => {
				if (path.includes('laravel-collections.md')) {
					return ok(MINIMAL_LARAVEL_DOCS);
				}
				if (path.includes('Collection.ts')) {
					// Has extra 'customMethod' not in Laravel
					return ok(`
export class Collection<T> {
	all(): T[] { return []; }
	map<U>(fn: (v: T) => U): Collection<U> { return this as unknown as Collection<U>; }
	customMethod(): void {}
}
					`);
				}
				if (path.includes('LazyCollection.ts')) {
					return ok(MOCK_LAZY_TS);
				}
				return err({ type: 'not_found', path, message: `File not found: ${path}` });
			},
			fileExists: (path: string) => path.includes('laravel-collections.md'),
			log: silentLog,
		};

		const result = await runCheck(deps);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.syncStatus.tsOnly).toContain('customMethod');
		}
	});
});
