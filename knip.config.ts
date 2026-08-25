import type { KnipConfig } from 'knip';

export default {
	project: ['src/**/*.ts'],
	ignoreDependencies: [
		'@babel/parser',
		'@babel/traverse',
		'@types/babel__traverse',
		// VitePress docs (not in src/ scope)
		'terrastruct-d2-bin',
		'medium-zoom',
		'vitepress-plugin-group-icons',
		'vitepress-plugin-llms',
		'vue',
	],
} satisfies KnipConfig;
