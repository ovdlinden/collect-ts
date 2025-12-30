import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Laravel Collection for TypeScript',
  description: 'A TypeScript port of Laravel Collection with full type safety',
  base: '/collect-ts/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#FF2D20' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: false,

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Collections', link: '/collections' },
      { text: 'GitHub', link: 'https://github.com/ovdlinden/collect-ts' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Installation', link: '/#installation' },
        ]
      },
      {
        text: 'Documentation',
        items: [
          { text: 'Collections', link: '/collections' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ovdlinden/collect-ts' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'TypeScript port of Laravel Collection'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  // Ignore dead links to Laravel docs (external references)
  ignoreDeadLinks: [
    /^https:\/\/laravel\.com/
  ]
})
