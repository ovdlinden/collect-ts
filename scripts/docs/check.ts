/**
 * Check Command
 * Checks method sync status and baseline freshness.
 *
 * Flow:
 * 1. Load baseline file (if exists)
 * 2. Fetch current Laravel docs
 * 3. Compare baseline vs fetched (simple string comparison)
 * 4. Parse Laravel docs → extract method names
 * 5. Parse TypeScript source → extract method names
 * 6. Compare method lists → report coverage
 * 7. Exit code: 1 if missing methods OR baseline outdated
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from '../../src/index.js';
import { compareBaseline } from './core/comparator.js';
import { extractPublicMethodsFromSource } from './core/extractor.js';
import { parseCollectionsDocs } from './core/parser.js';
import {
	BASELINE_PATH,
	type BaselineStatus,
	err,
	type FetchError,
	type FileError,
	LARAVEL_VERSION,
	ok,
	type Result,
} from './core/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');
const DOCS_URL = `https://raw.githubusercontent.com/laravel/docs/${LARAVEL_VERSION}/collections.md`;

// ============================================================================
// Types
// ============================================================================

export interface MethodSyncStatus {
	laravelCount: number;
	tsCount: number;
	inSyncCount: number;
	missingFromTs: string[];
	tsOnly: string[];
}

export interface CheckResult {
	baselineStatus: BaselineStatus;
	syncStatus: MethodSyncStatus;
}

export interface CheckDeps {
	fetchDocs: () => Promise<Result<string, FetchError>>;
	readFile: (path: string) => Result<string, FileError>;
	fileExists: (path: string) => boolean;
	log: (message: string) => void;
}

export type CheckError = { type: 'fetch' | 'file' | 'parse'; message: string };

// ============================================================================
// Default Implementations
// ============================================================================

const defaultFetchDocs = async (): Promise<Result<string, FetchError>> => {
	try {
		const response = await fetch(DOCS_URL);
		if (!response.ok) {
			return err({
				type: 'http',
				message: `HTTP ${response.status}: ${response.statusText}`,
				status: response.status,
			});
		}
		return ok(await response.text());
	} catch (error) {
		return err({
			type: 'network',
			message: error instanceof Error ? error.message : String(error),
		});
	}
};

const defaultReadFile = (path: string): Result<string, FileError> => {
	try {
		if (!existsSync(path)) {
			return err({ type: 'not_found', path, message: `File not found: ${path}` });
		}
		return ok(readFileSync(path, 'utf-8'));
	} catch (error) {
		return err({
			type: 'read',
			path,
			message: error instanceof Error ? error.message : String(error),
		});
	}
};

const defaultFileExists = (path: string): boolean => existsSync(path);

// ============================================================================
// Output Formatting
// ============================================================================

function printMethodSyncStatus(log: (msg: string) => void, status: MethodSyncStatus): void {
	const syncPercent = status.laravelCount > 0 ? ((status.inSyncCount / status.laravelCount) * 100).toFixed(1) : '0.0';

	log('📊 Method Sync Status');
	log(`   Laravel: ${status.laravelCount} methods`);
	log(`   collect-ts: ${status.tsCount} methods`);
	log(`   Coverage: ${status.inSyncCount}/${status.laravelCount} (${syncPercent}%)`);

	if (status.missingFromTs.length > 0) {
		log('');
		log(`   ⚠️  Missing from collect-ts (${status.missingFromTs.length}):`);
		for (const m of status.missingFromTs) {
			log(`      • ${m}`);
		}
	}

	if (status.tsOnly.length > 0) {
		log('');
		log(`   ℹ️  TS-only methods (${status.tsOnly.length}):`);
		for (const m of status.tsOnly) {
			log(`      • ${m}`);
		}
	}
}

function printBaselineStatus(log: (msg: string) => void, status: BaselineStatus): void {
	log('');
	log('📋 Laravel Baseline');

	if (!status.exists) {
		log('   ⚠️  No baseline file found!');
		log('      Run: pnpm docs:sync');
		log('      Then: git add scripts/docs/baseline/');
	} else if (status.upToDate) {
		log(`   ✅ Up to date with laravel/docs@${LARAVEL_VERSION}`);
	} else {
		log('   ⚠️  Laravel docs changed!');
		log('      Run: pnpm docs:sync');
		log('      Then: git diff scripts/docs/baseline/');
	}
}

// ============================================================================
// Main Check Function
// ============================================================================

export const runCheck = async (deps: Partial<CheckDeps> = {}): Promise<Result<CheckResult, CheckError>> => {
	const {
		fetchDocs = defaultFetchDocs,
		readFile = defaultReadFile,
		fileExists = defaultFileExists,
		log = console.log,
	} = deps;

	const baselineFile = join(ROOT_DIR, BASELINE_PATH);

	log('\n🔄 Documentation Check\n');

	// Step 1: Load baseline file (if exists)
	const baseline = fileExists(baselineFile) ? readFile(baselineFile) : null;
	const baselineContent = baseline?.ok ? baseline.value : null;

	// Step 2: Fetch current Laravel docs
	log('🌐 Fetching Laravel documentation...');
	const remoteResult = await fetchDocs();

	if (!remoteResult.ok) {
		// Network failure - warn but continue with method coverage
		log(`   ⚠️  Could not fetch: ${remoteResult.error.message}`);
		log('   Skipping baseline check...\n');

		// Can still do method coverage if we have the baseline
		if (baselineContent) {
			const laravelDocs = parseCollectionsDocs(baselineContent);
			const syncStatus = await computeMethodSync(laravelDocs, readFile);
			printMethodSyncStatus(log, syncStatus);

			log('\n📋 Laravel Baseline');
			log('   ⚠️  Could not check (network unavailable)');

			log(syncStatus.missingFromTs.length > 0 ? '\n⚠️  Completed with issues\n' : '\n✅ Done\n');

			return ok({
				baselineStatus: { exists: true, upToDate: true, baselinePath: BASELINE_PATH },
				syncStatus,
			});
		}

		return err({ type: 'fetch', message: remoteResult.error.message });
	}

	log(`   ✅ Fetched from laravel/docs@${LARAVEL_VERSION}\n`);

	// Step 3: Compare baseline vs fetched
	const baselineStatus = compareBaseline(baselineContent, remoteResult.value);

	// Step 4-5: Parse and compare methods
	const laravelDocs = parseCollectionsDocs(remoteResult.value);
	const syncStatus = await computeMethodSync(laravelDocs, readFile);

	// Step 6: Print results
	printMethodSyncStatus(log, syncStatus);
	printBaselineStatus(log, baselineStatus);

	// Step 7: Determine exit status
	const hasIssues = syncStatus.missingFromTs.length > 0 || !baselineStatus.exists || !baselineStatus.upToDate;
	log(hasIssues ? '\n⚠️  Completed with issues\n' : '\n✅ Done\n');

	return ok({ baselineStatus, syncStatus });
};

/**
 * Compute method sync status between Laravel docs and TypeScript source
 */
