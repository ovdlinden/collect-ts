#!/usr/bin/env tsx
/**
 * CI Benchmark Runner
 *
 * Runs vitest benchmarks and outputs JSON in github-action-benchmark format.
 * Usage: pnpm bench:ci
 */

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

interface BenchmarkResult {
	name: string;
	unit: string;
	value: number;
	range?: string;
}

async function runBenchmark(file: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const output: string[] = [];
		const proc = spawn('pnpm', ['bench', file], {
			stdio: ['inherit', 'pipe', 'pipe'],
		});

		proc.stdout?.on('data', (data) => output.push(data.toString()));
		proc.stderr?.on('data', (data) => output.push(data.toString()));

		proc.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`Benchmark ${file} failed with code ${code}`));
			} else {
				resolve(output.join(''));
			}
		});
	});
}

async function runBenchmarks(): Promise<string> {
	const files = [
		'benchmarks/collect-vs-native.bench.ts',
		'benchmarks/lazy.bench.ts',
	];

	const outputs: string[] = [];
	for (const file of files) {
		outputs.push(await runBenchmark(file));
	}
	return outputs.join('\n');
}

function stripAnsi(str: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: need to strip ANSI
	return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

function parseBenchmarkOutput(output: string): BenchmarkResult[] {
	const results: BenchmarkResult[] = [];
	const cleanOutput = stripAnsi(output);

	let currentGroup = '';
	const lines = cleanOutput.split('\n');

	for (const line of lines) {
		// Check for group headers like "✓ benchmarks/... > sum @ 10K 1234ms"
		const groupMatch = line.match(/[✓>]\s+.+?>\s+([^>]+?)\s+\d+ms/);
		if (groupMatch) {
			currentGroup = groupMatch[1].trim();
			continue;
		}

		// Match benchmark result lines:
		// "· collect-ts: collect(items).sum("value")        104,774.56  0.0079 ..."
		// "· collect-ts: collect(items).firstWhere("id", 5000)  299,367.13 ..."
		const collectMatch = line.match(
			/·\s+(collect-ts:\s*collect\([^)]+\)\.[a-zA-Z]+(?:\([^)]*\))?(?:\.[a-zA-Z]+(?:\([^)]*\))?)*)\s+([\d,]+\.?\d*)\s/,
		);
		if (collectMatch) {
			const name = collectMatch[1].trim();
			const hz = parseFloat(collectMatch[2].replace(/,/g, ''));

			if (!Number.isNaN(hz)) {
				results.push({
					name: currentGroup ? `${currentGroup} | ${name}` : name,
					unit: 'ops/sec',
					value: hz,
				});
			}
			continue;
		}

		// Match lazy benchmark result lines:
		// "· LazyCollection        123,456.78  0.0079 ..."
		// "· Collection (eager)    234,567.89  0.0079 ..."
		const lazyMatch = line.match(/·\s+(LazyCollection|Collection \(eager\)|LazyCollection\.range)\s+([\d,]+\.?\d*)\s/);
		if (lazyMatch) {
			const name = lazyMatch[1].trim();
			const hz = parseFloat(lazyMatch[2].replace(/,/g, ''));

			if (!Number.isNaN(hz)) {
				results.push({
					name: currentGroup ? `${currentGroup} | ${name}` : name,
					unit: 'ops/sec',
					value: hz,
				});
			}
		}
	}

	return results;
}

async function main() {
	console.log('Running benchmarks...\n');

	try {
		const output = await runBenchmarks();

		// Also print the raw output for visibility
		console.log(output);

		const results = parseBenchmarkOutput(output);

		if (results.length === 0) {
			console.error('No benchmark results found!');
			process.exit(1);
		}

		console.log('\n--- Parsed Results ---');
		for (const r of results) {
			console.log(`${r.name}: ${r.value.toLocaleString()} ${r.unit}`);
		}

		// Write JSON for github-action-benchmark
		const outputPath = process.env.BENCHMARK_OUTPUT || 'benchmark-results.json';
		writeFileSync(outputPath, JSON.stringify(results, null, 2));
		console.log(`\nResults written to ${outputPath}`);
	} catch (error) {
		console.error('Benchmark failed:', error);
		process.exit(1);
	}
}

main();
