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

function parseVitestOutput(output: string): ParsedGroup[] {
	const lines = stripAnsi(output).split('\n');
	const groups: ParsedGroup[] = [];

	let currentGroup: ParsedGroup | null = null;

	for (const line of lines) {
		// Match describe block header: "✓ benchmarks/... > sum @ 10K"
		const groupMatch = line.match(/[✓✗]\s+benchmarks\/[^\s>]+\s+>\s+(.+?)\s+@\s+(\d+K?M?)/i);
		if (groupMatch) {
			if (currentGroup) {
				groups.push(currentGroup);
			}
			currentGroup = {
				operation: groupMatch[1].trim(),
				size: groupMatch[2].toUpperCase(),
				benches: [],
			};
			continue;
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

async function main() {
	console.log('Running benchmarks... (this may take a few minutes)');

	try {
		const output = execSync('pnpm vitest bench benchmarks/collect-vs-native.bench.ts', {
			encoding: 'utf-8',
			cwd: join(__dirname, '../..'),
			maxBuffer: 50 * 1024 * 1024,
			stdio: ['inherit', 'pipe', 'pipe'],
		});

		const groups = parseVitestOutput(output);
		console.log(`\nParsed ${groups.length} benchmark groups`);

		const data = extractBenchmarkData(groups);

		// Ensure data directory exists
		const dataDir = join(__dirname, '../.vitepress/theme/data');
		mkdirSync(dataDir, { recursive: true });

		const outputPath = join(dataDir, 'benchmark-results.json');
		writeFileSync(outputPath, JSON.stringify(data, null, 2));

		console.log(`\nBenchmark data written to: ${outputPath}`);
		console.log('\nResults:');
		console.log(JSON.stringify(data, null, 2));
	} catch (error) {
		if (error instanceof Error && 'stdout' in error) {
			// execSync throws on non-zero exit but we might still have output
			const output = (error as { stdout?: string }).stdout;
			if (output) {
				const groups = parseVitestOutput(output);
				const data = extractBenchmarkData(groups);

				const dataDir = join(__dirname, '../.vitepress/theme/data');
				mkdirSync(dataDir, { recursive: true });

				const outputPath = join(dataDir, 'benchmark-results.json');
				writeFileSync(outputPath, JSON.stringify(data, null, 2));

				console.log(`\nBenchmark data written to: ${outputPath}`);
				console.log('\nResults:');
				console.log(JSON.stringify(data, null, 2));
				return;
			}
		}
		console.error('Error running benchmarks:', error);
		process.exit(1);
	}
}

main();
