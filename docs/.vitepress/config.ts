import { type DefaultTheme, defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';
import { outputContainerPlugin } from './plugins/markdown-output.ts';
import { outputPreprocessPlugin } from './plugins/markdown-output-preprocess.ts';
import { transformerOutputLines } from './plugins/shiki-output.ts';

const site = {
	title: 'Laravel Collection for TypeScript',
	siteTitle: 'collect-ts',
	description: 'A TypeScript port of Laravel Collection with full type safety. Always in sync with Laravel.',
	boosted: ['/00-quickstart', '/collections/'],
};

const sidebar: DefaultTheme.SidebarItem[] = [
	{
		text: 'Getting Started',
		collapsed: false,
		items: [
			{ text: 'Introduction', link: '/' },
			{ text: 'Quick Start', link: '/00-quickstart' },
		],
	},
	{
		text: 'Guide',
		collapsed: true,
		items: [
			{ text: 'TypeScript', link: '/01-typescript' },
			{ text: 'Common Patterns', link: '/02-patterns' },
			{ text: 'LazyCollection', link: '/03-lazy' },
			{ text: 'Performance', link: '/05-benchmarks' },
			{
				text: 'Coming From...',
				collapsed: true,
				items: [
					{ text: 'Laravel', link: '/for/laravel-developers' },
					{ text: 'JavaScript', link: '/for/javascript-developers' },
					{ text: 'Lodash', link: '/for/lodash-users' },
				],
			},
		],
	},
	{
		text: 'Collections',
		collapsed: true,
		items: [
			{ text: 'Overview', link: '/collections/' },
			{ text: 'Creating', link: '/collections/creating' },
			{ text: 'Finding', link: '/collections/finding' },
			{ text: 'Filtering', link: '/collections/filtering' },
			{ text: 'Transforming', link: '/collections/transforming' },
			{ text: 'Grouping', link: '/collections/grouping' },
			{ text: 'Aggregating', link: '/collections/aggregating' },
			{ text: 'Sorting', link: '/collections/sorting' },
			{ text: 'Combining', link: '/collections/combining' },
			{ text: 'Checking', link: '/collections/checking' },
		],
	},
];

const nav = [
	{ text: 'Quick Start', link: '/00-quickstart' },
	{ text: 'Collections', link: '/collections/' },
	{ text: 'GitHub', link: 'https://github.com/ovdlinden/collect-ts' },
] satisfies DefaultTheme.NavItem[];

export default defineConfig({
	title: site.title,
	description: site.description,
	base: '/',

	head: [
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
		['meta', { name: 'theme-color', content: '#FF2D20' }],
	],

	cleanUrls: true,
	lastUpdated: true,

	srcExclude: ['README.md'],

	markdown: {
		config: (md) => {
			md.use(groupIconMdPlugin);
			md.use(outputContainerPlugin);
			// Note: outputPreprocessPlugin removed - using Shiki transformer instead
		},
		codeTransformers: [transformerOutputLines()],
		theme: {
			light: 'github-light',
			dark: 'github-dark',
		},
		lineNumbers: false,
	},

	themeConfig: {
		logo: '/logo.svg',
		siteTitle: false,
		outline: { level: [2, 3], label: 'On this page' },

		nav,
		sidebar,

		socialLinks: [{ icon: 'github', link: 'https://github.com/ovdlinden/collect-ts' }],

		footer: {
			message: 'Released under the MIT License.',
			copyright: 'TypeScript port of Laravel Collection',
		},

		// Custom search powered by collect-ts - see FastSearch.vue
		// search: { provider: 'local' },
	},

	vite: {
		plugins: [groupIconVitePlugin(), llmstxt({ excludeIndexPage: false })],
	},

	ignoreDeadLinks: [/^https:\/\/laravel\.com/],
});
