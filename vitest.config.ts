import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		include: ['tests/**/*.test.ts'],
		benchmark: {
			include: ['benchmarks/**/*.bench.ts'],
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov', 'json', 'json-summary'],
			include: ['src/**/*.ts'],
			exclude: ['src/index.ts'],
		},
	},
});
