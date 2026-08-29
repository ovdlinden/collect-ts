import mediumZoom from 'medium-zoom';
import type { Theme } from 'vitepress';
import { useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { defineAsyncComponent, h, nextTick, onMounted, watch } from 'vue';

import 'virtual:group-icons.css';
import './style.css';

// Lazy load heavy, page-specific components
const Benchmarks = defineAsyncComponent(() => import('./components/Benchmarks.vue'));
const D2Diagram = defineAsyncComponent(() => import('./components/D2Diagram.vue'));
const HomepageLazyDemo = defineAsyncComponent(() => import('./components/HomepageLazyDemo.vue'));
const LazySpotlight = defineAsyncComponent(() => import('./components/LazySpotlight.vue'));

// Direct imports for small/common components
import CallbackTaxDiagram from './components/CallbackTaxDiagram.vue';
import CopyAsMarkdown from './components/CopyAsMarkdown.vue';
import SpeedupBar from './components/SpeedupBar.vue';
import StatCard from './components/StatCard.vue';

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('Benchmarks', Benchmarks);
		app.component('CallbackTaxDiagram', CallbackTaxDiagram);
		app.component('D2Diagram', D2Diagram);
		app.component('HomepageLazyDemo', HomepageLazyDemo);
		app.component('LazySpotlight', LazySpotlight);
		app.component('SpeedupBar', SpeedupBar);
		app.component('StatCard', StatCard);
	},
	Layout() {
		return h(DefaultTheme.Layout, null, {
			'doc-before': () => h('div', { class: 'doc-header-actions' }, [h(CopyAsMarkdown)]),
		});
	},
	setup() {
		const route = useRoute();
		const initZoom = () => {
			mediumZoom('.vp-doc img:not(.no-zoom)', { background: 'var(--vp-c-bg)' });
		};

		const initCopyFilter = () => {
			// Intercept copy button clicks to exclude output lines
			document.querySelectorAll('.vp-doc div[class*="language-"] button.copy').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					const codeBlock = btn.closest('div[class*="language-"]');
					if (!codeBlock) return;

					const code = codeBlock.querySelector('pre code');
					if (!code) return;

					// Get text from all lines EXCEPT output lines
					const lines = code.querySelectorAll('.line:not(.output-line)');
					const text = Array.from(lines)
						.map((line) => line.textContent || '')
						.join('\n');

					// Override clipboard
					navigator.clipboard.writeText(text);
					e.stopPropagation();
					e.preventDefault();
				});
			});
		};

		const collapseSidebarGroups = () => {
			const sidebar = document.querySelector('.VPSidebar');
			if (!sidebar) return;

			const groups = sidebar.querySelectorAll<HTMLElement>('.VPSidebarItem.level-0.is-group');
			const activeLink = sidebar.querySelector('.VPSidebarItem.is-active');

			groups.forEach((group) => {
				const containsActive = group.contains(activeLink);
				const isCollapsed = group.classList.contains('collapsed');

				if (containsActive && isCollapsed) {
					const caret = group.querySelector<HTMLElement>('.caret');
					caret?.click();
				} else if (!containsActive && !isCollapsed) {
					const caret = group.querySelector<HTMLElement>('.caret');
					caret?.click();
				}
			});
		};

		onMounted(() => {
			initZoom();
			initCopyFilter();
			nextTick(collapseSidebarGroups);
		});
		watch(
			() => route.path,
			() =>
				nextTick(() => {
					initZoom();
					initCopyFilter();
					collapseSidebarGroups();
				}),
		);
	},
} satisfies Theme;
