#!/usr/bin/env tsx
/**
 * Documentation Scripts Entry Point
 *
 * CLI for checking Laravel collection documentation sync.
 *
 * Usage:
 *   pnpm docs:check    - Check method coverage and baseline freshness
 *   pnpm docs:sync     - Fetch Laravel docs and update baseline
 */

import { parseArgs } from 'node:util';
import { runCheck } from './check.js';
import { runSync } from './sync.js';

// Re-export core types for programmatic use
export { ok, err, LARAVEL_VERSION, BASELINE_PATH } from './core/types.js';
export type {
	Result,
	FetchError,
	FileError,
	CodeExample,
	MethodDoc,
	ParsedDocs,
	BaselineStatus,
} from './core/types.js';

// Re-export core functions
export { parseCollectionsDocs } from './core/parser.js';
export { compareBaseline } from './core/comparator.js';
export { extractPublicMethodsFromSource, extractPublicMethods } from './core/extractor.js';

// Re-export commands
export { runCheck } from './check.js';
export { runSync } from './sync.js';
export type { CheckResult, CheckDeps, CheckError, MethodSyncStatus } from './check.js';
export type { SyncResult, SyncDeps, SyncError } from './sync.js';

/**
 * CLI entry point
 */
async function main(): Promise<void> {
	const { values, positionals } = parseArgs({
		options: {
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	});

	const [command = 'check'] = positionals;

	if (values.help) {
		console.log(`
Documentation Sync CLI

Usage:
  docs [command] [options]

Commands:
  check     Check method coverage and baseline freshness (default)
  sync      Fetch Laravel docs and update baseline

Options:
  -h, --help     Show this help message

Examples:
  docs                    # Run check
  docs check              # Check method coverage
  docs sync               # Update baseline from Laravel
`);
		return;
	}

	switch (command) {
		case 'check': {
			const result = await runCheck();
			if (!result.ok) {
				process.exit(1);
			}
			const { baselineStatus, syncStatus } = result.value;
			if (syncStatus.missingFromTs.length > 0 || !baselineStatus.exists || !baselineStatus.upToDate) {
				process.exit(1);
			}
			break;
		}

		case 'sync': {
			const result = await runSync();
			if (!result.ok) {
				process.exit(1);
			}
			break;
		}

		default:
			console.error(`Unknown command: ${command}`);
			console.error('Run with --help for usage information');
			process.exit(1);
	}
}

// Run if executed directly
const isMain =
	typeof import.meta.url === 'string' &&
	typeof process.argv[1] === 'string' &&
	import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
	main().catch((error) => {
		console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	});
}
