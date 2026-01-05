/**
 * Sync Command
 * Fetches Laravel docs and writes to baseline file.
 *
 * Usage:
 *   pnpm docs:sync    - Fetch Laravel docs and update baseline
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASELINE_PATH, type FetchError, LARAVEL_VERSION, type Result, err, ok } from './core/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');
const DOCS_URL = `https://raw.githubusercontent.com/laravel/docs/${LARAVEL_VERSION}/collections.md`;

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
	baselinePath: string;
	bytesWritten: number;
}

export interface SyncDeps {
	fetchDocs: () => Promise<Result<string, FetchError>>;
	writeBaseline: (path: string, content: string) => void;
	log: (message: string) => void;
}

export type SyncError = { type: 'fetch' | 'write'; message: string };

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

const defaultWriteBaseline = (path: string, content: string): void => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, 'utf-8');
};

// ============================================================================
// Main Sync Function
// ============================================================================

export const runSync = async (deps: Partial<SyncDeps> = {}): Promise<Result<SyncResult, SyncError>> => {
	const { fetchDocs = defaultFetchDocs, writeBaseline = defaultWriteBaseline, log = console.log } = deps;

	const baselineFile = join(ROOT_DIR, BASELINE_PATH);

	log('\n🔄 Laravel Documentation Sync\n');

	// Fetch Laravel docs
	log('🌐 Fetching Laravel documentation...');
	const remoteResult = await fetchDocs();

	if (!remoteResult.ok) {
		log(`\n❌ ${remoteResult.error.message}\n`);
		return err({ type: 'fetch', message: remoteResult.error.message });
	}

	const content = remoteResult.value;
	log(`   ✅ Fetched from laravel/docs@${LARAVEL_VERSION}`);
	log(`   📦 ${content.length.toLocaleString()} bytes\n`);

	// Write to baseline file
	log('💾 Writing baseline...');
	try {
		writeBaseline(baselineFile, content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		log(`\n❌ Failed to write: ${message}\n`);
		return err({ type: 'write', message });
	}

	log(`   ✅ ${BASELINE_PATH}\n`);
	log('📋 Next steps:');
	log('   1. git diff scripts/docs/baseline/');
	log('   2. Review Laravel changes');
	log('   3. git add scripts/docs/baseline/ && git commit -m "sync: update Laravel docs baseline"');
	log('\n✅ Done\n');

	return ok({ baselinePath: BASELINE_PATH, bytesWritten: content.length });
};
