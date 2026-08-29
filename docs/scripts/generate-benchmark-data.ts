/**
 * Generate benchmark data for the docs.
 *
 * Run: pnpm bench:docs
 *
 * Parses vitest bench terminal output (JSON reporter doesn't work for benchmarks)
 * and generates JSON that Benchmarks.vue imports.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface BenchmarkOps {
	name: string;
	native: { ops: string };
	collectTs: { ops: string };
	speedup: string;
}

function formatOps(hz: number): string {
	if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(1)}M`;
	if (hz >= 1_000) return `${(hz / 1_000).toFixed(1)}K`;
	return hz.toFixed(0);
}

function calculateSpeedup(collectOps: number, nativeOps: number): string {
	if (nativeOps === 0) return 'N/A';
	const ratio = collectOps / nativeOps;
	return `${ratio.toFixed(1)}x`;
}

function stripAnsi(str: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences require control chars
	return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

interface ParsedBench {
	name: string;
	hz: number;
}

interface ParsedGroup {
	operation: string;
	size: string;
	benches: ParsedBench[];
}

function parseVitestOutput(output: string, allowNoSize = false): ParsedGroup[] {
	const lines = stripAnsi(output).split('\n');
	const groups: ParsedGroup[] = [];

	let currentGroup: ParsedGroup | null = null;

	for (const line of lines) {
		// Match describe block header with size: "✓ benchmarks/... > sum @ 10K"
		const groupMatchWithSize = line.match(/[✓✗]\s+benchmarks\/[^\s>]+\s+>\s+(.+?)\s+@\s+(\d+K?M?)/i);
		if (groupMatchWithSize) {
			if (currentGroup) {
				groups.push(currentGroup);
			}
			currentGroup = {
				operation: groupMatchWithSize[1].trim(),
				size: groupMatchWithSize[2].toUpperCase(),
				benches: [],
			};
			continue;
		}

		// Match describe block header without size (for lazy.bench.ts): "✓ benchmarks/... > Early termination: ..."
		if (allowNoSize) {
			const groupMatchNoSize = line.match(/[✓✗]\s+benchmarks\/[^\s>]+\s+>\s+(.+?)(?:\s+\d+ms)?$/i);
			if (groupMatchNoSize && !line.includes('@')) {
				if (currentGroup) {
					groups.push(currentGroup);
				}
				currentGroup = {
					operation: groupMatchNoSize[1].trim(),
					size: 'N/A',
					benches: [],
				};
				continue;
			}
		}

		// Match benchmark row: "· name  hz  min  max  mean  ..."
		// The row starts with · and contains benchmark name and hz value
		if (currentGroup && line.includes('·')) {
			// Parse the benchmark line - format varies but hz is always the first number after name
			// Example: "   · native: items.reduce((a,x) => a + x.value, 0)  1,886.22  0.4518 ..."
			const benchLine = line.replace(/^\s*·\s*/, '').trim();

			// Split by multiple spaces to separate name from values
			const parts = benchLine.split(/\s{2,}/);
			if (parts.length >= 2) {
				const name = parts[0];
				// Hz is the first numeric value (may have commas like "1,886.22")
				const hzStr = parts[1]?.replace(/,/g, '');
				const hz = Number.parseFloat(hzStr);

				if (name && !Number.isNaN(hz)) {
					currentGroup.benches.push({ name, hz });
				}
			}
		}
	}

	if (currentGroup) {
		groups.push(currentGroup);
	}

	return groups;
}

const operationMappings = [
	{ key: 'sum', displayName: 'sum', nativePattern: /native.*reduce/i, collectPattern: /collect.*sum/i },
	{
		key: 'avg',
		displayName: 'avg',
		nativePattern: /native.*items\.length|reduce.*length/i,
		collectPattern: /collect.*avg/i,
	},
	{ key: 'filter', displayName: 'filter', nativePattern: /native.*filter/i, collectPattern: /collect.*where/i },
	{ key: 'pluck', displayName: 'pluck', nativePattern: /native.*map/i, collectPattern: /collect.*pluck/i },
	{ key: 'unique', displayName: 'unique', nativePattern: /native.*Set/i, collectPattern: /collect.*unique/i },
	{
		key: 'groupBy',
		displayName: 'groupBy',
		nativePattern: /native.*reduce.*acc/i,
		collectPattern: /collect.*groupBy|ArrayCollection.*groupBy/i,
	},
	{
		key: 'find',
		displayName: 'find',
		nativePattern: /native.*find/i,
		collectPattern: /collect.*firstWhere|ArrayCollection.*firstWhere/i,
	},
	{
		key: 'chained',
		displayName: 'filter → map → reduce',
		nativePattern: /native.*filter.*map.*reduce|filter\(\)\.map\(\)\.reduce/i,
		collectPattern: /collect.*where.*pluck.*sum|Collection.*where.*pluck.*sum/i,
	},
];

// Lazy benchmark scenarios
const lazyScenarios = [
	{
		key: 'early-termination',
		displayName: 'Early exit (take 10 from 1M)',
		groupPattern: /early termination/i,
	},
	{
		key: 'first-match',
		displayName: 'First match',
		groupPattern: /first match/i,
	},
	{
		key: 'chained-transforms',
		displayName: 'Chained (filter→map→filter→map)',
		groupPattern: /chained.*filter/i,
	},
	{
		key: 'full-processing',
		displayName: 'Full processing (no early exit)',
		groupPattern: /full processing/i,
	},
	{
		key: 'range',
		displayName: 'Range generation',
		groupPattern: /range.*sum/i,
	},
];

