import { type DefaultTheme, defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';
import { d2FencePlugin } from './plugins/markdown-d2.ts';

const site = {
	title: 'Laravel Collection for TypeScript',
	siteTitle: 'collect-ts',
	description: 'A TypeScript port of Laravel Collection with full type safety. Always in sync with Laravel.',
	boosted: ['/00-quickstart', '/collections'],
};

const sidebar = [
	{
		text: 'Getting Started',
		items: [
			{ text: 'Introduction', link: '/' },
			{ text: 'Quick Start', link: '/00-quickstart' },
		],
	},
	{
		text: 'Start Here',
		items: [
			{ text: 'For Laravel Developers', link: '/for/laravel-developers' },
			{ text: 'For JavaScript Developers', link: '/for/javascript-developers' },
			{ text: 'For Lodash Users', link: '/for/lodash-users' },
		],
	},
	{
		text: 'Guide',
		items: [
			{ text: 'TypeScript', link: '/01-typescript' },
			{ text: 'Common Patterns', link: '/02-patterns' },
			{ text: 'LazyCollection', link: '/03-lazy' },
			{ text: 'Performance', link: '/05-benchmarks' },
		],
	},
	{
		text: 'API Reference',
		items: [{ text: 'Collections', link: '/collections' }],
	},
] satisfies DefaultTheme.SidebarItem[];

const nav = [
	{ text: 'Quick Start', link: '/00-quickstart' },
	{ text: 'Collections', link: '/collections' },
	{ text: 'GitHub', link: 'https://github.com/ovdlinden/collect-ts' },
] satisfies DefaultTheme.NavItem[];

export default defineConfig({
	title: site.title,
	description: site.description,
	base: '/collect-ts/',

	head: [
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/collect-ts/logo.svg' }],
		['meta', { name: 'theme-color', content: '#FF2D20' }],
	],

	cleanUrls: true,
	lastUpdated: true,

	srcExclude: ['README.md'],

	markdown: {
		config: (md) => {
			md.use(groupIconMdPlugin);
			md.use(d2FencePlugin);
		},
		theme: {
			light: 'github-light',
			dark: 'github-dark',
		},
		lineNumbers: true,
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

		search: {
			provider: 'local',
			options: {
				miniSearch: {
					searchOptions: {
						boostDocument: (id: string) => (site.boosted.some((p) => id.includes(p)) ? 2 : 1.5),
					},
				},
			},
		},
	},

	vite: {
		plugins: [groupIconVitePlugin(), llmstxt({ excludeIndexPage: false })],
	},

	ignoreDeadLinks: [/^https:\/\/laravel\.com/],
});
