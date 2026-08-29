import type { KnipConfig } from 'knip';

export default {
	project: ['src/**/*.ts'],
	ignoreExportsUsedInFile: true,
	ignoreDependencies: [
		'@babel/parser',
		'@babel/traverse',
		'@types/babel__traverse',
		// VitePress docs (not in src/ scope)
		'markdown-it-container',
		'medium-zoom',
		'terrastruct-d2-bin',
		'vitepress-plugin-group-icons',
		'vitepress-plugin-llms',
		'vue',
	],
} satisfies KnipConfig;