interface LazyBenchmarkResult {
	name: string;
	rawLoop: { ops: string; hz: number };
	nativeArray: { ops: string; hz: number };
	nativeGenerator: { ops: string; hz: number };
	collectionEager: { ops: string; hz: number };
	lazyCollection: { ops: string; hz: number };
}

function extractLazyBenchmarkData(groups: ParsedGroup[]): LazyBenchmarkResult[] {
	const results: LazyBenchmarkResult[] = [];

	for (const scenario of lazyScenarios) {
		const group = groups.find((g) => scenario.groupPattern.test(g.operation));
		if (!group) continue;

		const rawLoop = group.benches.find((b) => /raw for loop/i.test(b.name));
		const nativeArray = group.benches.find((b) => /native array/i.test(b.name));
		const nativeGenerator = group.benches.find((b) => /native generator/i.test(b.name));
		const collectionEager = group.benches.find((b) => /collection \(eager\)/i.test(b.name));
		const lazyCollection = group.benches.find((b) => /lazycollection/i.test(b.name));

		if (rawLoop && nativeGenerator && lazyCollection) {
			results.push({
				name: scenario.displayName,
				rawLoop: { ops: formatOps(rawLoop.hz), hz: rawLoop.hz },
				nativeArray: nativeArray ? { ops: formatOps(nativeArray.hz), hz: nativeArray.hz } : { ops: 'N/A', hz: 0 },
				nativeGenerator: { ops: formatOps(nativeGenerator.hz), hz: nativeGenerator.hz },
				collectionEager: collectionEager
					? { ops: formatOps(collectionEager.hz), hz: collectionEager.hz }
					: { ops: 'N/A', hz: 0 },
				lazyCollection: { ops: formatOps(lazyCollection.hz), hz: lazyCollection.hz },
			});
		}
	}

	return results;
}

function extractBenchmarkData(groups: ParsedGroup[]): Record<string, BenchmarkOps[]> {
	const sizes = ['10K', '100K', '1M'] as const;
	const result: Record<string, BenchmarkOps[]> = {};

	for (const size of sizes) {
		result[size] = [];

		for (const mapping of operationMappings) {
			// Find group matching this operation and size
			const group = groups.find((g) => {
				const normalizedOp = g.operation.toLowerCase();
				return normalizedOp.includes(mapping.key.toLowerCase()) && g.size === size;
			});

			if (!group) continue;

			// Find native and collect-ts benches within the group
			const nativeBench = group.benches.find((b) => mapping.nativePattern.test(b.name));
			const collectBench = group.benches.find((b) => mapping.collectPattern.test(b.name));

			if (nativeBench && collectBench) {
				result[size].push({
					name: mapping.displayName,
					native: { ops: formatOps(nativeBench.hz) },
					collectTs: { ops: formatOps(collectBench.hz) },
					speedup: calculateSpeedup(collectBench.hz, nativeBench.hz),
				});
			}
		}
	}

	return result;
}

function runBenchmark(benchFile: string): string {
	try {
		return execSync(`pnpm vitest bench ${benchFile}`, {
			encoding: 'utf-8',
			cwd: join(__dirname, '../..'),
			maxBuffer: 50 * 1024 * 1024,
			stdio: ['inherit', 'pipe', 'pipe'],
		});
	} catch (error) {
		if (error instanceof Error && 'stdout' in error) {
			const output = (error as { stdout?: string }).stdout;
			if (output) return output;
		}
		throw error;
	}
}

async function main() {
	console.log('Running benchmarks... (this may take a few minutes)\n');

	try {
		// Run eager benchmarks
		console.log('Running eager benchmarks (collect-vs-native.bench.ts)...');
		const eagerOutput = runBenchmark('benchmarks/collect-vs-native.bench.ts');
		const eagerGroups = parseVitestOutput(eagerOutput);
		console.log(`Parsed ${eagerGroups.length} eager benchmark groups`);
		const eagerData = extractBenchmarkData(eagerGroups);

		// Run lazy benchmarks
		console.log('\nRunning lazy benchmarks (lazy.bench.ts)...');
		const lazyOutput = runBenchmark('benchmarks/lazy.bench.ts');
		const lazyGroups = parseVitestOutput(lazyOutput, true);
		console.log(`Parsed ${lazyGroups.length} lazy benchmark groups`);
		const lazyData = extractLazyBenchmarkData(lazyGroups);

		// Combine results
		const data = {
			...eagerData,
			lazy: lazyData,
		};

		// Ensure data directory exists
		const dataDir = join(__dirname, '../.vitepress/theme/data');
		mkdirSync(dataDir, { recursive: true });

		const outputPath = join(dataDir, 'benchmark-results.json');
		writeFileSync(outputPath, JSON.stringify(data, null, 2));

		console.log(`\nBenchmark data written to: ${outputPath}`);
		console.log('\nEager results:', Object.keys(eagerData).length, 'sizes');
		console.log('Lazy results:', lazyData.length, 'scenarios');
	} catch (error) {
		console.error('Error running benchmarks:', error);
		process.exit(1);
	}
}

main();
