import type { KnipConfig } from 'knip';

export default {
	project: ['src/**/*.ts'],
	ignoreExportsUsedInFile: true,
	ignoreDependencies: [
		'@babel/parser',
		'@babel/traverse',
		'@types/babel__traverse',
		// VitePress docs (not in src/ scope)
		'@monaco-editor/loader',
		'@tailwindcss/vite',
		'markdown-it-container',
		'medium-zoom',
		'monaco-editor',
		'tailwindcss',
		'terrastruct-d2-bin',
		'vite',
		'vite-plugin-monaco-editor',
		'vitepress-plugin-group-icons',
		'vitepress-plugin-llms',
		'vue',
	],
} satisfies KnipConfig;
