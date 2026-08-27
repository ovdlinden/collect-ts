import { type DefaultTheme, defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';
import typedocSidebar from '../api/typedoc-sidebar.json';
import { d2FencePlugin } from './plugins/markdown-d2.ts';
import { outputContainerPlugin } from './plugins/markdown-output.ts';
import { outputPreprocessPlugin } from './plugins/markdown-output-preprocess.ts';
import { transformerOutputLines } from './plugins/shiki-output.ts';

const site = {
	title: 'Laravel Collection for TypeScript',
	siteTitle: 'collect-ts',
	description: 'A TypeScript port of Laravel Collection with full type safety. Always in sync with Laravel.',
	boosted: ['/00-quickstart', '/api/'],
};

const guideSidebar = [
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
		link: '/api/',
	},
] satisfies DefaultTheme.SidebarItem[];

const sidebar: DefaultTheme.Sidebar = {
	'/api/': typedocSidebar,
	'/': guideSidebar,
};

const nav = [
	{ text: 'Quick Start', link: '/00-quickstart' },
	{ text: 'API', link: '/api/' },
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
			md.use(d2FencePlugin);
			md.use(outputContainerPlugin);
			md.use(outputPreprocessPlugin);
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
