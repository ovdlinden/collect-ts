#!/usr/bin/env tsx
/**
 * Check if benchmark data is fresh (for CI).
 *
 * Compares structure and validates speedup ratios haven't drifted excessively.
 * Tolerates normal variance in ops/s numbers since benchmarks aren't deterministic.
 *
 * Usage: pnpm bench:check
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataPath = join(root, 'docs/.vitepress/theme/data/benchmark-results.json');

interface BenchmarkOps {
	name: string;
	native: { ops: string };
	collectTs: { ops: string };
	speedup: string;
}

interface LazyBenchmarkResult {
	name: string;
	rawLoop: { ops: string; hz: number };
	nativeArray: { ops: string; hz: number };
	nativeGenerator: { ops: string; hz: number };
	collectionEager: { ops: string; hz: number };
	lazyCollection: { ops: string; hz: number };
}

type BenchmarkData = Record<string, BenchmarkOps[]> & { lazy?: LazyBenchmarkResult[] };

function run(cmd: string): string {
	return execSync(cmd, { encoding: 'utf-8', cwd: root, maxBuffer: 50 * 1024 * 1024 });
}

function parseSpeedup(speedup: string): number {
	const match = speedup.match(/([\d.]+)x/);
	return match ? Number.parseFloat(match[1]) : 0;
}

function checkStructure(before: BenchmarkData, after: BenchmarkData): string[] {
	const errors: string[] = [];

	const beforeSizes = Object.keys(before).filter((k) => k !== 'lazy').sort();
	const afterSizes = Object.keys(after).filter((k) => k !== 'lazy').sort();

	if (beforeSizes.join(',') !== afterSizes.join(',')) {
		errors.push(`Sizes changed: [${beforeSizes}] → [${afterSizes}]`);
		return errors;
	}

	for (const size of beforeSizes) {
		const beforeOps = (before[size] as BenchmarkOps[]).map((o) => o.name).sort();
		const afterOps = (after[size] as BenchmarkOps[])?.map((o) => o.name).sort() ?? [];

		if (beforeOps.join(',') !== afterOps.join(',')) {
			errors.push(`Operations for ${size} changed: [${beforeOps}] → [${afterOps}]`);
		}
	}

	const beforeLazy = before.lazy?.map((l) => l.name).sort() ?? [];
	const afterLazy = after.lazy?.map((l) => l.name).sort() ?? [];

	if (beforeLazy.join(',') !== afterLazy.join(',')) {
		errors.push(`Lazy scenarios changed: [${beforeLazy}] → [${afterLazy}]`);
	}

	return errors;
}

function checkSpeedupDrift(before: BenchmarkData, after: BenchmarkData): { warnings: string[]; severe: string[] } {
	const warnings: string[] = [];
	const severe: string[] = [];

	for (const size of Object.keys(before).filter((k) => k !== 'lazy')) {
		const beforeOps = before[size] as BenchmarkOps[];
		const afterOps = after[size] as BenchmarkOps[];

		for (const bOp of beforeOps) {
			const aOp = afterOps?.find((o) => o.name === bOp.name);
			if (!aOp) continue;

			const bSpeedup = parseSpeedup(bOp.speedup);
			const aSpeedup = parseSpeedup(aOp.speedup);

			if (bSpeedup > 0 && aSpeedup > 0) {
				const pctChange = Math.abs((aSpeedup - bSpeedup) / bSpeedup) * 100;

				if (pctChange > 50) {
					severe.push(`${size}/${bOp.name}: ${bOp.speedup} → ${aOp.speedup} (${pctChange.toFixed(0)}% change)`);
				} else if (pctChange > 20) {
					warnings.push(`${size}/${bOp.name}: ${bOp.speedup} → ${aOp.speedup} (${pctChange.toFixed(0)}% change)`);
				}
			}
		}
	}

	return { warnings, severe };
}

async function main() {
	const args = process.argv.slice(2);
	const skipRun = args.includes('--skip-run');

	if (!existsSync(dataPath)) {
		console.error('❌ benchmark-results.json not found');
		console.error('Run: pnpm bench:docs');
		process.exit(1);
	}

	const before: BenchmarkData = JSON.parse(readFileSync(dataPath, 'utf-8'));

	if (skipRun) {
		console.log('✅ Benchmark data exists (skipped regeneration)');
		return;
	}

	console.log('Regenerating benchmark data...\n');

	try {
		const output = run('pnpm bench:docs');
		console.log(output);
	} catch (error) {
		console.error('❌ Failed to run benchmarks');
		process.exit(1);
	}

	const after: BenchmarkData = JSON.parse(readFileSync(dataPath, 'utf-8'));

	const structureErrors = checkStructure(before, after);
	if (structureErrors.length > 0) {
		console.error('\n❌ Benchmark structure changed:\n');
		for (const err of structureErrors) {
			console.error(`  • ${err}`);
		}
		console.error('\nThis means benchmarks were added/removed/renamed.');
		console.error('Commit the updated benchmark-results.json.');
		process.exit(1);
	}

	const { warnings, severe } = checkSpeedupDrift(before, after);

	if (severe.length > 0) {
		console.error('\n❌ Severe performance changes detected:\n');
		for (const s of severe) {
			console.error(`  • ${s}`);
		}
		console.error('\nInvestigate before committing. If intentional, run:');
		console.error('  pnpm bench:docs && git add docs/.vitepress/theme/data/benchmark-results.json');
		process.exit(1);
	}

	if (warnings.length > 0) {
		console.warn('\n⚠️  Notable speedup changes:\n');
		for (const w of warnings) {
			console.warn(`  • ${w}`);
		}
		console.warn('\nConsider updating: pnpm bench:docs');
	}

	console.log('\n✅ Benchmark data is fresh');
}

main();
