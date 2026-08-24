import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	dts: false, // Using tsc directly for declarations (TS7 compatibility)
	clean: true,
	sourcemap: true,
	minify: true,
	target: 'es2022',
	outDir: 'dist',
});
