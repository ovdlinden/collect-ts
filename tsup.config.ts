import { defineConfig } from 'tsup';

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/core/index.ts',
		'src/fn/index.ts',
		'src/methods/index.ts',
		'src/methods/filter.ts',
		'src/methods/map.ts',
		'src/methods/groupBy.ts',
		'src/methods/first.ts',
		'src/methods/reduce.ts',
		'src/methods/each.ts',
		'src/methods/tap.ts',
	],
	format: ['esm'],
	dts: false, // Using tsc directly for declarations (TS7 compatibility)
	clean: true,
	sourcemap: true,
	minify: true,
	target: 'es2022',
	outDir: 'dist',
});