async function computeMethodSync(
	laravelDocs: ReturnType<typeof parseCollectionsDocs>,
	readFile: (path: string) => Result<string, FileError>,
): Promise<MethodSyncStatus> {
	const laravelMethods = laravelDocs.methods.pluck('name').sort();

	// Read source files
	const collectionSource = readFile(join(ROOT_DIR, 'src', 'Collection.ts'));
	const lazySource = readFile(join(ROOT_DIR, 'src', 'LazyCollection.ts'));

	const collectionMethods = collectionSource.ok
		? extractPublicMethodsFromSource(collectionSource.value, 'Collection.ts', 'Collection')
		: [];
	const lazyMethods = lazySource.ok
		? extractPublicMethodsFromSource(lazySource.value, 'LazyCollection.ts', 'LazyCollection')
		: [];

	const tsMethods = collect([...collectionMethods, ...lazyMethods])
		.unique()
		.sort();

	const missingFromTs = laravelMethods.diff(tsMethods.all());
	const tsOnly = tsMethods.diff(laravelMethods.all());

	return {
		laravelCount: laravelMethods.count(),
		tsCount: tsMethods.count(),
		inSyncCount: laravelMethods.count() - missingFromTs.count(),
		missingFromTs: missingFromTs.all(),
		tsOnly: tsOnly.all(),
	};
}
